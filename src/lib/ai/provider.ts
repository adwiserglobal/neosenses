/**
 * Camada de acesso aos provedores de IA.
 *
 * Funciona em Node/Next e também em runtimes Netlify que expõem secrets por
 * `Netlify.env.get()`. A chave nunca é enviada ao navegador.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  responseTimeMs: number;
  finishReason?: string;
}

export interface AIProviderConfig {
  provider: "openrouter" | "gemini" | "openai" | "anthropic";
  model: string;
  apiKey: string;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  json?: boolean;
  thinking?: "low" | "medium" | "high";
}

export type AIErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_AUTH_FAILURE"
  | "AI_RATE_LIMIT"
  | "AI_TIMEOUT"
  | "AI_UNSUPPORTED_MODEL"
  | "AI_CONTENT_BLOCKED"
  | "AI_EMPTY_RESPONSE"
  | "AI_PROVIDER_ERROR";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly detail?: string;

  constructor(code: AIErrorCode, detail?: string) {
    super(code);
    this.name = "AIError";
    this.code = code;
    this.detail = detail;
  }
}

type NetlifyGlobal = {
  Netlify?: {
    env?: {
      get?: (name: string) => string | undefined;
    };
  };
};

/**
 * Netlify Functions/Next normalmente expõem `process.env`, mas secrets e
 * Edge runtimes podem expor valores por `Netlify.env.get()`. Usar os dois
 * evita o caso em que a secret existe no painel e o servidor não a enxerga.
 */
function lerEnv(nome: string): string | undefined {
  const peloProcesso = typeof process !== "undefined" ? process.env[nome] : undefined;
  if (peloProcesso && peloProcesso.trim()) return peloProcesso;

  try {
    const netlify = (globalThis as typeof globalThis & NetlifyGlobal).Netlify;
    const valor = netlify?.env?.get?.(nome);
    return valor && valor.trim() ? valor : undefined;
  } catch {
    return undefined;
  }
}

const DEFAULT_TIMEOUT_MS = Number(lerEnv("AI_TIMEOUT_MS") ?? 45_000);
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

function ehPlaceholder(key: string | undefined): key is undefined {
  if (!key) return true;
  const k = key.trim();
  if (k.length < 20) return true;
  return (
    k.startsWith("sk-xx") ||
    k.startsWith("your-") ||
    k.startsWith("<") ||
    k === "change-me" ||
    k.toLowerCase().includes("your_api_key")
  );
}

export function detectAIConfig(): AIProviderConfig | null {
  const explicito = lerEnv("AI_PROVIDER")?.trim().toLowerCase();
  const modelo = lerEnv("AI_MODEL")?.trim() || "";

  const chaves = {
    openrouter: lerEnv("OPENROUTER_API_KEY"),
    gemini: lerEnv("GOOGLE_GENERATIVE_AI_API_KEY"),
    openai: lerEnv("OPENAI_API_KEY") || lerEnv("AI_API_KEY"),
    anthropic: lerEnv("ANTHROPIC_API_KEY"),
  } as const;

  const montar = (p: keyof typeof chaves): AIProviderConfig | null => {
    const key = chaves[p];
    if (ehPlaceholder(key)) return null;
    return { provider: p, model: modelo, apiKey: key.trim() };
  };

  if (explicito === "openrouter" || explicito === "router") return montar("openrouter");
  if (explicito === "gemini" || explicito === "google") return montar("gemini");
  if (explicito === "openai") return montar("openai");
  if (explicito === "anthropic" || explicito === "claude") return montar("anthropic");

  // Se não houver AI_PROVIDER explícito, OpenRouter é a primeira opção.
  return montar("openrouter") || montar("gemini") || montar("openai") || montar("anthropic");
}

export function validateAIConfig(): {
  valid: boolean;
  provider?: string;
  model?: string;
  error?: string;
} {
  const cfg = detectAIConfig();
  if (!cfg) {
    return {
      valid: false,
      error:
        "Nenhum provedor de IA configurado. Defina OPENROUTER_API_KEY, " +
        "GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY.",
    };
  }
  return {
    valid: true,
    provider: cfg.provider,
    model: cfg.model || "(padrão do provedor)",
  };
}

