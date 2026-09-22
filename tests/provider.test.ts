/**
 * Teste do provider de IA com fetch interceptado.
 * Verifica o comportamento real do código, sem chamar a API de verdade.
 */

import { pathToFileURL } from "node:url";

const CAMINHO_PROVIDER =
  "C:/Users/Ale/Documents/Ale Pessoal novo/neosenses/neosenses/src/lib/ai/provider.ts";

const { detectAIConfig, generateAIResponse, validateAIConfig, limparCacheDeModelo } = await import(
  pathToFileURL(CAMINHO_PROVIDER).href
);

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

let passou = 0;
let falhou = 0;

function ok(nome: string, condicao: boolean, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  PASSOU  ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHOU  ${nome} ${detalhe}`);
  }
}

const fetchOriginal = globalThis.fetch;
let ultimaRequisicao: { url: string; body: any; headers: any } | null = null;

function mockFetch(respostas: Array<{ status: number; json: any }>) {
  let i = 0;
  globalThis.fetch = (async (url: any, init: any) => {
    const r = respostas[Math.min(i++, respostas.length - 1)];
    ultimaRequisicao = {
      url: String(url),
      body: init?.body ? JSON.parse(init.body) : null,
      headers: init?.headers ?? {},
    };
    return new Response(JSON.stringify(r.json), {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as any;
}

function limparEnv() {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_MODEL;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
}

const CHAVE_VALIDA = "AIzaSyD-exemplo-de-chave-com-tamanho-real-1234";

const listaModelos = {
  models: [
    { name: "models/gemini-1.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-2.5-flash-exp", supportedGenerationMethods: ["generateContent"] },
    { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
  ],
};

const respostaOk = {
  candidates: [{ content: { parts: [{ text: "  Olá do Concierge.  " }] }, finishReason: "STOP" }],
  usageMetadata: { totalTokenCount: 123 },
};

async function main() {
  console.log("\n=== 1. Detecção de configuração ===");

  limparEnv();
  ok("sem chave nenhuma -> null", detectAIConfig() === null);

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "your-api-key-here";
  ok("placeholder 'your-api-key-here' é rejeitado", detectAIConfig() === null);

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "abc123";
  ok("chave curta demais é rejeitada", detectAIConfig() === null);

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  ok("chave válida do Gemini é detectada", detectAIConfig()?.provider === "gemini");

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  process.env.OPENAI_API_KEY = "sk-proj-chave-openai-longa-o-suficiente-123";
  process.env.AI_PROVIDER = "openai";
  ok("AI_PROVIDER explícito tem precedência", detectAIConfig()?.provider === "openai");

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  process.env.OPENAI_API_KEY = "sk-proj-chave-openai-longa-o-suficiente-123";
  ok("sem AI_PROVIDER, gemini vem primeiro", detectAIConfig()?.provider === "gemini");

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = `  ${CHAVE_VALIDA}  `;
  ok("espaço em volta da chave é removido", detectAIConfig()?.apiKey === CHAVE_VALIDA);

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  ok("validateAIConfig aprova", validateAIConfig().valid === true);

  console.log("\n=== 2. Descoberta de modelo ===");

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  mockFetch([{ status: 200, json: listaModelos }, { status: 200, json: respostaOk }]);
  let r = await generateAIResponse([{ role: "user", content: "oi" }]);
  // Preferência é flash: em chat, latência e custo pesam mais que a
  // capacidade extra do pro. Para fixar outro, use AI_MODEL.
  ok("escolhe o flash de maior versão", r.model === "gemini-2.5-flash", `-> ${r.model}`);
  ok("ignora modelo -exp", !r.model.includes("-exp"));
  ok("trim aplicado no conteúdo", r.content === "Olá do Concierge.", `-> "${r.content}"`);
  ok("tokens reportados", r.tokensUsed === 123);

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  process.env.AI_MODEL = "gemini-2.0-flash";
  mockFetch([{ status: 200, json: respostaOk }]);
  r = await generateAIResponse([{ role: "user", content: "oi" }]);
  ok("AI_MODEL fixo é respeitado", r.model === "gemini-2.0-flash", `-> ${r.model}`);
  ok("com AI_MODEL não lista modelos", ultimaRequisicao!.url.includes(":generateContent"));

  console.log("\n=== 3. Formato do payload do Gemini ===");

  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  process.env.AI_MODEL = "gemini-2.0-flash";
  mockFetch([{ status: 200, json: respostaOk }]);

  const comSystem: ChatMessage[] = [
    { role: "system", content: "Você é o Concierge." },
    { role: "assistant", content: "Olá! Como posso ajudar?" }, // boas-vindas do widget
    { role: "user", content: "Quero conhecer o Peru" },
  ];
  await generateAIResponse(comSystem);
  const b = ultimaRequisicao!.body;
  ok("system vai em systemInstruction", b.systemInstruction?.parts?.[0]?.text === "Você é o Concierge.");
  ok("system não entra em contents", !JSON.stringify(b.contents).includes("Você é o Concierge"));
  ok("histórico não começa com model", b.contents[0].role === "user", `-> ${b.contents[0].role}`);
  ok("assistant vira 'model'", !b.contents.some((c: any) => c.role === "assistant"));
  ok("chave vai no header, não na URL", !ultimaRequisicao!.url.includes("key="));
  ok("header x-goog-api-key presente", ultimaRequisicao!.headers["x-goog-api-key"] === CHAVE_VALIDA);

  mockFetch([{ status: 200, json: respostaOk }]);
  await generateAIResponse([{ role: "user", content: "x" }], null, { json: true });
  ok("modo json define responseMimeType",
     ultimaRequisicao!.body.generationConfig.responseMimeType === "application/json");

  console.log("\n=== 4. Erros ===");

  async function esperaErro(nome: string, resposta: any, codigoEsperado: string) {
    limparEnv();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
    process.env.AI_MODEL = "gemini-2.0-flash";
    mockFetch([resposta]);
    try {
      await generateAIResponse([{ role: "user", content: "x" }]);
      ok(nome, false, "-> não lançou erro");
    } catch (e) {
      // AIError vem de import dinâmico, então instanceof não estreita o tipo.
      const code = (e as { code?: string }).code ?? String(e);
      ok(nome, code === codigoEsperado, `-> ${code}`);
    }
  }

  await esperaErro("401 -> AI_AUTH_FAILURE",
    { status: 401, json: { error: { message: "API key not valid" } } }, "AI_AUTH_FAILURE");
  await esperaErro("429 -> AI_RATE_LIMIT",
    { status: 429, json: { error: { message: "Resource exhausted" } } }, "AI_RATE_LIMIT");
  await esperaErro("404 modelo -> AI_UNSUPPORTED_MODEL",
    { status: 404, json: { error: { message: "models/x is not found" } } }, "AI_UNSUPPORTED_MODEL");
  await esperaErro("500 -> AI_PROVIDER_ERROR",
    { status: 500, json: { error: { message: "internal" } } }, "AI_PROVIDER_ERROR");

  // HTTP 200 com bloqueio de segurança — o caso que devolvia resposta vazia
  await esperaErro("bloqueio de prompt (HTTP 200) -> AI_CONTENT_BLOCKED",
    { status: 200, json: { promptFeedback: { blockReason: "SAFETY" } } }, "AI_CONTENT_BLOCKED");
  await esperaErro("finishReason SAFETY -> AI_CONTENT_BLOCKED",
    { status: 200, json: { candidates: [{ finishReason: "SAFETY" }] } }, "AI_CONTENT_BLOCKED");
  await esperaErro("resposta vazia -> AI_EMPTY_RESPONSE",
    { status: 200, json: { candidates: [{ content: { parts: [{ text: "" }] }, finishReason: "STOP" }] } },
    "AI_EMPTY_RESPONSE");

  limparEnv();
  try {
    await generateAIResponse([{ role: "user", content: "x" }]);
    ok("sem provedor -> AI_PROVIDER_NOT_CONFIGURED", false, "-> não lançou");
  } catch (e) {
    ok("sem provedor -> AI_PROVIDER_NOT_CONFIGURED",
       (e as { code?: string }).code === "AI_PROVIDER_NOT_CONFIGURED");
  }

  console.log("\n=== 5. Fallback quando a lista de modelos falha ===");
  limparCacheDeModelo();
  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  mockFetch([{ status: 500, json: { error: "indisponivel" } }, { status: 200, json: respostaOk }]);
  r = await generateAIResponse([{ role: "user", content: "oi" }]);
  ok("lista indisponível -> usa modelo estável conhecido", r.model === "gemini-2.0-flash", `-> ${r.model}`);

  console.log("\n=== 6. thinkingConfig e retry ===");
  limparCacheDeModelo();
  limparEnv();
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = CHAVE_VALIDA;
  process.env.AI_MODEL = "gemini-3.6-flash";

  mockFetch([{ status: 200, json: respostaOk }]);
  await generateAIResponse([{ role: "user", content: "x" }], null, { thinking: "low" });
  ok("thinking:low vira thinkingConfig.thinkingLevel",
     ultimaRequisicao!.body.generationConfig?.thinkingConfig?.thinkingLevel === "low");

  mockFetch([{ status: 200, json: respostaOk }]);
  await generateAIResponse([{ role: "user", content: "x" }]);
  ok("sem thinking, nao envia thinkingConfig",
     ultimaRequisicao!.body.generationConfig?.thinkingConfig === undefined);

  // Modelo que nao conhece o parametro: 400 na primeira, sucesso na segunda.
  let chamadas = 0;
  globalThis.fetch = (async (url: any, init: any) => {
    chamadas++;
    ultimaRequisicao = { url: String(url), body: JSON.parse(init.body), headers: init.headers };
    if (chamadas === 1) {
      return new Response(JSON.stringify({ error: { message: "Request contains an invalid argument." } }), { status: 400 });
    }
    return new Response(JSON.stringify(respostaOk), { status: 200 });
  }) as any;
  const rr = await generateAIResponse([{ role: "user", content: "x" }], null, { thinking: "low" });
  ok("400 com thinking -> repete sem o parametro", chamadas === 2, `-> ${chamadas} chamada(s)`);
  ok("retry nao envia thinkingConfig", ultimaRequisicao!.body.generationConfig?.thinkingConfig === undefined);
  ok("retry devolve a resposta normalmente", rr.content === "Olá do Concierge.");

  // 400 sem thinking nao deve repetir — seria mascarar erro real de payload.
  chamadas = 0;
  globalThis.fetch = (async (url: any, init: any) => {
    chamadas++;
    return new Response(JSON.stringify({ error: { message: "campo invalido" } }), { status: 400 });
  }) as any;
  try { await generateAIResponse([{ role: "user", content: "x" }]); } catch { /* esperado */ }
  ok("400 sem thinking nao repete", chamadas === 1, `-> ${chamadas} chamada(s)`);

  // MAX_TOKENS com texto vazio precisa explicar a causa no detalhe.
  mockFetch([{ status: 200, json: { candidates: [{ content: { parts: [{ text: "" }] }, finishReason: "MAX_TOKENS" }], usageMetadata: { thoughtsTokenCount: 110 } } }]);
  try {
    await generateAIResponse([{ role: "user", content: "x" }], null, { maxTokens: 16 });
    ok("MAX_TOKENS vazio -> erro explicado", false, "-> nao lancou");
  } catch (e: any) {
    ok("MAX_TOKENS vazio -> erro explicado",
       e.code === "AI_EMPTY_RESPONSE" && String(e.detail).includes("raciocínio"), `-> ${e.detail}`);
  }

  globalThis.fetch = fetchOriginal;
  console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
  process.exit(falhou > 0 ? 1 : 0);
}

main();

// Marca o arquivo como módulo: sem isto os testes compartilham escopo
// global e o TypeScript acusa redeclaração entre eles.
export {};
