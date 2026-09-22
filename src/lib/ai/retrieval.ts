/**
 * Busca do contexto que fundamenta as respostas do Concierge.
 *
 * O Concierge só pode afirmar o que estiver aqui. Sem este contexto ele
 * responde de cabeça e inventa destino, preço e data — comportamento
 * observado em teste antes deste módulo existir.
 *
 * Duas restrições guiam o desenho:
 *
 *   1. Contexto tem orçamento. Despejar o catálogo inteiro no prompt custa
 *      caro, atrasa a resposta e afoga o que importa no meio do resto.
 *      Aqui entra o que é relevante para a pergunta, com teto de tamanho.
 *
 *   2. Ausência é informação. Quando não há data publicada ou ponto de
 *      encontro cadastrado, o contexto diz isso com todas as letras, para o
 *      modelo encaminhar à equipe em vez de preencher a lacuna sozinho.
 *
 * Roda apenas no servidor.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// O schema é acessado de forma dinâmica; tipar cada select aqui daria mais
// atrito do que segurança. Os tipos gerados são usados na DAL das páginas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = SupabaseClient<any, any, any>;

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface ExperienceContext {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  destination: string;
  country: string;
  duration: string;
  priceFrom: string;
  difficulty: string;
  intentions: string[];
  /** Datas futuras publicadas. Vazio significa "sem data publicada". */
  dates: Array<{ inicio: string; fim: string; vagas: string; pontoDeEncontro: string }>;
  url: string;
  score: number;
}

export interface DestinationContext {
  name: string;
  country: string;
  description: string;
  altitude: number | null;
}

export interface GuideContext {
  topic: string;
  title: string;
  summary: string;
  content: string;
  priority: number;
  forBeginners: boolean;
}

export interface KnowledgeContext {
  experiences: ExperienceContext[];
  destinations: DestinationContext[];
  faqs: Array<{ question: string; answer: string }>;
  guides: GuideContext[];
  companyInfo: string[];
  /** Sinaliza catálogo vazio — muda o tom da resposta. */
  catalogoVazio: boolean;
}

// ── Orçamento de contexto ──────────────────────────────────────────────────
const MAX_EXPERIENCIAS = 6;
/**
 * Teto quando a pergunta pede a lista inteira.
 *
 * Maior que o normal porque responder "quais viagens vocês têm?" com seis de
 * doze é dar meia resposta com cara de resposta completa. Ainda tem teto: o
 * contexto é orçado, e um catálogo de cem experiências não cabe — nesse dia,
 * o Concierge passa a resumir por destino em vez de listar.
 */
const MAX_EXPERIENCIAS_LISTA = 20;
const MAX_DESTINOS = 8;
const MAX_GUIAS = 6;
const MAX_FAQS = 5;
const MAX_DATAS_POR_EXPERIENCIA = 3;
const MAX_CHARS_DESCRICAO = 220;
const MAX_CHARS_GUIA = 700;

// ── Texto multi-idioma ─────────────────────────────────────────────────────
function i18n(campo: unknown, lang: string): string {
  if (!campo) return "";
  if (typeof campo === "string") return campo;
  if (typeof campo === "object") {
    const o = campo as Record<string, string>;
    return o[lang] || o.pt || o.en || Object.values(o).find(Boolean) || "";
  }
  return String(campo);
}

function cortar(texto: string, max: number): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  // Corta em espaço para não terminar no meio da palavra.
  const corte = t.slice(0, max);
  const ultimoEspaco = corte.lastIndexOf(" ");
  return (ultimoEspaco > max * 0.6 ? corte.slice(0, ultimoEspaco) : corte) + "…";
}

/** Minúsculas sem acento — a busca precisa casar "meditacao" com "meditação". */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// ── Intenção da pergunta ───────────────────────────────────────────────────
/**
 * Mapeia a pergunta para tópicos de guia. Uma pergunta sobre bagagem deve
 * trazer as dicas de bagagem, não as oito dicas de convivência em grupo.
 *
 * Léxico simples de propósito: é previsível, custa zero e não depende de uma
 * segunda chamada de modelo antes de responder.
 */