const modeloResolvido = new Map<string, { model: string; expiraEm: number }>();
const CACHE_MODELO_MS = 60 * 60 * 1000;

export function limparCacheDeModelo(provider?: string): void {
  if (provider) modeloResolvido.delete(provider);
  else modeloResolvido.clear();
}

const GEMINI_INADEQUADO =
  /(-image|-tts|-audio|-embedding|-customtools|-exp\b|thinking|aqa|learnlm|imagen|veo)/;
const GEMINI_INSTAVEL = /(-preview|-latest|-\d{3,})/;

interface ModeloGemini {
  nome: string;
  versao: number;
  familia: number;
}

function classificarGemini(nome: string): ModeloGemini | null {
  const m = nome.match(/^gemini-(\d+(?:\.\d+)?)-(pro|flash)(-lite)?$/);
  if (!m) return null;
  const [, versao, tipo, lite] = m;
  const familia = lite ? 1 : tipo === "flash" ? 3 : 2;
  return { nome, versao: parseFloat(versao), familia };
}

async function descobrirModeloGemini(apiKey: string): Promise<string> {
  const cache = modeloResolvido.get("gemini");
  if (cache && cache.expiraEm > Date.now()) return cache.model;

  let disponiveis: string[] = [];
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json();
      disponiveis = (data.models || [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: { name: string }) => m.name.replace(/^models\//, ""))
        .filter((n: string) => !GEMINI_INADEQUADO.test(n));
    }
  } catch {
    // Cai no fallback conhecido abaixo.
  }

  const ordenar = (a: ModeloGemini, b: ModeloGemini) =>
    b.familia - a.familia || b.versao - a.versao;

  const estaveis = disponiveis
    .filter((n) => !GEMINI_INSTAVEL.test(n))
    .map(classificarGemini)
    .filter((m): m is ModeloGemini => m !== null)
    .sort(ordenar);

  let escolhido = estaveis[0]?.nome ?? "";

  if (!escolhido) {
    escolhido =
      disponiveis
        .map((n) => classificarGemini(n.replace(GEMINI_INSTAVEL, "")))
        .filter((m): m is ModeloGemini => m !== null)
        .sort(ordenar)
        .map((m) => disponiveis.find((n) => n.startsWith(m.nome)))
        .find(Boolean) ?? "";
  }

  if (!escolhido) escolhido = "gemini-2.0-flash";

  modeloResolvido.set("gemini", { model: escolhido, expiraEm: Date.now() + CACHE_MODELO_MS });
  return escolhido;
}

async function resolverModelo(cfg: AIProviderConfig): Promise<string> {
  if (cfg.model) return cfg.model;

  switch (cfg.provider) {
    case "openrouter":
      // Modelo gratuito fixo e estável. Evita a variabilidade do router free
      // como modelo primário; fallbacks continuam sendo aplicados abaixo.
      return "google/gemma-4-31b-it:free";
    case "gemini":
      return descobrirModeloGemini(cfg.apiKey);
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-sonnet-4-5";
  }
}

function classificarErro(err: unknown, status?: number, corpo?: string): AIError {
  if (err instanceof AIError) return err;

  const msg = err instanceof Error ? err.message : String(err ?? "");
  const texto = `${status ?? ""} ${corpo ?? ""} ${msg}`.toLowerCase();

  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return new AIError("AI_TIMEOUT", msg);
  }
  if (
    status === 401 ||
    status === 403 ||
    texto.includes("api key") ||
    texto.includes("unauthorized") ||
    texto.includes("invalid key")
  ) {
    return new AIError("AI_AUTH_FAILURE", corpo || msg);
  }
  if (
    status === 429 ||
    texto.includes("rate limit") ||
    texto.includes("quota") ||
    texto.includes("resource_exhausted")
  ) {
    return new AIError("AI_RATE_LIMIT", corpo || msg);
  }
  if (
    status === 404 ||
    texto.includes("not found") ||
    texto.includes("does not exist") ||
    texto.includes("unsupported model")
  ) {
    return new AIError("AI_UNSUPPORTED_MODEL", corpo || msg);
  }
  if (texto.includes("safety") || texto.includes("blocked") || texto.includes("content_filter")) {
    return new AIError("AI_CONTENT_BLOCKED", corpo || msg);
  }
  if (texto.includes("timeout") || texto.includes("etimedout") || texto.includes("econnreset")) {
    return new AIError("AI_TIMEOUT", msg);
  }
  return new AIError("AI_PROVIDER_ERROR", corpo || msg);
}

