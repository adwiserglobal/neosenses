/**
 * POST /api/concierge/chat
 *
 * Fluxo: valida → limita → busca contexto → chama a IA → grava → responde.
 *
 * Tudo roda no servidor. A chave da IA e a service_role nunca chegam ao
 * navegador, e a gravação usa service_role justamente porque a chave pública
 * não escreve nada (ver supabase/README.md).
 *
 * Princípio de degradação: falha de banco não impede o visitante de receber
 * resposta. Perder a gravação de uma conversa é ruim; deixar quem está na
 * tela sem resposta é pior.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  detectAIConfig,
  generateAIResponse,
  validateAIConfig,
  AIError,
  type ChatMessage,
} from "@/lib/ai/provider";
import { retrieveNeoSensesContext, formatContextForPrompt } from "@/lib/ai/retrieval";
import { buildConciergeSystemPrompt } from "@/lib/ai/prompt";
import { verificarResposta, respostaSegura } from "@/lib/ai/guardas";
import { identificar, verificarLimite, LIMITE_CHAT } from "@/lib/limite";

export const dynamic = "force-dynamic";

// ── Estado da configuração, avaliado uma vez ───────────────────────────────
const statusIA = validateAIConfig();
if (statusIA.valid) {
  console.log(`[concierge] IA pronta: ${statusIA.provider} / ${statusIA.model}`);
} else {
  console.warn(`[concierge] IA indisponível: ${statusIA.error}`);
}

// ── Supabase ───────────────────────────────────────────────────────────────
function conectarSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publica = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) return null;

  // Sem a service_role o RLS bloqueia toda escrita e nada é gravado. O
  // visitante continua sendo atendido; o aviso fica no log para quem opera.
  const chave = secreta && secreta.length > 10 ? secreta : publica;
  if (!chave) return null;
  if (!secreta) {
    console.warn(
      "[concierge] SUPABASE_SERVICE_ROLE_KEY ausente — a conversa não será gravada (RLS bloqueia escrita anônima)"
    );
  }

  return createClient<Database>(url, chave, { auth: { persistSession: false } });
}

// ── Limite de uso ──────────────────────────────────────────────────────────
// A chave é o IP, não a sessão. Ver src/lib/limite.ts: incluir o sessionId
// permitia furar o limite trocando o identificador a cada requisição.

// ── Validação ──────────────────────────────────────────────────────────────
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CARACTERES = 1500;
const MAX_HISTORICO = 16;

function normalizarIdioma(valor: unknown): "pt" | "en" | "es" {
  const curto = String(valor ?? "pt").split("-")[0].toLowerCase();
  return curto === "en" || curto === "es" ? curto : "pt";
}

/**
 * Remove caracteres de controle, preservando tab e quebra de linha.
 *
 * Feito por code point, e não por regex: a classe de caracteres com
 * escapes literais é ilegível na revisão e qualquer ferramenta que
 * reprocesse o arquivo pode corrompê-la sem que o tipo acuse nada.
 */
function limpar(texto: string): string {
  let saida = "";
  for (const ch of texto) {
    const c = ch.codePointAt(0)!;
    const ehQuebraOuTab = c === 9 || c === 10 || c === 13;
    const ehControle = c < 32 || c === 127;
    if (!ehControle || ehQuebraOuTab) saida += ch;
  }
  return saida.trim();
}

// ── Mensagens ao visitante ─────────────────────────────────────────────────
const MENSAGENS: Record<string, Record<string, string>> = {
  AI_PROVIDER_NOT_CONFIGURED: {
    pt: "O Concierge ainda está sendo configurado. Fale com nossa equipe pelo WhatsApp que respondemos na hora.",
    en: "The Concierge is still being set up. Talk to our team on WhatsApp and we'll reply right away.",
    es: "El Concierge aún se está configurando. Habla con nuestro equipo por WhatsApp y te respondemos enseguida.",
  },
  AI_RATE_LIMIT: {
    pt: "Estamos com muitas conversas ao mesmo tempo. Tente de novo em instantes ou fale com a equipe pelo WhatsApp.",
    en: "We're handling many conversations right now. Try again shortly or reach our team on WhatsApp.",
    es: "Estamos con muchas conversaciones a la vez. Inténtalo en unos instantes o habla con el equipo por WhatsApp.",
  },
  AI_TIMEOUT: {
    pt: "A resposta demorou mais do que o esperado. Pode tentar de novo?",
    en: "The response took longer than expected. Could you try again?",
    es: "La respuesta tardó más de lo esperado. ¿Puedes intentar de nuevo?",
  },
  AI_CONTENT_BLOCKED: {
    pt: "Não consigo responder isso por aqui. Se for sobre uma viagem, me conte de outro jeito — ou fale com a equipe pelo WhatsApp.",
    en: "I can't answer that here. If it's about a trip, tell me another way — or talk to our team on WhatsApp.",
    es: "No puedo responder eso aquí. Si es sobre un viaje, cuéntame de otra forma — o habla con el equipo por WhatsApp.",
  },
  LIMITE_LOCAL: {
    pt: "Você enviou muitas mensagens em pouco tempo. Aguarde um minuto e continuamos.",
    en: "You've sent many messages in a short time. Wait a minute and we'll continue.",
    es: "Enviaste muchos mensajes en poco tiempo. Espera un minuto y seguimos.",
  },
  PADRAO: {
    pt: "Não consegui responder agora. Pode tentar de novo ou falar direto com nossa equipe.",
    en: "I couldn't respond right now. Try again or talk directly with our team.",
    es: "No pude responder ahora. Intenta de nuevo o habla directamente con nuestro equipo.",
  },
};