const LEXICO_TOPICOS: Record<string, string[]> = {
  o_que_levar: ["levar", "bagagem", "mala", "roupa", "equipamento", "checklist", "pack", "llevar", "maleta", "empacar"],
  o_que_fazer: ["fazer", "passeio", "atracao", "visitar", "conhecer", "programa", "visit", "hacer"],
  o_que_nao_fazer: ["nao fazer", "evitar", "cuidado", "erro", "proibido", "tabu", "avoid", "evitar"],
  ponto_de_encontro: ["encontro", "encontrar", "ponto", "onde nos encontramos", "embarque", "aeroporto", "chegada", "meeting", "punto"],
  documentos: ["documento", "passaporte", "visto", "visa", "seguro", "consulado", "passport"],
  saude: ["saude", "vacina", "remedio", "medicamento", "altitude", "medico", "alergia", "health", "salud"],
  clima: ["clima", "tempo", "frio", "calor", "chuva", "estacao", "quando ir", "weather"],
  dinheiro: ["dinheiro", "moeda", "cambio", "gorjeta", "cartao", "custo", "pagar", "money", "dinero"],
  conectividade: ["chip", "internet", "wifi", "celular", "tomada", "adaptador", "sinal", "sim"],
  cultura_local: ["cultura", "costume", "etiqueta", "religiao", "templo", "vestimenta", "respeito", "culture"],
  alimentacao: ["comida", "alimenta", "vegetariano", "vegano", "gluten", "restricao", "dieta", "food", "comida"],
  seguranca: ["seguranca", "seguro", "perigo", "roubo", "safety"],
  viagem_em_grupo: ["grupo", "sozinho", "sozinha", "primeira vez", "nunca viajei", "quarto", "dividir", "convivencia", "group", "solo"],
  pratica_espiritual: ["meditacao", "meditar", "cerimonia", "silencio", "yoga", "espiritual", "pratica", "retiro"],
  acessibilidade: ["acessibilidade", "mobilidade", "cadeira de rodas", "dificuldade", "idoso"],
};

function detectarTopicos(pergunta: string): string[] {
  const p = normalizar(pergunta);
  const achados: Array<{ topico: string; peso: number }> = [];

  for (const [topico, termos] of Object.entries(LEXICO_TOPICOS)) {
    let peso = 0;
    for (const termo of termos) {
      if (p.includes(normalizar(termo))) peso += termo.includes(" ") ? 2 : 1;
    }
    if (peso > 0) achados.push({ topico, peso });
  }

  return achados.sort((a, b) => b.peso - a.peso).map((a) => a.topico);
}

/** Primeira viagem em grupo muda o que é útil responder. */
function pareceIniciante(pergunta: string): boolean {
  const p = normalizar(pergunta);
  return [
    "primeira vez", "nunca viajei", "nunca fui", "iniciante", "nao sei como funciona",
    "como funciona", "primeira viagem", "never travel", "first time", "primera vez",
  ].some((t) => p.includes(t));
}

