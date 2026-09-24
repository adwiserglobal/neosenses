/**
 * POST /api/journey — gera um roteiro a partir do questionário.
 *
 * O catálogo do site é uma fonte de primeira parte e fica disponível mesmo
 * quando o Supabase não está configurado no runtime. O banco enriquece o
 * catálogo com preço/data e permite salvar o resultado, mas não é mais um
 * pré-requisito para a pessoa conseguir montar o roteiro.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { detectAIConfig, AIError } from "@/lib/ai/provider";
import { validarRespostas, type Respostas } from "@/lib/journey/perguntas";
import { gerarRoteiro, type ExperienciaDisponivel } from "@/lib/journey/gerador";
import { identificar, verificarLimite, LIMITE_ROTEIRO } from "@/lib/limite";
import { migratedExperiences } from "@/content/migratedExperiences";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function conectarLeitura() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return null;
  return createClient<Database>(url, chave, { auth: { persistSession: false } });
}

function conectarEscrita() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient<Database>(url, chave, { auth: { persistSession: false } });
}

function erro(mensagem: string, codigo: string, status: number) {
  return NextResponse.json({ success: false, error: mensagem, errorCode: codigo }, { status });
}

function catalogoDoSite(): ExperienciaDisponivel[] {
  return migratedExperiences.map((exp) => {
    const ultimoDia = exp.itinerary.length > 0
      ? Math.max(...exp.itinerary.map((d) => d.day))
      : null;

    const alvo = `${exp.kicker} ${exp.summary} ${exp.description}`.toLowerCase();
    const intencoes: string[] = [];
    if (/medita|espiritual|sagrado|peregrina/.test(alvo)) intencoes.push("espiritualidade");
    if (/natureza|montanha|floresta|ilha|chapada|lagoa/.test(alvo)) intencoes.push("natureza");
    if (/cultura|tradi|templo|hist[oó]ria/.test(alvo)) intencoes.push("cultura_local");
    if (/autoconhecimento|reconex|transforma/.test(alvo)) intencoes.push("autoconhecimento");

    return {
      id: `site:${exp.slug}`,
      titulo: exp.title,
      slug: exp.slug,
      destino: exp.destination,
      pais: exp.country,
      dias: ultimoDia,
      precoTexto: "sob consulta",
      resumo: exp.summary.slice(0, 300),
      intencoes,
      dificuldade: "all_levels",
      proximasDatas: [],
    };
  });
}

export async function POST(request: NextRequest) {
  const inicio = Date.now();

  try {
    const corpo = await request.json().catch(() => null);
    if (!corpo || typeof corpo !== "object") {
      return erro("Não entendi os dados enviados.", "INVALID_BODY", 400);
    }

    const { respostas, sessionId } = corpo as { respostas?: Respostas; sessionId?: string };

    if (!respostas || typeof respostas !== "object") {
      return erro("Responda o questionário para continuar.", "SEM_RESPOSTAS", 400);
    }
    if (typeof sessionId !== "string" || sessionId.length < 5 || sessionId.length > 100) {
      return erro("Sessão inválida.", "SESSAO_INVALIDA", 400);
    }

    const problemas = validarRespostas(respostas);
    if (problemas.length > 0) {
      return NextResponse.json(
        { success: false, error: "Faltou responder algo.", errorCode: "VALIDACAO", problemas },
        { status: 400 }
      );
    }

    const limite = verificarLimite(identificar(request.headers), LIMITE_ROTEIRO);
    if (!limite.permitido) {
      const resposta = erro(
        "Você já montou alguns roteiros na última hora. Aguarde um pouco ou fale com a equipe.",
        "LIMITE",
        429
      );
      resposta.headers.set("Retry-After", String(limite.esperarSegundos));
      return resposta;
    }

    const configIA = detectAIConfig();
    if (!configIA) {
      return erro(
        "O montador de roteiros está sendo configurado. Fale com nossa equipe pelo WhatsApp.",
        "IA_NAO_CONFIGURADA",
        503
      );
    }

    // ── Catálogo ───────────────────────────────────────────────────────────
    const leitura = conectarLeitura();
    const hoje = new Date().toISOString().slice(0, 10);
    let brutas: any[] = [];

    if (leitura) {
      const { data, error: erroCatalogo } = await leitura
        .from("experiences")
        .select(
          `id, title, slug, short_description, duration_days, price_from, price_currency,
           difficulty, intentions,
           destination:destinations(name, country:countries(name)),
           experience_dates(start_date, end_date, spots_total, spots_taken, status)`
        )
        .eq("status", "published")
        .eq("audience", "viajante")
        .order("is_featured", { ascending: false })
        .limit(30);

      if (erroCatalogo) {
        console.error("[journey] ler catálogo do banco:", erroCatalogo.message);
      } else {
        brutas = data ?? [];
      }
    }

    const i18n = (campo: unknown): string => {
      if (!campo) return "";
      if (typeof campo === "string") return campo;
      const o = campo as Record<string, string>;
      return o.pt || o.en || Object.values(o).find(Boolean) || "";
    };

    const experienciasBanco: ExperienciaDisponivel[] = brutas.map((e) => {
      const destino = e.destination as { name: unknown; country: { name: unknown } | null } | null;

      const datas = ((e.experience_dates ?? []) as Array<Record<string, unknown>>)
        .filter((d) => d.status === "published" && String(d.start_date) >= hoje)
        .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))
        .slice(0, 3)
        .map((d) => {
          const total = d.spots_total as number | null;
          const tomadas = (d.spots_taken as number) ?? 0;
          const vagas =
            total === null ? "consultar" : total - tomadas <= 0 ? "esgotado" : `${total - tomadas} vagas`;
          return `${d.start_date} a ${d.end_date} (${vagas})`;
        });

      return {
        id: e.id,
        titulo: i18n(e.title),
        slug: i18n(e.slug),
        destino: destino ? i18n(destino.name) : "",
        pais: destino?.country ? i18n(destino.country.name) : "",
        dias: e.duration_days,
        precoTexto: e.price_from
          ? `a partir de ${e.price_currency === "BRL" ? "R$" : e.price_currency} ${Number(
              e.price_from
            ).toLocaleString("pt-BR")}`
          : "sob consulta",
        resumo: i18n(e.short_description).slice(0, 300),
        intencoes: (e.intentions ?? []) as string[],
        dificuldade: e.difficulty ?? "all_levels",
        proximasDatas: datas,
      };
    });

    // O banco sobrescreve a versão estática da mesma página quando existir,
    // porque aí temos id real, datas e preço. As páginas que ainda não estão
    // no banco continuam disponíveis para o montador.
    const porSlug = new Map<string, ExperienciaDisponivel>();
    for (const exp of catalogoDoSite()) porSlug.set(exp.slug, exp);
    for (const exp of experienciasBanco) porSlug.set(exp.slug, exp);
    const experiencias = Array.from(porSlug.values());
    const idsDoBanco = new Set(experienciasBanco.map((e) => e.id));

    // ── Geração ────────────────────────────────────────────────────────────
    const resultado = await gerarRoteiro(experiencias, respostas, configIA);

    if (!resultado) {
      return erro(
        "Não consegui montar um roteiro que fizesse sentido agora. Tente de novo ou fale com nossa equipe.",
        "ROTEIRO_INVALIDO",
        502
      );
    }

    // ── Gravação opcional ─────────────────────────────────────────────────
    const escrita = conectarEscrita();
    if (!escrita) {
      console.warn("[journey] sem service role — roteiro gerado sem persistência");
      return NextResponse.json({
        success: true,
        roteiro: resultado.roteiro,
        token: null,
        aviso: "Seu roteiro foi montado normalmente, mas não conseguimos gerar um link permanente agora.",
      });
    }

    const { data: gravado, error: erroGravar } = await escrita
      .from("ai_journeys")
      .insert({
        visitor_id: sessionId,
        input: respostas as never,
        itinerary: resultado.roteiro as never,
        summary: resultado.roteiro.resumo,
        language: "pt",
        status: "saved",
        ai_provider: resultado.provider,
        ai_model: resultado.model,
        tokens_used: resultado.tokensUsed ?? null,
        generation_ms: resultado.tempoMs,
      })
      .select("id, access_token")
      .single();

    if (erroGravar || !gravado) {
      console.error("[journey] gravar:", erroGravar?.message ?? "sem retorno");
      return NextResponse.json({
        success: true,
        roteiro: resultado.roteiro,
        token: null,
        aviso: "Seu roteiro foi montado normalmente, mas não conseguimos gerar um link permanente agora.",
      });
    }

    // Só IDs vindos do banco podem entrar na FK de ai_journey_experiences.
    const citadas = resultado.roteiro.trechos.filter(
      (t) => t.experienceId && idsDoBanco.has(t.experienceId)
    );
    if (citadas.length > 0) {
      const { error: erroVinculo } = await escrita.from("ai_journey_experiences").insert(
        citadas.map((t, i) => ({
          journey_id: gravado.id,
          experience_id: t.experienceId!,
          day_from: t.de,
          day_to: t.ate,
          position: i + 1,
          reason: t.titulo,
        }))
      );
      if (erroVinculo) console.error("[journey] vincular experiências:", erroVinculo.message);
    }

    console.log(
      `[journey] ${resultado.provider}/${resultado.model} · ${resultado.tempoMs}ms IA · ` +
        `${Date.now() - inicio}ms total · ${resultado.roteiro.trechos.length} trechos · ` +
        `${citadas.length} do banco · ${experiencias.length} opções no catálogo`
    );

    return NextResponse.json({
      success: true,
      roteiro: resultado.roteiro,
      token: gravado.access_token,
    });
  } catch (err) {
    if (err instanceof AIError) {
      console.error(`[journey] ${err.code}: ${err.detail ?? ""}`);
      const mensagens: Record<string, string> = {
        AI_RATE_LIMIT: "Estamos com muitos roteiros sendo montados. Tente em alguns minutos.",
        AI_TIMEOUT: "A montagem demorou mais que o esperado. Pode tentar de novo?",
        AI_CONTENT_BLOCKED: "Não consegui montar com essas respostas. Tente descrever de outro jeito.",
      };
      const status = err.code === "AI_RATE_LIMIT" ? 429 : err.code === "AI_TIMEOUT" ? 504 : 502;
      return erro(
        mensagens[err.code] ?? "Não consegui montar o roteiro agora.",
        err.code,
        status
      );
    }

    console.error("[journey] erro inesperado:", err instanceof Error ? err.stack : err);
    return erro("Não consegui montar o roteiro agora.", "ERRO", 500);
  }
}