function respostaDeErro(idioma: string, codigo: string, status = 500) {
  const conjunto = MENSAGENS[codigo] ?? MENSAGENS.PADRAO;
  return NextResponse.json(
    {
      success: false,
      error: conjunto[idioma] ?? conjunto.pt,
      errorCode: codigo,
      handoffAvailable: true,
    },
    { status }
  );
}

// ── Identificação de contato ───────────────────────────────────────────────
/**
 * Extrai contato do que a pessoa escreveu espontaneamente. Não é enriquecimento
 * de dado: só reconhece o que ela mesma digitou para ser contatada.
 */
function extrairContato(textos: string[]) {
  const texto = textos.join("\n");
  const email = texto.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)?.[0];
  // Exige DDD para não capturar ano, CEP ou número de voo.
  const telefone = texto.match(/(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}/)?.[0];
  const nome = texto.match(
    /(?:me chamo|meu nome (?:é|e)|sou o|sou a|my name is|i am|me llamo|soy)\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]{1,20}(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]{1,20}){0,2})/i
  )?.[1];
  return { nome, email, telefone };
}

// ── Handler ────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const inicio = Date.now();
  let idioma: "pt" | "en" | "es" = "pt";

  try {
    let corpo: Record<string, unknown>;
    try {
      corpo = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corpo inválido", errorCode: "INVALID_BODY" },
        { status: 400 }
      );
    }

    idioma = normalizarIdioma(corpo.language);

    const mensagemBruta = typeof corpo.message === "string" ? corpo.message : "";
    const mensagem = limpar(mensagemBruta).slice(0, MAX_CARACTERES);
    if (!mensagem) {
      return NextResponse.json(
        { success: false, error: "Mensagem obrigatória", errorCode: "EMPTY_MESSAGE" },
        { status: 400 }
      );
    }

    const sessionId = typeof corpo.sessionId === "string" ? corpo.sessionId : "";
    if (sessionId.length < 5 || sessionId.length > 100) {
      return NextResponse.json(
        { success: false, error: "Sessão inválida", errorCode: "INVALID_SESSION" },
        { status: 400 }
      );
    }

    const conversationId =
      typeof corpo.conversationId === "string" && RE_UUID.test(corpo.conversationId)
        ? corpo.conversationId
        : undefined;
    // ID malformado é ignorado em silêncio: começa uma conversa nova em vez
    // de devolver erro para quem só está com sessionStorage antigo.

    const paginaOrigem = limpar(String(corpo.sourcePage ?? "/")).slice(0, 200);

    const limite = verificarLimite(identificar(request.headers), LIMITE_CHAT);
    if (!limite.permitido) {
      const resposta = respostaDeErro(idioma, "LIMITE_LOCAL", 429);
      resposta.headers.set("Retry-After", String(limite.esperarSegundos));
      return resposta;
    }

    const configIA = detectAIConfig();
    if (!configIA) {
      return respostaDeErro(idioma, "AI_PROVIDER_NOT_CONFIGURED", 503);
    }

    const supabase = conectarSupabase();

    // ── Conversa ───────────────────────────────────────────────────────────
    let convId = conversationId;
    if (supabase && !convId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          visitor_id: sessionId,
          language: idioma,
          metadata: {
            source_page: paginaOrigem,
            user_agent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
          },
        })
        .select("id")
        .single();

      if (error) console.error("[concierge] criar conversa:", error.message);
      else convId = data.id;
    }

    if (supabase && convId) {
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: convId, role: "user", content: mensagem });
      if (error) console.error("[concierge] gravar mensagem do visitante:", error.message);
    }

    // ── Histórico ──────────────────────────────────────────────────────────
    let historico: Array<{ role: string; content: string }> = [];
    if (supabase && convId) {
      const { data } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORICO);
      // Busca em ordem decrescente para pegar as mais recentes numa conversa
      // longa, e reinverte — ordem crescente com limite traria o começo.
      historico = (data ?? []).reverse();
    }

    // ── Contexto ───────────────────────────────────────────────────────────
    let blocoContexto = "";
    let experienciasRecomendadas: Awaited<ReturnType<typeof retrieveNeoSensesContext>>["experiences"] = [];

    if (supabase) {
      try {
        const contexto = await retrieveNeoSensesContext(supabase, mensagem, idioma, paginaOrigem);
        blocoContexto = formatContextForPrompt(contexto, idioma);
        experienciasRecomendadas = contexto.experiences.slice(0, 3);
      } catch (err) {
        console.error("[concierge] busca de contexto:", err instanceof Error ? err.message : err);
      }
    }

    // ── IA ─────────────────────────────────────────────────────────────────
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511947188319";
    const promptSistema = buildConciergeSystemPrompt(idioma, blocoContexto, whatsapp);

    // A última mensagem do histórico é a que acabou de ser gravada; ela entra
    // separadamente para garantir que o turno termine no visitante.
    const anteriores = historico
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(0, -1);

    const mensagens: ChatMessage[] = [
      { role: "system", content: promptSistema },
      ...anteriores.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: mensagem },
    ];

    const resposta = await generateAIResponse(mensagens, configIA, {
      maxTokens: 2048,
      temperature: 0.7,
      thinking: "low",
    });

    // ── Guarda de saída ────────────────────────────────────────────────────
    // Última barreira antes de a resposta chegar ao visitante. O modelo só
    // recebe contexto público, mas instrução no prompt é orientação, não
    // garantia: aqui se verifica o que ele de fato escreveu.
    const guarda = verificarResposta(resposta.content);
    let conteudoFinal = resposta.content;

    if (!guarda.liberado) {
      console.warn(
        `[concierge] resposta barrada (${guarda.motivo}) — evidência: ${guarda.evidencia ?? "?"}`
      );
      conteudoFinal = respostaSegura(idioma);
    }

    // ── Gravação da resposta ───────────────────────────────────────────────
    let mensagemId: string | null = null;
    if (supabase && convId) {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: conteudoFinal,
          recommended_experiences: experienciasRecomendadas.map((e) => e.id),
          metadata: {
            provider: resposta.provider,
            model: resposta.model,
            tokens_used: resposta.tokensUsed ?? null,
            response_time_ms: resposta.responseTimeMs,
            finish_reason: resposta.finishReason ?? null,
          },
        })
        .select("id")
        .single();

      if (error) console.error("[concierge] gravar resposta:", error.message);
      else mensagemId = data.id;

      if (mensagemId && experienciasRecomendadas.length > 0) {
        const { error: erroRec } = await supabase.from("ai_recommendations").insert(
          experienciasRecomendadas.map((e, i) => ({
            conversation_id: convId!,
            message_id: mensagemId!,
            experience_id: e.id,
            position: i + 1,
          }))
        );
        if (erroRec) console.error("[concierge] gravar recomendações:", erroRec.message);
      }

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    }

    // ── Contato ────────────────────────────────────────────────────────────
    if (supabase && convId) {
      // Lê a conversa inteira, não a janela de contexto. O nome costuma
      // aparecer nas primeiras mensagens e o telefone lá na frente; com a
      // janela de 16, a apresentação já saiu do alcance quando o telefone
      // chega, e o contato ficava pela metade.
      const { data: tudo } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", convId)
        .eq("role", "user")
        .order("created_at", { ascending: true })
        .limit(200);

      const contato = extrairContato([...(tudo ?? []).map((m) => m.content), mensagem]);

      if (contato.email || contato.telefone) {
        // Só os campos encontrados entram no upsert.
        //
        // Mandar `campo: null` fazia o PostgREST gerar
        // `DO UPDATE SET email = excluded.email`, e o null sobrescrevia o que
        // já estava gravado: quem se apresentava no começo e passava o
        // telefone depois tinha nome e e-mail apagados na segunda passada.
        const registro: Record<string, unknown> = {
          conversation_id: convId,
          language: idioma,
          source_page: paginaOrigem,
          raw_context: mensagem.slice(0, 500),
        };
        if (contato.nome) registro.name = contato.nome;
        if (contato.email) registro.email = contato.email;
        if (contato.telefone) registro.phone = contato.telefone;

        const { error } = await supabase
          .from("ai_lead_captures")
          .upsert(registro as never, { onConflict: "conversation_id" });

        if (error) console.error("[concierge] captação de contato:", error.message);
      }
    }

    console.log(
      `[concierge] ${resposta.provider}/${resposta.model} · IA ${resposta.responseTimeMs}ms · total ${Date.now() - inicio}ms · ${
        resposta.tokensUsed ?? "?"
      } tokens`
    );

    return NextResponse.json({
      success: true,
      conversationId: convId ?? null,
      message: {
        id: mensagemId,
        role: "assistant",
        content: conteudoFinal,
        createdAt: new Date().toISOString(),
      },
      recommendations: experienciasRecomendadas.map((e, i) => ({
        type: "experience" as const,
        id: e.id,
        title: e.title,
        slug: e.slug,
        destination: e.destination,
        duration: e.duration,
        publishedPrice: e.priceFrom,
        url: e.url,
        position: i + 1,
      })),
      handoffAvailable: true,
    });
  } catch (err) {
    if (err instanceof AIError) {
      // O detalhe técnico fica no log; o visitante recebe texto humano.
      console.error(`[concierge] ${err.code}: ${err.detail ?? ""}`);
      const status = err.code === "AI_RATE_LIMIT" ? 429 : err.code === "AI_TIMEOUT" ? 504 : 502;
      return respostaDeErro(idioma, err.code, status);
    }
    console.error("[concierge] erro inesperado:", err instanceof Error ? err.stack : err);
    return respostaDeErro(idioma, "PADRAO", 500);
  }
}
