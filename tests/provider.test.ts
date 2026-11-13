/**
 * Testes da integração com o Vercel AI Gateway.
 * Sem chamadas reais e sem consumir créditos.
 */
const { detectAIConfig, generateAIResponse, validateAIConfig } = await import(
  new URL("../src/lib/ai/provider.ts", import.meta.url).href
);

type MockResponse = { status: number; json: unknown };
let passou = 0;
let falhou = 0;
const fetchOriginal = globalThis.fetch;
let ultimaRequisicao: { url: string; body: any; headers: any } | null = null;

function ok(nome: string, condicao: boolean, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  PASSOU  ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHOU  ${nome} ${detalhe}`);
  }
}

function limparEnv() {
  for (const nome of [
    "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "AI_GATEWAY_MODEL",
    "AI_PROVIDER", "AI_MODEL", "NVIDIA_API_KEY", "OPENROUTER_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY", "OPENAI_API_KEY", "AI_API_KEY",
    "ANTHROPIC_API_KEY",
  ]) delete process.env[nome];
}

function mockFetch(respostas: MockResponse[]) {
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

const API_KEY = "vgw_test_key_for_gateway_0123456789";
const OIDC_TOKEN = "eyJhbGciOiJSUzI1NiJ9.test.oidc-token-that-is-long-enough";
const MODEL = "google/gemini-2.5-flash-lite";
const respostaOk = {
  id: "chatcmpl-test",
  model: MODEL,
  choices: [{
    message: { role: "assistant", content: "Resposta do AI Gateway" },
    finish_reason: "stop",
  }],
  usage: { prompt_tokens: 31, completion_tokens: 12, total_tokens: 43 },
};

async function esperaErro(nome: string, status: number, body: unknown, esperado: string) {
  limparEnv();
  process.env.AI_GATEWAY_API_KEY = API_KEY;
  mockFetch([{ status, json: body }]);
  try {
    await generateAIResponse([{ role: "user", content: "teste" }]);
    ok(nome, false, "não lançou erro");
  } catch (err) {
    ok(nome, (err as { code?: string }).code === esperado, `-> ${(err as { code?: string }).code}`);
  }
}

async function main() {
  console.log("\n=== 1. Autenticação e configuração ===");
  limparEnv();
  process.env.OPENAI_API_KEY = "sk-legado-nao-deve-ser-usado-123456789";
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "AIza-chave-legada-que-nao-deve-ser-usada";
  ok("chaves diretas antigas não habilitam IA", detectAIConfig() === null);
  ok("sem Gateway, validação falha", validateAIConfig().valid === false);

  limparEnv();
  process.env.AI_GATEWAY_API_KEY = API_KEY;
  process.env.AI_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "sk-legado-nao-deve-ser-usado-123456789";
  process.env.AI_GATEWAY_MODEL = MODEL;
  const cfg = detectAIConfig();
  ok("Gateway tem prioridade mesmo com AI_PROVIDER legado", cfg?.provider === "vercel");
  ok("modelo dedicado do Gateway é respeitado", cfg?.model === MODEL);
  ok("credencial Gateway é reconhecida", cfg?.apiKey === API_KEY);
  ok("validação aprova Gateway", validateAIConfig().valid === true);

  console.log("\n=== 2. OIDC e chamada ===");
  limparEnv();
  process.env.AI_GATEWAY_MODEL = MODEL;
  ok(
    "token OIDC recebido no header pode ser usado por requisição",
    detectAIConfig(OIDC_TOKEN)?.apiKey === OIDC_TOKEN
  );
  process.env.VERCEL_OIDC_TOKEN = OIDC_TOKEN;
  mockFetch([{ status: 200, json: respostaOk }]);
  const r = await generateAIResponse(
    [
      { role: "system", content: "Você é o Concierge." },
      { role: "user", content: "Quero conhecer o Peru." },
    ],
    null,
    { maxTokens: 420, temperature: 0.45 }
  );
  ok("OIDC de ambiente é detectado sem API key", detectAIConfig()?.apiKey === OIDC_TOKEN);
  ok("endpoint único do Gateway", ultimaRequisicao?.url === "https://ai-gateway.vercel.sh/v1/chat/completions");
  ok("Bearer token é enviado", ultimaRequisicao?.headers?.Authorization === `Bearer ${OIDC_TOKEN}`);
  ok("modelo Gateway vai no payload", ultimaRequisicao?.body?.model === MODEL);
  ok("histórico inclui system e user", ultimaRequisicao?.body?.messages?.length === 2);
  ok("max_tokens é respeitado", ultimaRequisicao?.body?.max_tokens === 420);
  ok("conteúdo da resposta é extraído", r.content === "Resposta do AI Gateway");
  ok("provedor identificado como Gateway", r.provider === "vercel-ai-gateway");
  ok("modelo retornado", r.model === MODEL);
  ok("uso de tokens reportado", r.tokensUsed === 43);

  console.log("\n=== 3. Saída estruturada ===");
  limparEnv();
  process.env.AI_GATEWAY_API_KEY = API_KEY;
  process.env.AI_GATEWAY_MODEL = MODEL;
  mockFetch([{ status: 200, json: respostaOk }]);
  await generateAIResponse([{ role: "user", content: "Responda em JSON." }], null, { json: true });
  ok(
    "modo JSON usa response_format compatível",
    ultimaRequisicao?.body?.response_format?.type === "json_object"
  );
  ok(
    "roteamento restringe a chamada ao Vertex com ZDR",
    ultimaRequisicao?.body?.providerOptions?.gateway?.only?.[0] === "vertex"
  );

  console.log("\n=== 4. Classificação de erros do Gateway ===");
  await esperaErro("401 -> AI_AUTH_FAILURE", 401, { error: { message: "Invalid API key" } }, "AI_AUTH_FAILURE");
  await esperaErro("402 insufficient funds -> AI_RATE_LIMIT", 402, { error: { code: "insufficient_funds" } }, "AI_RATE_LIMIT");
  await esperaErro("429 -> AI_RATE_LIMIT", 429, { error: { message: "Rate limit exceeded" } }, "AI_RATE_LIMIT");
  await esperaErro("404 modelo -> AI_UNSUPPORTED_MODEL", 404, { error: { message: "Model not found" } }, "AI_UNSUPPORTED_MODEL");
  await esperaErro("500 -> AI_PROVIDER_ERROR", 500, { error: { message: "Internal error" } }, "AI_PROVIDER_ERROR");

  globalThis.fetch = fetchOriginal;
  limparEnv();
  console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
  process.exit(falhou > 0 ? 1 : 0);
}

main();
export {};
