/**
 * Camada de acesso aos provedores de IA.
 *
 * Provedor e modelo vêm do ambiente:
 *   AI_PROVIDER  — "gemini" | "openai" | "anthropic" (vazio = detecta pela chave)
 *   AI_MODEL     — vazio = escolhe sozinho o melhor modelo disponível na conta
 *   GOOGLE_GENERATIVE_AI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY
 *
 * Nada aqui roda no navegador. A chave nunca sai do servidor.
 */

// ── Tipos ──────────────────────────────────────────────────────────────────
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
  /** Motivo do fim da geração. "length" indica resposta cortada por limite. */
  finishReason?: string;
}

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "anthropic";
  /** Vazio quando o modelo ainda será descoberto na primeira chamada. */
  model: string;
  apiKey: string;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Pede resposta em JSON. Usado pelo Journey Builder e pelo Packing. */
  json?: boolean;
  /**
   * Esforço de raciocínio interno (Gemini 3+).
   *
   * Esse raciocínio é cobrado como token de saída e sai do mesmo orçamento
   * do maxTokens: medido em gemini-3.6-flash, ~110 tokens são gastos antes
   * da primeira letra da resposta. "low" reduz latência e custo e serve para
   * conversa; deixe no padrão do modelo quando a tarefa exigir planejamento,
   * como montar um roteiro de 10 dias.
   *
   * Modelo que não conheça o parâmetro responde HTTP 400 — nesse caso a
   * chamada é repetida sem ele automaticamente.
   */
  thinking?: "low" | "medium" | "high";
}

/** Erros que a aplicação sabe traduzir para o visitante. */
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
  /** Detalhe técnico — vai para o log, nunca para o visitante. */
  readonly detail?: string;

  constructor(code: AIErrorCode, detail?: string) {
    super(code);
    this.name = "AIError";
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Tempo máximo de espera pelo provedor.
 *
 * Medido em gemini-3.5-flash: pergunta comum responde em 1,4 a 4,5 s, mas
 * pedido de resposta detalhada passa de 25 s e era abortado — o visitante
 * recebia "a resposta demorou mais que o esperado" numa chamada que teria
 * dado certo.
 *
 * Atenção ao publicar: a hospedagem impõe o seu próprio limite por requisição
 * (na Vercel, 10 s no plano gratuito). Um valor aqui maior que o da
 * hospedagem não adianta nada — quem corta é ela.
 */
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 45_000);
/**
 * Orçamento de saída folgado de propósito. Nos modelos com raciocínio
 * interno ele sai deste mesmo total, e um valor apertado devolve resposta
 * vazia com finishReason=MAX_TOKENS — falha silenciosa, difícil de ligar à
 * causa. O tamanho da resposta é controlado pelo prompt, não por aqui.
 */
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TEMPERATURE = 0.7;

// ── Detecção de configuração ───────────────────────────────────────────────

/**
 * Chave de placeholder é pior que chave ausente: passa na validação e falha
 * só na chamada, quando o visitante já está esperando resposta.
 */
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
  const explicito = process.env.AI_PROVIDER?.trim().toLowerCase();
  const modelo = process.env.AI_MODEL?.trim() || "";

  const chaves = {
    gemini: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openai: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  } as const;

  const montar = (p: keyof typeof chaves): AIProviderConfig | null => {
    const key = chaves[p];
    if (ehPlaceholder(key)) return null;
    return { provider: p, model: modelo, apiKey: key.trim() };
  };

  // Provedor declarado no ambiente tem precedência.
  if (explicito === "gemini" || explicito === "google") return montar("gemini");
  if (explicito === "openai") return montar("openai");
  if (explicito === "anthropic" || explicito === "claude") return montar("anthropic");

  // Sem declaração: usa a primeira chave válida.
  return montar("gemini") || montar("openai") || montar("anthropic");
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
        "Nenhum provedor de IA configurado. Defina GOOGLE_GENERATIVE_AI_API_KEY, " +
        "OPENAI_API_KEY ou ANTHROPIC_API_KEY em .env.local",
    };
  }
  return {
    valid: true,
    provider: cfg.provider,
    model: cfg.model || "(descoberto na primeira chamada)",
  };
}

