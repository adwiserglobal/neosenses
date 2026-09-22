/**
 * Diagnóstico da instalação, para a tela /admin/supabase.
 *
 * O que esta tela responde: a qual banco o site está falando, se as migrations
 * subiram, se o RLS está fechado, quais chaves faltam e se a IA responde.
 *
 * O que ela NÃO faz: gravar credencial. Chave de banco e de IA continuam em
 * arquivo de ambiente por dois motivos — a `service_role` ignora o RLS, então
 * guardá-la onde a aplicação escreve entrega o banco a quem invadir o painel;
 * e o login do painel depende do Supabase, então configuração do Supabase
 * dentro do Supabase não teria como ser corrigida quando quebrasse.
 *
 * Roda apenas no servidor.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { detectAIConfig, testAIConnection } from "@/lib/ai/provider";

// ── Tipos ──────────────────────────────────────────────────────────────────
export type Severidade = "ok" | "atencao" | "erro";

export interface Verificacao {
  titulo: string;
  situacao: Severidade;
  detalhe: string;
  comoResolver?: string;
}

export interface TabelaDiagnostico {
  tabela: string;
  linhas: number;
  rls_ligado: boolean;
  qtd_policies: number;
  acesso_anonimo: boolean;
}

export interface Diagnostico {
  ambiente: "local" | "nuvem" | "indefinido";
  url: string;
  verificacoes: Verificacao[];
  tabelas: TabelaDiagnostico[];
  exposicoes: Array<{ tabela: string; policy: string; operacao: string }>;
  variaveisFaltando: string[];
}

/** Toda tabela que as migrations criam. Faltar alguma = migration não aplicada. */
const TABELAS_ESPERADAS = [
  "profiles", "countries", "destinations", "categories", "facilitators",
  "experiences", "experience_facilitators", "experience_dates", "itinerary_days",
  "experience_highlights", "experience_inclusions", "experience_faqs",
  "blog_categories", "blog_posts", "blog_tags", "blog_post_tags",
  "blog_post_experiences", "testimonials", "faqs", "newsletter_subscribers",
  "media", "settings", "feature_flags", "audit_logs", "leads", "bookings",
  "conversations", "messages", "ai_lead_captures", "ai_recommendations",
  "ai_feedback", "ai_knowledge_documents", "travel_guides",
  "packing_catalog_items", "experience_packing_items", "ai_journeys",
  "ai_journey_experiences", "packing_lists", "packing_list_items",
  "traveler_profiles", "community_matches",
];

function detectarAmbiente(url: string): Diagnostico["ambiente"] {
  if (!url) return "indefinido";
  if (/127\.0\.0\.1|localhost|host\.docker\.internal/.test(url)) return "local";
  return "nuvem";
}

