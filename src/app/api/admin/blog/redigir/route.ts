import { NextRequest, NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/actions/auth";
import { AIError, detectAIConfig, generateAIResponse } from "@/lib/ai/provider";
import type { AIProviderConfig, AIResponse, ChatMessage } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

type RespostaRedacao = { titulo: string; resumo: string; texto: string };

function analisarResposta(texto: string): RespostaRedacao {
  const limpo = texto.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "");
  const inicio = limpo.indexOf("{"), fim = limpo.lastIndexOf("}");
  const json = JSON.parse(inicio >= 0 && fim >= 0 ? limpo.slice(inicio, fim + 1) : limpo) as Record<string, unknown>;
  const titulo = typeof json.titulo === "string" ? json.titulo.trim().slice(0, 180) : "";
  const resumo = typeof json.resumo === "string" ? json.resumo.trim().slice(0, 500) : "";
  const corpo = typeof json.texto === "string" ? json.texto.trim().slice(0, 45000) : "";
  if (!titulo || !resumo || corpo.length < 100) throw new Error("A resposta da IA veio incompleta. Tente novamente.");
  return { titulo, resumo, texto: corpo };
}

export async function POST(req: NextRequest) {
  const perfil = await usuarioAtual();
  if (!perfil || !perfil.is_active || !["admin", "editor"].includes(perfil.role))
    return NextResponse.json({ error: "Faça login no painel para usar a redatora." }, { status: 401 });

  let entrada: Record<string, unknown>;
  try {
    if (Number(req.headers.get("content-length") || 0) > 130000)
      return NextResponse.json({ error: "O texto enviado é grande demais." }, { status: 413 });
    entrada = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Envie as informações do artigo." }, { status: 400 });
  }

  const tema = String(entrada.tema || "").trim().slice(0, 500);
  const orientacoes = String(entrada.orientacoes || "").trim().slice(0, 3000);
  const textoAtual = String(entrada.textoAtual || "").trim().slice(0, 14000);
  const tituloAtual = String(entrada.tituloAtual || "").trim().slice(0, 180);
  const modo = entrada.modo === "revisar" ? "revisar" : "criar";
  if (modo === "criar" && tema.length < 5)
    return NextResponse.json({ error: "Descreva o tema do artigo." }, { status: 400 });
  if (modo === "revisar" && textoAtual.length < 20)
    return NextResponse.json({ error: "Escreva um rascunho para a IA melhorar." }, { status: 400 });

  const instrucao = `Você é a redatora editorial da NeoSenses, marca brasileira de viagens transformadoras.
Escreva em português brasileiro, com voz humana, acolhedora, elegante e sóbria.
Público: pessoas interessadas em autoconhecimento, jornadas espirituais, culturas, destinos e experiências de viagem.
Evite clichês, excesso de adjetivos, listas publicitárias, promessas de cura ou resultados espirituais garantidos.
NUNCA invente preços, datas, relatos de clientes, profissionais, credenciais, citações atribuídas a pessoas,
referências científicas, rituais, requisitos de entrada em países ou fatos verificáveis não fornecidos.
Se informação específica faltar, trate o tema de modo geral e não apresente suposições como fatos.
O texto será revisado pela responsável pelo site antes de publicação.
Retorne APENAS um objeto JSON válido com as chaves "titulo" (máximo 110 caracteres),
"resumo" (entre 80 e 250 caracteres) e "texto" (artigo em Markdown editorial).
No campo texto use ## para seções, parágrafos de 2 a 5 frases, listas com - quando úteis,
e > somente para reflexões sem atribuição a terceiros. Não escreva HTML, cercas de código nem título H1 no corpo.
Tamanho desejado: 350 a 500 palavras, com introdução, 3 a 4 seções e conclusão com reflexão ou convite sutil. Evite repetições.`;

  const pedido = modo === "revisar"
    ? `Revise e melhore o texto preservando fatos, intenção e voz original.
Título atual: ${tituloAtual || "(sem título)"}.
Instruções específicas: ${orientacoes || "Melhore a fluidez, clareza, organização e ortografia."}.
Texto original:\n${textoAtual}`
    : `Escreva um artigo sobre: ${tema}.
Direção editorial ou informações fornecidas pela equipe: ${orientacoes || "Sem informações adicionais."}`;


  const configuracao = detectAIConfig();
  if (!configuracao) {
    return NextResponse.json(
      { error: "A chave de IA não está configurada no Vercel." },
      { status: 503 }
    );
  }

  const messages: ChatMessage[] = [
    { role: "system", content: instrucao },
    { role: "user", content: pedido },
  ];
  // Nunca deixe uma tentativa consumir sozinha os 60 segundos do Vercel.
  // A saída JSON é pedida no texto do prompt, mas não forçada pela API:
  // modelos gratuitos do OpenRouter podem não suportar json_object.
  const principal: AIProviderConfig = configuracao.provider === "openrouter"
    ? { ...configuracao, model: configuracao.model || "openrouter/free" }
    : configuracao;
  const alternativas: Array<{ config: AIProviderConfig; tempo: number }> = [
    { config: principal, tempo: 22_000 },
  ];
  const gemini = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (configuracao.provider === "openrouter" && gemini && gemini.length > 20) {
    alternativas.push({
      config: { provider: "gemini", model: "", apiKey: gemini },
      tempo: 18_000,
    });
  } else if (configuracao.provider === "openrouter") {
    // Uma segunda chamada ao router pode usar outra instância gratuita.
    alternativas.push({
      config: { ...configuracao, model: "openrouter/free" },
      tempo: 18_000,
    });
  }

  let falha: AIError | null = null;
  for (let tentativa = 0; tentativa < alternativas.length; tentativa++) {
    const { config, tempo } = alternativas[tentativa];
    // Limites da conta, bloqueios e chave inválida não são curados por
    // repetir a mesma chamada ao mesmo provedor.
    if (
      tentativa > 0 &&
      falha &&
      ["AI_AUTH_FAILURE", "AI_CONTENT_BLOCKED", "AI_RATE_LIMIT"].includes(falha.code) &&
      config.provider === alternativas[0].config.provider
    ) break;

    try {
      const resposta: AIResponse = await generateAIResponse(messages, config, {
        maxTokens: 2350,
        temperature: 0.55,
        timeoutMs: tempo,
        json: false,
        openRouterSingleModel: config.provider === "openrouter",
      });
      const artigo = analisarResposta(resposta.content);
      return NextResponse.json({
        ...artigo,
        geracao: {
          modo,
          instrucao: tema || orientacoes || "Revisão editorial",
          modelo: resposta.model,
          provedor: resposta.provider,
          em: new Date().toISOString(),
          revisaoHumanaObrigatoria: true,
        },
      });
    } catch (err) {
      falha = err instanceof AIError
        ? err
        : new AIError("AI_PROVIDER_ERROR", err instanceof Error ? err.message : "resposta inválida");
      console.warn("[blog/redigir] tentativa:", {
        numero: tentativa + 1,
        provedor: config.provider,
        modelo: config.model || "automático",
        motivo: falha.code,
      });
    }
  }

  const codigo = falha?.code;
  const mensagem =
    codigo === "AI_AUTH_FAILURE"
      ? "A chave de IA foi recusada. Verifique a configuração no Vercel."
      : codigo === "AI_RATE_LIMIT"
        ? "O provedor atingiu seu limite de uso. Aguarde ou configure outro modelo."
        : codigo === "AI_TIMEOUT"
          ? "A IA demorou demais para responder. Aguarde e tente novamente."
          : codigo === "AI_CONTENT_BLOCKED"
            ? "A solicitação foi bloqueada pelo provedor. Reformule a instrução."
            : codigo === "AI_UNSUPPORTED_MODEL"
              ? "O modelo configurado não está disponível. Altere-o no Vercel."
              : "Os modelos de IA estão indisponíveis. Tente novamente em instantes.";
  return NextResponse.json(
    { error: mensagem },
    { status: codigo === "AI_RATE_LIMIT" ? 429 : codigo === "AI_TIMEOUT" ? 504 : 503 }
  );
}
