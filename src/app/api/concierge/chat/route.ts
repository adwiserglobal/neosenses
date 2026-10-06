/**
 * POST /api/concierge/chat
 *
 * Fluxo: valida → limita → busca contexto → chama a IA → grava → responde.
 *
 * Tudo roda no servidor. A chave da IA e a service_role nunca chegam ao
 * navegador. Falha do banco não impede o visitante de ser atendido: além do
 * Supabase, o Concierge conhece o conteúdo confirmado que já está publicado
 * nas páginas do próprio site.
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
import {
  buildSiteKnowledgeContext,
  siteRecommendationsForResponse,
  type SiteRecommendation,
} from "@/lib/ai/siteKnowledge";
import { buildConciergeSystemPrompt } from "@/lib/ai/prompt";
import { migratedExperiences } from "@/content/migratedExperiences";
import { verificarResposta, respostaSegura } from "@/lib/ai/guardas";
import { identificar, verificarLimite, LIMITE_CHAT } from "@/lib/limite";

export const dynamic = "force-dynamic";

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

  const chave = secreta && secreta.length > 10 ? secreta : publica;
  if (!chave) return null;
  if (!secreta) {
    console.warn(
      "[concierge] SUPABASE_SERVICE_ROLE_KEY ausente, a conversa não será gravada (RLS pode bloquear escrita anônima)"
    );
  }

  return createClient<Database>(url, chave, { auth: { persistSession: false } });
}

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CARACTERES = 1500;
const MAX_HISTORICO = 6;
const MAX_CARDS = 8;

function normalizarIdioma(valor: unknown): "pt" | "en" | "es" {
  const curto = String(valor ?? "pt").split("-")[0].toLowerCase();
  return curto === "en" || curto === "es" ? curto : "pt";
}

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

function normalizarComparacao(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
    pt: "Não consigo responder isso por aqui. Se for sobre uma viagem, me conte de outro jeito, ou fale com a equipe pelo WhatsApp.",
    en: "I can't answer that here. If it's about a trip, tell me another way, or talk to our team on WhatsApp.",
    es: "No puedo responder eso aquí. Si es sobre un viaje, cuéntame de otra forma, o habla con el equipo por WhatsApp.",
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

function extrairContato(textos: string[]) {
  const texto = textos.join("\n");
  const email = texto.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)?.[0];
  const telefone = texto.match(/(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}/)?.[0];
  const nome = texto.match(
    /(?:me chamo|meu nome (?:é|e)|sou o|sou a|my name is|i am|me llamo|soy)\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]{1,20}(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]{1,20}){0,2})/i
  )?.[1];
  return { nome, email, telefone };
}

function experienciaFoiMencionada(
  conteudo: string,
  experiencia: { title: string; slug: string; destination: string }
): boolean {
  const texto = normalizarComparacao(conteudo);
  const titulo = normalizarComparacao(experiencia.title);
  const slug = normalizarComparacao(experiencia.slug.replace(/-/g, " "));
  const destino = normalizarComparacao(experiencia.destination);

  if (titulo && texto.includes(titulo)) return true;
  if (slug && texto.includes(slug)) return true;
  if (destino.length >= 7 && texto.includes(destino)) return true;
  return false;
}

function experienciaLocalPorMensagem(mensagem: string) {
  const normalizada = normalizarComparacao(mensagem);
  return migratedExperiences.find((exp) => {
    const alvos = [
      exp.title,
      exp.slug.replace(/-/g, " "),
      exp.destination,
      exp.country,
    ]
      .map(normalizarComparacao)
      .filter(Boolean);
    return alvos.some((alvo) => alvo.length >= 4 && normalizada.includes(alvo));
  });
}

function ehPedidoDeCatalogoLocal(mensagem: string) {
  const p = normalizarComparacao(mensagem);
  return /\b(quais|lista|opcoes|catalogo|viagens|experiencias|roteiros|destinos)\b/.test(p) &&
    /\b(quais|lista|opcoes|catalogo|tem|oferecem)\b/.test(p);
}

function respostaLocalRapida(mensagem: string, idioma: "pt" | "en" | "es") {
  if (idioma !== "pt") return null;

  const exp = experienciaLocalPorMensagem(mensagem);
  const p = normalizarComparacao(mensagem);

  if (exp && /\b(quero|conhecer|sobre|como e|me fala|conte|interesse|peru|tailandia|india|franca|chapada)\b/.test(p)) {
    const content =
      `${exp.title} é uma jornada da NeoSenses em ${exp.destination}. ${exp.summary} ` +
      `As próximas saídas estão sob consulta. Você pode conhecer a proposta completa em /experiencias/${exp.slug}.`;

    return {
      content,
      cards: [{
        type: "experience" as const,
        id: `site:${exp.slug}`,
        title: exp.title,
        slug: exp.slug,
        destination: exp.destination,
        duration: exp.itinerary.length ? `${Math.max(...exp.itinerary.map((d) => d.day))} dias` : "",
        publishedPrice: "",
        url: `/experiencias/${exp.slug}`,
        image: exp.hero,
        summary: exp.summary,
        position: 1,
      }],
    };
  }

  if (ehPedidoDeCatalogoLocal(mensagem)) {
    const lista = migratedExperiences
      .slice(0, 6)
      .map((e) => `${e.title} (${e.destination})`)
      .join(", ");
    return {
      content: `Hoje você pode explorar estas jornadas publicadas: ${lista}. Se me disser que tipo de experiência procura, eu te ajudo a escolher.`,
      cards: migratedExperiences.slice(0, 6).map((exp, i) => ({
        type: "experience" as const,
        id: `site:${exp.slug}`,
        title: exp.title,
        slug: exp.slug,
        destination: exp.destination,
        duration: exp.itinerary.length ? `${Math.max(...exp.itinerary.map((d) => d.day))} dias` : "",
        publishedPrice: "",
        url: `/experiencias/${exp.slug}`,
        image: exp.hero,
        summary: exp.summary,
        position: i + 1,
      })),
    };
  }

  if (/\b(descansar|reconectar|reconexao|pausa|natureza|desacelerar)\b/.test(p)) {
    const expReconexao =
      migratedExperiences.find((e) => e.slug === "chapada-dos-veadeiros") ??
      migratedExperiences[0];
    if (!expReconexao) return null;
    return {
      content:
        `Para uma busca de pausa e reconexão, ${expReconexao.title} pode fazer bastante sentido. ` +
        `${expReconexao.summary} As próximas saídas estão sob consulta. Quer que eu te conte como é a proposta dessa jornada?`,
      cards: [{
        type: "experience" as const,
        id: `site:${expReconexao.slug}`,
        title: expReconexao.title,
        slug: expReconexao.slug,
        destination: expReconexao.destination,
        duration: "",
        publishedPrice: "",
        url: `/experiencias/${expReconexao.slug}`,
        image: expReconexao.hero,
        summary: expReconexao.summary,
        position: 1,
      }],
    };
  }

  return null;
}

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

    const paginaOrigem = limpar(String(corpo.sourcePage ?? "/")).slice(0, 200);

    // Persistimos a conversa ANTES do atalho local. Antes, respostas rápidas
    // saíam daqui sem conversationId nem histórico; a mensagem seguinte
    // ("sim", "quero", etc.) chegava à IA sem contexto.
    const supabase = conectarSupabase();

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

    const local = respostaLocalRapida(mensagem, idioma);
    if (local) {
      let mensagemId: string | null = null;

      if (supabase && convId) {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: convId,
            role: "assistant",
            content: local.content,
            metadata: {
              provider: "site",
              model: "local-fast-path",
              response_time_ms: Date.now() - inicio,
            },
          })
          .select("id")
          .single();

        if (error) console.error("[concierge] gravar resposta local:", error.message);
        else mensagemId = data.id;

        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }

      return NextResponse.json({
        success: true,
        conversationId: convId ?? null,
        message: {
          id: mensagemId,
          role: "assistant",
          content: local.content,
          createdAt: new Date().toISOString(),
        },
        recommendations: local.cards,
        handoffAvailable: true,
        source: "site",
      });
    }

    const limite = verificarLimite(identificar(request.headers), LIMITE_CHAT);
    if (!limite.permitido) {
      const resposta = respostaDeErro(idioma, "LIMITE_LOCAL", 429);
      resposta.headers.set("Retry-After", String(limite.esperarSegundos));
      return resposta;
    }

    // Respeita AI_PROVIDER/AI_MODEL e o auto-detect central. A rota estava
    // forçando NVIDIA DeepSeek sempre que NVIDIA_API_KEY existia, ignorando
    // a configuração escolhida no ambiente.
    const configIA = detectAIConfig();
    if (!configIA) {
      return respostaDeErro(idioma, "AI_PROVIDER_NOT_CONFIGURED", 503);
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
      historico = (data ?? []).reverse();
    }

    // ── Contexto ───────────────────────────────────────────────────────────
    const contextoSite = buildSiteKnowledgeContext(mensagem, paginaOrigem);
    let blocoContexto = contextoSite;
    let experienciasDoContexto: Awaited<ReturnType<typeof retrieveNeoSensesContext>>["experiences"] = [];

    if (supabase) {
      try {
        const contexto = await retrieveNeoSensesContext(supabase, mensagem, idioma, paginaOrigem);
        const contextoBanco = formatContextForPrompt(contexto, idioma);
        experienciasDoContexto = contexto.experiences.slice(0, MAX_CARDS);

        blocoContexto = (contexto.catalogoVazio && contextoSite
          ? contextoSite
          : [contextoBanco, contextoSite].filter(Boolean).join("\n\n")).slice(0, 6500);
      } catch (err) {
        console.error("[concierge] busca de contexto:", err instanceof Error ? err.message : err);
        blocoContexto = contextoSite;
      }
    }

    // ── IA ─────────────────────────────────────────────────────────────────
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511947188319";
    const promptSistema = buildConciergeSystemPrompt(idioma, blocoContexto, whatsapp);

    const anteriores = historico
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(0, -1);

    const mensagens: ChatMessage[] = [
      { role: "system", content: promptSistema },
      ...anteriores.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: mensagem },
    ];

    const resposta = await generateAIResponse(mensagens, configIA, {
      // 12s estava derrubando respostas válidas como timeout em produção.
      // A função da Vercel permite até 60s; 25s dá margem sem deixar o chat
      // preso por tempo demais.
      maxTokens: 420,
      temperature: 0.45,
      timeoutMs: 25_000,
      thinking: "low",
    });

    const guarda = verificarResposta(resposta.content);
    let conteudoFinal = resposta.content;

    if (!guarda.liberado) {
      console.warn(
        `[concierge] resposta barrada (${guarda.motivo}), evidência: ${guarda.evidencia ?? "?"}`
      );
      conteudoFinal = respostaSegura(idioma);
    }

    // ── Cards das jornadas realmente citadas ──────────────────────────────
    const cardsSite = siteRecommendationsForResponse(
      conteudoFinal,
      mensagem,
      paginaOrigem,
      MAX_CARDS
    );

    const experienciasMencionadasBanco = experienciasDoContexto.filter((e) =>
      experienciaFoiMencionada(conteudoFinal, e)
    );

    const imagemPorId = new Map<string, string>();
    if (supabase && experienciasMencionadasBanco.length > 0) {
      const ids = experienciasMencionadasBanco.map((e) => e.id);
      const { data: fotos, error: erroFotos } = await supabase
        .from("experiences")
        .select("id, hero_image")
        .in("id", ids);

      if (erroFotos) {
        console.error("[concierge] imagens dos cards:", erroFotos.message);
      } else {
        for (const item of fotos ?? []) {
          if (item.hero_image) imagemPorId.set(item.id, item.hero_image);
        }
      }
    }

    const cardsPorSlug = new Map<string, SiteRecommendation>();
    for (const card of cardsSite) cardsPorSlug.set(card.slug, card);

    for (const e of experienciasMencionadasBanco) {
      const anterior = cardsPorSlug.get(e.slug);
      cardsPorSlug.set(e.slug, {
        type: "experience",
        id: e.id,
        title: e.title,
        slug: e.slug,
        destination: e.destination,
        duration: e.duration,
        publishedPrice: e.priceFrom,
        url: e.url,
        image: imagemPorId.get(e.id) || anterior?.image || "",
        summary: anterior?.summary || e.shortDescription,
      });
    }

    const cards = Array.from(cardsPorSlug.values()).slice(0, MAX_CARDS);

    // ── Gravação da resposta ───────────────────────────────────────────────
    let mensagemId: string | null = null;
    if (supabase && convId) {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          role: "assistant",
          content: conteudoFinal,
          recommended_experiences: experienciasMencionadasBanco.map((e) => e.id),
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

      if (mensagemId && experienciasMencionadasBanco.length > 0) {
        const { error: erroRec } = await supabase.from("ai_recommendations").insert(
          experienciasMencionadasBanco.map((e, i) => ({
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
      const { data: tudo } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", convId)
        .eq("role", "user")
        .order("created_at", { ascending: true })
        .limit(200);

      const contato = extrairContato([...(tudo ?? []).map((m) => m.content), mensagem]);

      if (contato.email || contato.telefone) {
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
      } tokens · ${cards.length} cards`
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
      recommendations: cards.map((card, i) => ({
        ...card,
        position: i + 1,
      })),
      handoffAvailable: true,
    });
  } catch (err) {
    if (err instanceof AIError) {
      console.error(`[concierge] ${err.code}: ${err.detail ?? ""}`);
      if (err.code === "AI_TIMEOUT") {
        return NextResponse.json({
          success: true,
          conversationId: null,
          message: {
            id: null,
            role: "assistant",
            content:
              idioma === "pt"
                ? "Estou com uma demora na resposta automática agora. Posso te ajudar pelas opções do menu, pelas páginas das experiências ou você pode falar com a equipe no WhatsApp."
                : idioma === "en"
                  ? "The automatic response is taking longer right now. You can use the menu, explore the experience pages or contact our team on WhatsApp."
                  : "La respuesta automática está tardando ahora. Puedes usar el menú, ver las páginas de experiencias o hablar con nuestro equipo por WhatsApp.",
            createdAt: new Date().toISOString(),
          },
          recommendations: [],
          handoffAvailable: true,
          degraded: true,
        });
      }
      const status = err.code === "AI_RATE_LIMIT" ? 429 : 502;
      return respostaDeErro(idioma, err.code, status);
    }
    console.error("[concierge] erro inesperado:", err instanceof Error ? err.stack : err);
    return respostaDeErro(idioma, "PADRAO", 500);
  }
}
