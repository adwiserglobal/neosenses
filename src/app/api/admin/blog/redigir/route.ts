import { NextRequest, NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/actions/auth";
import { AIError, generateAIResponse } from "@/lib/ai/provider";

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
Tamanho desejado: 500 a 800 palavras, com introdução, 3 a 5 seções e conclusão com reflexão ou convite sutil.`;

  const pedido = modo === "revisar"
    ? `Revise e melhore o texto preservando fatos, intenção e voz original.
Título atual: ${tituloAtual || "(sem título)"}.
Instruções específicas: ${orientacoes || "Melhore a fluidez, clareza, organização e ortografia."}.
Texto original:\n${textoAtual}`
    : `Escreva um artigo sobre: ${tema}.
Direção editorial ou informações fornecidas pela equipe: ${orientacoes || "Sem informações adicionais."}`;

  try {
    const resposta = await generateAIResponse(
      [{ role: "system", content: instrucao }, { role: "user", content: pedido }],
      undefined,
      { maxTokens: 3400, temperature: 0.65, timeoutMs: 52000, json: true }
    );
    let artigo: RespostaRedacao;
    try { artigo = analisarResposta(resposta.content); }
    catch {
      return NextResponse.json(
        { error: "A IA não entregou um artigo completo. Tente novamente ou simplifique a instrução." },
        { status: 502 }
      );
    }
    return NextResponse.json({
      ...artigo,
      geracao: {
        modo, instrucao: tema || orientacoes || "Revisão editorial",
        modelo: resposta.model, provedor: resposta.provider, em: new Date().toISOString(),
        revisaoHumanaObrigatoria: true,
      },
    });
  } catch (err) {
    if (err instanceof AIError) {
      const mensagem = err.code === "AI_PROVIDER_NOT_CONFIGURED"
        ? "Configure o provedor de IA no Vercel para usar a redatora."
        : err.code === "AI_RATE_LIMIT"
          ? "A IA atingiu o limite de uso. Aguarde e tente novamente."
          : err.code === "AI_TIMEOUT"
            ? "A IA demorou demais. Tente um artigo mais curto."
            : "Não foi possível gerar o texto agora. Tente novamente.";
      const status = err.code === "AI_RATE_LIMIT" ? 429 : err.code === "AI_TIMEOUT" ? 504 : 503;
      return NextResponse.json({ error: mensagem }, { status });
    }
    console.error("[blog] geração:", err instanceof Error ? err.message : "erro inesperado");
    return NextResponse.json({ error: "Falha inesperada ao gerar o artigo." }, { status: 500 });
  }
}