export async function coletarDiagnostico(): Promise<Diagnostico> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const chaveSecreta = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const verificacoes: Verificacao[] = [];
  const variaveisFaltando: string[] = [];
  let tabelas: TabelaDiagnostico[] = [];
  let exposicoes: Diagnostico["exposicoes"] = [];

  // ── Variáveis ────────────────────────────────────────────────────────────
  if (!url) variaveisFaltando.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!chavePublica) variaveisFaltando.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!chaveSecreta) variaveisFaltando.push("SUPABASE_SERVICE_ROLE_KEY");

  verificacoes.push(
    chaveSecreta
      ? { titulo: "Chave de servidor", situacao: "ok", detalhe: "SUPABASE_SERVICE_ROLE_KEY configurada." }
      : {
          titulo: "Chave de servidor",
          situacao: "erro",
          detalhe:
            "SUPABASE_SERVICE_ROLE_KEY ausente. Sem ela o RLS bloqueia toda escrita: " +
            "formulários não gravam e o Concierge não registra conversa.",
          comoResolver:
            "Supabase → Settings → API → copie a chave service_role para SUPABASE_SERVICE_ROLE_KEY " +
            "no .env.local e reinicie o servidor.",
        }
  );

  if (!url || !chaveSecreta) {
    return {
      ambiente: detectarAmbiente(url),
      url,
      verificacoes: [
        ...verificacoes,
        {
          titulo: "Conexão",
          situacao: "erro",
          detalhe: "Faltam variáveis de ambiente para conectar ao banco.",
        },
      ],
      tabelas: [],
      exposicoes: [],
      variaveisFaltando,
    };
  }

  // ── Conexão ──────────────────────────────────────────────────────────────
  const supabase = createClient<Database>(url, chaveSecreta, { auth: { persistSession: false } });

  const inicio = Date.now();
  const { error: erroConexao } = await supabase.from("settings").select("key").limit(1);
  const latencia = Date.now() - inicio;

  if (erroConexao) {
    verificacoes.push({
      titulo: "Conexão com o banco",
      situacao: "erro",
      detalhe: `Falhou: ${erroConexao.message}`,
      comoResolver:
        detectarAmbiente(url) === "local"
          ? "O Supabase local está no ar? Rode `npx supabase start`."
          : "Confira a URL e a chave, e se o projeto não está pausado no painel do Supabase.",
    });
  } else {
    verificacoes.push({
      titulo: "Conexão com o banco",
      situacao: latencia > 1500 ? "atencao" : "ok",
      detalhe: `Respondeu em ${latencia} ms.`,
      comoResolver: latencia > 1500 ? "Latência alta — verifique a região do projeto." : undefined,
    });
  }

  // ── Migrations e RLS ─────────────────────────────────────────────────────
  // As funções de diagnóstico checam `is_admin()`, que depende de `auth.uid()`.
  // Com a service_role não há usuário na sessão e a checagem reprova — por isso
  // aqui se usa o cliente que carrega os cookies de quem está logado. A
  // permissão continua sendo decidida pelo banco, não pela aplicação.
  const comoUsuario = await createServerSupabaseClient();

  const { data: dadosTabelas, error: erroTabelas } = await comoUsuario.rpc("diagnostico_tabelas");

  if (erroTabelas) {
    verificacoes.push({
      titulo: "Migrations",
      situacao: "atencao",
      detalhe: `Não foi possível inspecionar o schema: ${erroTabelas.message}`,
      comoResolver:
        "A função diagnostico_tabelas() vem da migration 007. " +
        "Aplique supabase/migrations/007_diagnostico_admin.sql.",
    });
  } else {
    tabelas = (dadosTabelas ?? []) as TabelaDiagnostico[];
    const existentes = new Set(tabelas.map((t) => t.tabela));
    const faltando = TABELAS_ESPERADAS.filter((t) => !existentes.has(t));

    verificacoes.push(
      faltando.length === 0
        ? {
            titulo: "Migrations",
            situacao: "ok",
            detalhe: `As ${TABELAS_ESPERADAS.length} tabelas esperadas existem.`,
          }
        : {
            titulo: "Migrations",
            situacao: "erro",
            detalhe: `Faltam ${faltando.length} tabelas: ${faltando.slice(0, 6).join(", ")}${
              faltando.length > 6 ? "…" : ""
            }`,
            comoResolver:
              "Aplique os arquivos de supabase/migrations na ordem 001 a 007 pelo SQL Editor.",
          }
    );

    const semRLS = tabelas.filter((t) => !t.rls_ligado);
    verificacoes.push(
      semRLS.length === 0
        ? { titulo: "Row Level Security", situacao: "ok", detalhe: `RLS ligado nas ${tabelas.length} tabelas.` }
        : {
            titulo: "Row Level Security",
            situacao: "erro",
            detalhe: `${semRLS.length} tabela(s) sem RLS: ${semRLS.map((t) => t.tabela).join(", ")}. ` +
              "Tabela sem RLS é legível por qualquer pessoa com a chave pública, que vai no site.",
            comoResolver: "Reaplique supabase/migrations/005_rls_policies.sql.",
          }
    );
  }

  // ── Exposição de dado pessoal ────────────────────────────────────────────
  const { data: dadosExposicao, error: erroExposicao } = await comoUsuario.rpc("diagnostico_exposicao");

  if (!erroExposicao) {
    exposicoes = (dadosExposicao ?? []) as Diagnostico["exposicoes"];
    verificacoes.push(
      exposicoes.length === 0
        ? {
            titulo: "Dados pessoais",
            situacao: "ok",
            detalhe: "Nenhuma tabela com dado pessoal aceita leitura anônima.",
          }
        : {
            titulo: "Dados pessoais",
            situacao: "erro",
            detalhe:
              `${exposicoes.length} policy(s) expõem dado pessoal ao público: ` +
              exposicoes.map((e) => `${e.tabela}.${e.policy}`).join(", "),
            comoResolver:
              "Remova essas policies. A chave pública vai no JavaScript do site — " +
              "o que ela lê, qualquer visitante lê.",
          }
    );
  }

  // ── IA ───────────────────────────────────────────────────────────────────
  const configIA = detectAIConfig();
  if (!configIA) {
    variaveisFaltando.push("GOOGLE_GENERATIVE_AI_API_KEY");
    verificacoes.push({
      titulo: "Concierge (IA)",
      situacao: "erro",
      detalhe: "Nenhum provedor configurado — o Concierge responde só a mensagem de indisponível.",
      comoResolver:
        "Defina GOOGLE_GENERATIVE_AI_API_KEY no .env.local (chave em aistudio.google.com/apikey).",
    });
  } else {
    const teste = await testAIConnection();
    verificacoes.push(
      teste.success
        ? {
            titulo: "Concierge (IA)",
            situacao: "ok",
            detalhe: `${teste.provider} / ${teste.model} respondeu em ${teste.responseTimeMs} ms.`,
          }
        : {
            titulo: "Concierge (IA)",
            situacao: teste.errorCode === "AI_RATE_LIMIT" ? "atencao" : "erro",
            detalhe: `${configIA.provider}: ${teste.errorCode ?? "falha"}.`,
            comoResolver:
              teste.errorCode === "AI_RATE_LIMIT"
                ? "Cota do provedor esgotada. No plano gratuito o limite é por modelo e por dia — " +
                  "com tráfego real, o plano pago é necessário."
                : teste.errorCode === "AI_AUTH_FAILURE"
                ? "Chave inválida ou sem permissão para a API. Gere outra em aistudio.google.com/apikey."
                : "Verifique o log do servidor para o detalhe técnico.",
          }
    );
  }

  // ── Conteúdo publicado ───────────────────────────────────────────────────
  const { count: publicadas } = await supabase
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  verificacoes.push(
    (publicadas ?? 0) > 0
      ? { titulo: "Conteúdo", situacao: "ok", detalhe: `${publicadas} experiência(s) publicada(s).` }
      : {
          titulo: "Conteúdo",
          situacao: "atencao",
          detalhe: "Nenhuma experiência publicada. O Concierge não recomenda nada e encaminha à equipe.",
          comoResolver: "Cadastre experiências e mude o status para 'published'.",
        }
  );

  return {
    ambiente: detectarAmbiente(url),
    url,
    verificacoes,
    tabelas,
    exposicoes,
    variaveisFaltando,
  };
}