export async function generateAIResponse(
  messages: ChatMessage[],
  config?: AIProviderConfig | null,
  options: GenerateOptions = {}
): Promise<AIResponse> {
  const cfg = config || detectAIConfig();
  if (!cfg) throw new AIError("AI_PROVIDER_NOT_CONFIGURED");

  const model = await resolverModelo(cfg);
  const inicio = Date.now();

  try {
    switch (cfg.provider) {
      case "openrouter":
        return await chamarOpenRouter(messages, { ...cfg, model }, options, inicio);
      case "gemini":
        return await chamarGemini(messages, { ...cfg, model }, options, inicio);
      case "openai":
        return await chamarOpenAI(messages, { ...cfg, model }, options, inicio);
      case "anthropic":
        return await chamarAnthropic(messages, { ...cfg, model }, options, inicio);
    }
  } catch (err) {
    throw classificarErro(err);
  }
}

async function lerCorpoErro(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 1000);
  } catch {
    return "";
  }
}

function extrairConteudoChat(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";

  return content
    .map((parte) => {
      if (typeof parte === "string") return parte;
      if (!parte || typeof parte !== "object") return "";
      const p = parte as { text?: unknown; content?: unknown };
      if (typeof p.text === "string") return p.text;
      if (typeof p.content === "string") return p.content;
      return "";
    })
    .join("")
    .trim();
}

async function chamarGemini(
  messages: ChatMessage[],
  cfg: AIProviderConfig,
  opts: GenerateOptions,
  inicio: number
): Promise<AIResponse> {
  const system = messages.find((m) => m.role === "system");
  const conversa = messages.filter((m) => m.role !== "system");

  const contents = conversa
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))
    .filter((c, i, arr) => !(i === 0 && c.role === "model") || arr.length === 1);

  const montarCorpo = (comThinking: boolean): string => {
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
        ...(comThinking && opts.thinking
          ? { thinkingConfig: { thinkingLevel: opts.thinking } }
          : {}),
      },
    };
    if (system) body.systemInstruction = { parts: [{ text: system.content }] };
    return JSON.stringify(body);
  };

  const chamar = (comThinking: boolean) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.apiKey },
      body: montarCorpo(comThinking),
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });

  let res = await chamar(true);
  if (!res.ok && res.status === 400 && opts.thinking) res = await chamar(false);
  if (!res.ok) throw classificarErro(null, res.status, await lerCorpoErro(res));

  const data = await res.json();
  const candidato = data.candidates?.[0];

  if (data.promptFeedback?.blockReason) {
    throw new AIError("AI_CONTENT_BLOCKED", `prompt: ${data.promptFeedback.blockReason}`);
  }
  if (candidato?.finishReason === "SAFETY" || candidato?.finishReason === "PROHIBITED_CONTENT") {
    throw new AIError("AI_CONTENT_BLOCKED", candidato.finishReason);
  }

  const content = (candidato?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  if (!content) {
    const motivo = candidato?.finishReason ?? "?";
    const detalhe =
      motivo === "MAX_TOKENS"
        ? `finishReason=MAX_TOKENS — orçamento consumido pelo raciocínio (${data.usageMetadata?.thoughtsTokenCount ?? "?"} tokens)`
        : `finishReason=${motivo}`;
    throw new AIError("AI_EMPTY_RESPONSE", detalhe);
  }

  return {
    content,
    provider: "gemini",
    model: cfg.model,
    tokensUsed: data.usageMetadata?.totalTokenCount,
    responseTimeMs: Date.now() - inicio,
    finishReason: candidato?.finishReason,
  };
}

function modelosOpenRouter(cfg: AIProviderConfig, json: boolean): string[] {
  const preferido =
    !cfg.model || cfg.model === "openrouter/free"
      ? "google/gemma-4-31b-it:free"
      : cfg.model;

  const candidatos = json
    ? [preferido, "google/gemma-4-31b-it:free", "openrouter/free"]
    : [
        preferido,
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "openrouter/free",
      ];

  return [...new Set(candidatos)];
}