// ── Datas ──────────────────────────────────────────────────────────────────
function formatarData(iso: string, lang: string): string {
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Junta local, horário e instruções num texto só.
 *
 * A versão anterior usava `instrucoes || local`, e o local — que é justamente
 * onde está o nome do aeroporto — sumia sempre que havia instrução cadastrada.
 * Resultado observado em teste: perguntado sobre o encontro no Egito, o
 * Concierge respondia "no desembarque do aeroporto", sem dizer qual.
 */
function montarPontoDeEncontro(ponto: unknown, lang: string): string {
  if (!ponto || typeof ponto !== "object") return "";
  const p = ponto as { local?: string; endereco?: string; horario?: string; instrucoes?: unknown };

  const partes = [p.local, p.endereco, p.horario, i18n(p.instrucoes, lang)]
    .map((t) => (t ?? "").trim())
    .filter(Boolean);

  return partes.join(" · ");
}

function descreverVagas(total: number | null, tomadas: number, lang: string): string {
  if (total === null || total === undefined) {
    return lang === "en" ? "confirm availability" : lang === "es" ? "confirmar disponibilidad" : "confirmar disponibilidade";
  }
  const restantes = Math.max(0, total - (tomadas ?? 0));
  if (restantes === 0) return lang === "en" ? "sold out" : lang === "es" ? "agotado" : "esgotado";
  return lang === "en" ? `${restantes} spots left` : lang === "es" ? `${restantes} plazas` : `${restantes} vagas`;
}

// ── Busca principal ────────────────────────────────────────────────────────
export async function retrieveNeoSensesContext(
  supabase: Supa,
  pergunta: string,
  lang: string,
  sourcePage: string
): Promise<KnowledgeContext> {
  const topicos = detectarTopicos(pergunta);
  const iniciante = pareceIniciante(pergunta);

  // Uma falha isolada não pode derrubar a resposta inteira: sem FAQ o
  // Concierge ainda responde com experiências e guias.
  const [experiences, destinations, faqs, guides, companyInfo] = await Promise.all([
    buscarExperiencias(supabase, pergunta, lang, sourcePage).catch((e) => {
      console.error("[retrieval] experiências:", e?.message ?? e);
      return [] as ExperienceContext[];
    }),
    buscarDestinos(supabase, lang).catch(() => [] as DestinationContext[]),
    buscarFAQs(supabase, lang).catch(() => []),
    buscarGuias(supabase, lang, topicos, iniciante).catch((e) => {
      console.error("[retrieval] guias:", e?.message ?? e);
      return [] as GuideContext[];
    }),
    buscarDocumentos(supabase, lang).catch(() => [] as string[]),
  ]);

  return {
    experiences,
    destinations,
    faqs,
    guides,
    companyInfo,
    catalogoVazio: experiences.length === 0,
  };
}

// ── Experiências ───────────────────────────────────────────────────────────
async function buscarExperiencias(
  supabase: Supa,
  pergunta: string,
  lang: string,
  sourcePage: string
): Promise<ExperienceContext[]> {
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("experiences")
    .select(
      `id, title, slug, short_description, duration_days, price_from, price_currency,
       difficulty, intentions,
       destination:destinations(name, altitude_m, country:countries(name)),
       experience_dates(start_date, end_date, spots_total, spots_taken, meeting_point, status)`
    )
    .eq("status", "published")
    // Só o que o visitante pode comprar. As páginas de facilitador não têm
    // preço, data nem vaga: recomendá-las a quem pergunta "quanto custa e
    // quando sai" devolve uma página que não responde nem uma coisa nem
    // outra. Quem conduz grupo é encaminhado pelo prompt, que sabe da
    // parceria e do endereço dela.
    .eq("audience", "viajante")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(30);

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  // Slug da página em que o visitante está — pergunta feita ali quase sempre
  // é sobre aquela experiência, mesmo sem citá-la pelo nome.
  const slugDaPagina = sourcePage.match(/\/experiencias\/([^/?#]+)/)?.[1];

  const termos = normalizar(pergunta)
    .split(/[\s,.;!?]+/)
    .filter((t) => t.length > 3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapeadas: ExperienceContext[] = data.map((exp: any) => {
    const dest = exp.destination ?? null;
    const slug = i18n(exp.slug, lang);
    const titulo = i18n(exp.title, lang);
    const resumo = i18n(exp.short_description, lang);
    const destino = dest ? i18n(dest.name, lang) : "";
    const pais = dest?.country ? i18n(dest.country.name, lang) : "";

    const datas = (exp.experience_dates ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((d: any) => d.status === "published" && d.start_date >= hoje)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))
      .slice(0, MAX_DATAS_POR_EXPERIENCIA)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((d: any) => ({
        inicio: formatarData(d.start_date, lang),
        fim: formatarData(d.end_date, lang),
        vagas: descreverVagas(d.spots_total, d.spots_taken, lang),
        pontoDeEncontro: montarPontoDeEncontro(d.meeting_point, lang),
      }));

    const alvo = normalizar(`${titulo} ${resumo} ${destino} ${pais} ${(exp.intentions ?? []).join(" ")}`);
    let score = termos.reduce((acc, t) => acc + (alvo.includes(t) ? 1 : 0), 0);
    if (slugDaPagina && slug === slugDaPagina) score += 100;

    return {
      id: exp.id,
      title: titulo,
      slug,
      shortDescription: cortar(resumo, MAX_CHARS_DESCRICAO),
      destination: destino,
      country: pais,
      duration: exp.duration_days ? `${exp.duration_days} dias` : "",
      priceFrom: exp.price_from
        ? `${exp.price_currency === "BRL" ? "R$" : exp.price_currency} ${Number(exp.price_from).toLocaleString("pt-BR")}`
        : "",
      difficulty: exp.difficulty ?? "",
      intentions: exp.intentions ?? [],
      dates: datas,
      url: slug ? `/experiencias/${slug}` : "/experiencias",
      score,
    };
  });

  const ordenadas = mapeadas.sort((a, b) => b.score - a.score);

  // Quem pede a LISTA quer a lista.
  //
  // O filtro por relevância abaixo serve a "quero conhecer o Peru": traz o
  // Peru e cala sobre o resto. Mas aplicado a "quais viagens vocês têm?" ele
  // produzia uma resposta que citava UMA experiência de doze publicadas — a
  // única cujo texto casou por acaso com alguma palavra da pergunta.
  //
  // Para o visitante isso não parece um filtro funcionando: parece uma
  // agência com uma viagem só.
  if (pedeCatalogo(pergunta)) {
    return ordenadas.slice(0, MAX_EXPERIENCIAS_LISTA);
  }

  // Pergunta genérica ("o que vocês oferecem?") não casa com termo nenhum.
  // Nesse caso vale o destaque do catálogo, não uma lista vazia.
  const algumRelevante = ordenadas.some((e) => e.score > 0);
  return (algumRelevante ? ordenadas.filter((e) => e.score > 0) : ordenadas).slice(0, MAX_EXPERIENCIAS);
}

/**
 * A pergunta pede o catálogo inteiro?
 *
 * Deliberadamente estreito: só casa com pedido explícito de lista. Alargar
 * isto faria toda pergunta trazer o catálogo completo, que é o desperdício de
 * contexto que o filtro de relevância existe para evitar.
 */
function pedeCatalogo(pergunta: string): boolean {
  const p = normalizar(pergunta);
  return (
    /\b(todas?|todos)\b/.test(p) &&
    /\b(viagens?|experiencias?|roteiros?|retiros?|jornadas?|opcoes|disponiveis)\b/.test(p)
  ) ||
    /\b(lista|liste|listar)\b/.test(p) ||
    /\bquais\s+(viagens|experiencias|roteiros|retiros|destinos)\b/.test(p) ||
    /\b(catalogo|portfolio)\b/.test(p);
}

// ── Destinos ───────────────────────────────────────────────────────────────
async function buscarDestinos(supabase: Supa, lang: string): Promise<DestinationContext[]> {
  const { data, error } = await supabase
    .from("destinations")
    .select("name, description, altitude_m, country:countries(name)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(MAX_DESTINOS);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((d: any) => ({
    name: i18n(d.name, lang),
    country: d.country ? i18n(d.country.name, lang) : "",
    description: cortar(i18n(d.description, lang), 140),
    altitude: d.altitude_m ?? null,
  }));
}

// ── FAQs ───────────────────────────────────────────────────────────────────
async function buscarFAQs(supabase: Supa, lang: string) {
  const { data, error } = await supabase
    .from("faqs")
    .select("question, answer")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(MAX_FAQS);

  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((f: any) => ({
    question: i18n(f.question, lang),
    answer: cortar(i18n(f.answer, lang), 300),
  }));
}

// ── Guias de viagem ────────────────────────────────────────────────────────
async function buscarGuias(
  supabase: Supa,
  lang: string,
  topicos: string[],
  iniciante: boolean
): Promise<GuideContext[]> {
  let query = supabase
    .from("travel_guides")
    .select("topic, title, summary, content, priority, for_beginners")
    .eq("is_active", true);

  // Sem tópico detectado, o que serve é o essencial (prioridade 1 e 2).
  if (topicos.length > 0) query = query.in("topic", topicos.slice(0, 4));
  else query = query.lte("priority", 2);

  const { data, error } = await query
    .order("priority", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(MAX_GUIAS * 2);

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guias: GuideContext[] = data.map((g: any) => ({
    topic: g.topic,
    title: i18n(g.title, lang),
    summary: i18n(g.summary, lang),
    content: cortar(i18n(g.content, lang), MAX_CHARS_GUIA),
    priority: g.priority,
    forBeginners: g.for_beginners,
  }));

  // Quem já viajou não precisa das dicas de primeira viagem ocupando o
  // contexto; para quem nunca viajou, elas vêm primeiro.
  const ordenadas = iniciante
    ? guias.sort((a, b) => Number(b.forBeginners) - Number(a.forBeginners) || a.priority - b.priority)
    : guias.sort((a, b) => a.priority - b.priority);

  return ordenadas.slice(0, MAX_GUIAS);
}

// ── Documentos institucionais ──────────────────────────────────────────────
async function buscarDocumentos(supabase: Supa, lang: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("ai_knowledge_documents")
    .select("content")
    .eq("language", lang)
    .eq("is_active", true)
    .limit(3);

  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((d: any) => cortar(d.content, 900));
}

// ── Montagem do bloco de contexto ──────────────────────────────────────────
const ROTULOS = {
  pt: {
    sobre: "SOBRE A NEOSENSES",
    experiencias: "EXPERIÊNCIAS PUBLICADAS",
    semExperiencias:
      "NENHUMA EXPERIÊNCIA PUBLICADA NO MOMENTO. Não cite nem sugira nenhuma experiência específica. Convide a pessoa a falar com a equipe.",
    destinos: "DESTINOS",
    datas: "Datas",
    semDatas: "Sem data publicada — a equipe confirma",
    encontro: "Ponto de encontro",
    guias: "ORIENTAÇÕES DE VIAGEM",
    faq: "PERGUNTAS FREQUENTES",
    intencoes: "Indicado para",
  },
  en: {
    sobre: "ABOUT NEOSENSES",
    experiencias: "PUBLISHED EXPERIENCES",
    semExperiencias:
      "NO EXPERIENCES PUBLISHED AT THE MOMENT. Do not mention or suggest any specific experience. Invite the person to talk to the team.",
    destinos: "DESTINATIONS",
    datas: "Dates",
    semDatas: "No published date — the team confirms",
    encontro: "Meeting point",
    guias: "TRAVEL GUIDANCE",
    faq: "FREQUENTLY ASKED QUESTIONS",
    intencoes: "Suited for",
  },
  es: {
    sobre: "SOBRE NEOSENSES",
    experiencias: "EXPERIENCIAS PUBLICADAS",
    semExperiencias:
      "NINGUNA EXPERIENCIA PUBLICADA EN ESTE MOMENTO. No menciones ni sugieras ninguna experiencia específica. Invita a la persona a hablar con el equipo.",
    destinos: "DESTINOS",
    datas: "Fechas",
    semDatas: "Sin fecha publicada — el equipo confirma",
    encontro: "Punto de encuentro",
    guias: "ORIENTACIONES DE VIAJE",
    faq: "PREGUNTAS FRECUENTES",
    intencoes: "Indicado para",
  },
} as const;

export function formatContextForPrompt(ctx: KnowledgeContext, lang: string): string {
  const r = ROTULOS[(lang as keyof typeof ROTULOS) in ROTULOS ? (lang as keyof typeof ROTULOS) : "pt"];
  const blocos: string[] = [];

  if (ctx.companyInfo.length > 0) {
    blocos.push(`${r.sobre}:\n${ctx.companyInfo.join("\n\n")}`);
  }

  if (ctx.experiences.length === 0) {
    blocos.push(r.semExperiencias);
  } else {
    const linhas = ctx.experiences.map((e) => {
      const partes = [`### ${e.title}`];
      const meta: string[] = [];
      if (e.destination) meta.push(`${e.destination}${e.country ? `, ${e.country}` : ""}`);
      if (e.duration) meta.push(e.duration);
      if (e.priceFrom) meta.push(`a partir de ${e.priceFrom}`);
      if (meta.length) partes.push(meta.join(" · "));
      if (e.shortDescription) partes.push(e.shortDescription);
      if (e.intentions.length) partes.push(`${r.intencoes}: ${e.intentions.join(", ")}`);

      if (e.dates.length > 0) {
        const datas = e.dates.map((d) => {
          const base = `${d.inicio} a ${d.fim} (${d.vagas})`;
          return d.pontoDeEncontro ? `${base} — ${r.encontro}: ${d.pontoDeEncontro}` : base;
        });
        partes.push(`${r.datas}: ${datas.join(" | ")}`);
      } else {
        // Dito explicitamente para o modelo não preencher a lacuna sozinho.
        partes.push(`${r.datas}: ${r.semDatas}`);
      }

      partes.push(`URL: ${e.url}`);
      return partes.join("\n");
    });
    blocos.push(`${r.experiencias}:\n\n${linhas.join("\n\n")}`);
  }

  if (ctx.destinations.length > 0) {
    const linhas = ctx.destinations.map((d) => {
      const alt = d.altitude && d.altitude > 2000 ? ` [altitude ${d.altitude} m]` : "";
      return `- ${d.name}${d.country ? ` (${d.country})` : ""}${alt}${d.description ? `: ${d.description}` : ""}`;
    });
    blocos.push(`${r.destinos}:\n${linhas.join("\n")}`);
  }

  if (ctx.guides.length > 0) {
    const linhas = ctx.guides.map((g) => `### ${g.title}\n${g.content || g.summary}`);
    blocos.push(`${r.guias}:\n\n${linhas.join("\n\n")}`);
  }

  if (ctx.faqs.length > 0) {
    const linhas = ctx.faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`);
    blocos.push(`${r.faq}:\n${linhas.join("\n\n")}`);
  }

  return blocos.join("\n\n---\n\n");
}