// ── Descoberta de modelo ───────────────────────────────────────────────────

/**
 * Cache do modelo resolvido por provedor.
 *
 * Fixar o nome do modelo no código envelhece mal: o provedor lança versão
 * nova e aposenta a antiga sem avisar, e o chat quebra em produção. Aqui a
 * lista real da conta é consultada uma vez e a melhor opção fica em cache
 * pelo tempo do processo.
 */
const modeloResolvido = new Map<string, { model: string; expiraEm: number }>();
const CACHE_MODELO_MS = 60 * 60 * 1000; // 1 hora

/**
 * Descarta o modelo em cache e força nova descoberta na próxima chamada.
 * Útil quando o provedor publica um modelo melhor e não se quer reiniciar o
 * servidor para passar a usá-lo.
 */
export function limparCacheDeModelo(provider?: string): void {
  if (provider) modeloResolvido.delete(provider);
  else modeloResolvido.clear();
}

/**
 * Modelos que não servem para conversa de texto, ou que mudam sem aviso.
 *
 * A conta traz dezenas de variantes na mesma família — imagem, áudio,
 * embedding, preview. Escolher um deles por engano quebra o chat de um jeito
 * difícil de diagnosticar: o modelo existe, a chave é válida, e mesmo assim
 * a resposta não vem em texto.
 */
const GEMINI_INADEQUADO =
  /(-image|-tts|-audio|-embedding|-customtools|-exp\b|thinking|aqa|learnlm|imagen|veo)/;

/** Preview e experimental somem sem aviso; só entram se não sobrar nada. */
const GEMINI_INSTAVEL = /(-preview|-latest|-\d{3,})/;

interface ModeloGemini {
  nome: string;
  versao: number;   // 3.6 → 3.6
  familia: number;  // maior = preferido
}

/**
 * Preferência: flash > pro > flash-lite.
 *
 * Flash na frente de propósito. O Concierge é conversa curta com o visitante
 * esperando na tela: latência e custo pesam mais que a capacidade extra do
 * pro, que rende em tarefa longa de raciocínio. Para fixar outro,
 * use AI_MODEL.
 */
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
    // Sem lista (rede, cota, chave nova): cai no fallback abaixo.
  }

  const ordenar = (a: ModeloGemini, b: ModeloGemini) =>
    b.familia - a.familia || b.versao - a.versao;

  const estaveis = disponiveis
    .filter((n) => !GEMINI_INSTAVEL.test(n))
    .map(classificarGemini)
    .filter((m): m is ModeloGemini => m !== null)
    .sort(ordenar);

  let escolhido = estaveis[0]?.nome ?? "";

  // Conta só com preview (acontece quando uma geração acabou de sair).
  if (!escolhido) {
    escolhido =
      disponiveis
        .map((n) => classificarGemini(n.replace(GEMINI_INSTAVEL, "")))
        .filter((m): m is ModeloGemini => m !== null)
        .sort(ordenar)
        .map((m) => disponiveis.find((n) => n.startsWith(m.nome)))
        .find(Boolean) ?? "";
  }

  // Lista indisponível: nome estável conhecido, para ao menos tentar.
  if (!escolhido) escolhido = "gemini-2.0-flash";

  modeloResolvido.set("gemini", { model: escolhido, expiraEm: Date.now() + CACHE_MODELO_MS });
  return escolhido;
}

async function resolverModelo(cfg: AIProviderConfig): Promise<string> {
  if (cfg.model) return cfg.model;

  switch (cfg.provider) {
    case "gemini":
      return descobrirModeloGemini(cfg.apiKey);
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-sonnet-4-5";
  }
}

// ── Classificação de erro ──────────────────────────────────────────────────