async function chamarOpenRouter(
  messages: ChatMessage[],
  cfg: AIProviderConfig,
  opts: GenerateOptions,
  inicio: number
): Promise<AIResponse> {
  const siteUrl = lerEnv("NEXT_PUBLIC_SITE_URL") || "https://www.neosenses.com.br";
  const models = modelosOpenRouter(cfg, Boolean(opts.json));

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-OpenRouter-Title": "NeoSenses Concierge",
    },
    body: JSON.stringify({
      // O OpenRouter tenta a lista em ordem quando um modelo está fora do ar,
      // rate-limited ou recusa a requisição.
      models,
      messages,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      provider: { allow_fallbacks: true },
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const corpo = await lerCorpoErro(res);
    console.error(`[openrouter] HTTP ${res.status}: ${corpo}`);
    throw classificarErro(null, res.status, corpo);
  }

  const data = await res.json();
  const escolha = data.choices?.[0];
  const content = extrairConteudoChat(escolha?.message?.content);

  if (!content) {
    throw new AIError(
      "AI_EMPTY_RESPONSE",
      `model=${data.model ?? models[0]}; finish_reason=${escolha?.finish_reason ?? "?"}`
    );
  }

  return {
    content,
    provider: "openrouter",
    model: data.model || models[0],
    tokensUsed: data.usage?.total_tokens,
    responseTimeMs: Date.now() - inicio,
    finishReason: escolha?.finish_reason,
  };
}

async function chamarOpenAI(
  messages: ChatMessage[],
  cfg: AIProviderConfig,
  opts: GenerateOptions,
  inicio: number
): Promise<AIResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      max_completion_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) throw classificarErro(null, res.status, await lerCorpoErro(res));

  const data = await res.json();
  const escolha = data.choices?.[0];
  const content = extrairConteudoChat(escolha?.message?.content);

  if (!content) {
    throw new AIError("AI_EMPTY_RESPONSE", `finish_reason=${escolha?.finish_reason ?? "?"}`);
  }

  return {
    content,
    provider: "openai",
    model: cfg.model,
    tokensUsed: data.usage?.total_tokens,
    responseTimeMs: Date.now() - inicio,
    finishReason: escolha?.finish_reason,
  };
}

async function chamarAnthropic(
  messages: ChatMessage[],
  cfg: AIProviderConfig,
  opts: GenerateOptions,
  inicio: number
): Promise<AIResponse> {
  const system = messages.find((m) => m.role === "system");
  const conversa = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      ...(system ? { system: system.content } : {}),
      messages: conversa.map((m) => ({ role: m.role, content: m.content })),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) throw classificarErro(null, res.status, await lerCorpoErro(res));

  const data = await res.json();
  const content = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();

  if (!content) {
    throw new AIError("AI_EMPTY_RESPONSE", `stop_reason=${data.stop_reason ?? "?"}`);
  }

  return {
    content,
    provider: "anthropic",
    model: cfg.model,
    tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    responseTimeMs: Date.now() - inicio,
    finishReason: data.stop_reason,
  };
}

export async function testAIConnection(): Promise<{
  success: boolean;
  provider?: string;
  model?: string;
  responseTimeMs?: number;
  error?: string;
  errorCode?: string;
}> {
  const cfg = detectAIConfig();
  if (!cfg) {
    return {
      success: false,
      errorCode: "AI_PROVIDER_NOT_CONFIGURED",
      error: "Nenhum provedor configurado",
    };
  }

  try {
    const model = await resolverModelo(cfg);
    const r = await generateAIResponse(
      [
        { role: "system", content: "Responda exatamente: OK" },
        { role: "user", content: "teste" },
      ],
      { ...cfg, model },
      { maxTokens: 256, temperature: 0, thinking: "low" }
    );
    return {
      success: true,
      provider: r.provider,
      model: r.model,
      responseTimeMs: r.responseTimeMs,
    };
  } catch (err) {
    const e = err instanceof AIError ? err : classificarErro(err);
    return {
      success: false,
      provider: cfg.provider,
      errorCode: e.code,
      error: e.detail || e.code,
    };
  }
}