function classificarErro(err: unknown, status?: number, corpo?: string): AIError {
  if (err instanceof AIError) return err;

  const msg = err instanceof Error ? err.message : String(err ?? "");
  const texto = `${status ?? ""} ${corpo ?? ""} ${msg}`.toLowerCase();

  // AbortSignal.timeout dispara TimeoutError; abort manual dispara AbortError.
  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return new AIError("AI_TIMEOUT", msg);
  }
  if (status === 401 || status === 403 || texto.includes("api key") || texto.includes("unauthorized")) {
    return new AIError("AI_AUTH_FAILURE", corpo || msg);
  }
  if (status === 429 || texto.includes("rate limit") || texto.includes("quota") || texto.includes("resource_exhausted")) {
    return new AIError("AI_RATE_LIMIT", corpo || msg);
  }
  if (status === 404 || texto.includes("not found") || texto.includes("does not exist") || texto.includes("unsupported model")) {
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

// ── Chamada ────────────────────────────────────────────────────────────────

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

/** Lê o corpo do erro sem estourar quando a resposta não é JSON. */
async function lerCorpoErro(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}

// ── Google Gemini ──────────────────────────────────────────────────────────
async function chamarGemini(
  messages: ChatMessage[],
  cfg: AIProviderConfig,
  opts: GenerateOptions,
  inicio: number
): Promise<AIResponse> {
  const system = messages.find((m) => m.role === "system");
  const conversa = messages.filter((m) => m.role !== "system");

  // O Gemini exige alternância user/model começando por user. Histórico que
  // comece com assistant (a mensagem de boas-vindas do widget) é rejeitado.
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

  // Modelo que não conhece thinkingConfig devolve 400. Repete sem ele em vez
  // de derrubar a conversa por causa de um parâmetro opcional.
  if (!res.ok && res.status === 400 && opts.thinking) {
    res = await chamar(false);
  }

  if (!res.ok) throw classificarErro(null, res.status, await lerCorpoErro(res));

  const data = await res.json();
  const candidato = data.candidates?.[0];

  // Bloqueio de segurança devolve HTTP 200 com candidato vazio — sem este
  // tratamento o visitante recebe uma resposta em branco e nada é logado.
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
    // MAX_TOKENS sem texto quase sempre é raciocínio interno consumindo todo
    // o orçamento. Sem essa nota, o log só diz "resposta vazia".
    const detalhe =
      motivo === "MAX_TOKENS"
        ? `finishReason=MAX_TOKENS — orçamento de saída consumido pelo raciocínio ` +
          `do modelo (${data.usageMetadata?.thoughtsTokenCount ?? "?"} tokens). ` +
          `Aumente maxTokens ou use thinking: "low".`
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

// ── OpenAI ─────────────────────────────────────────────────────────────────
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
  const content = escolha?.message?.content?.trim() ?? "";

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

// ── Anthropic ──────────────────────────────────────────────────────────────
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

// ── Diagnóstico ────────────────────────────────────────────────────────────

/** Usado por /api/health/ai para checar a integração sem abrir o chat. */
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
    return { success: false, errorCode: "AI_PROVIDER_NOT_CONFIGURED", error: "Nenhum provedor configurado" };
  }

  try {
    const model = await resolverModelo(cfg);
    const r = await generateAIResponse(
      [
        { role: "system", content: "Responda exatamente: OK" },
        { role: "user", content: "teste" },
      ],
      { ...cfg, model },
      // 256 e não um valor mínimo: em modelo com raciocínio interno, orçamento
      // apertado devolve resposta vazia e o diagnóstico acusaria falha numa
      // integração que está funcionando.
      { maxTokens: 256, temperature: 0, thinking: "low" }
    );
    return { success: true, provider: r.provider, model: r.model, responseTimeMs: r.responseTimeMs };
  } catch (err) {
    const e = err instanceof AIError ? err : classificarErro(err);
    return { success: false, provider: cfg.provider, errorCode: e.code, error: e.detail || e.code };
  }
}
