/**
 * Leitura de experiências.
 *
 * Usa a chave pública com RLS: o banco decide o que é visível, não o código.
 * Um rascunho não aparece aqui porque a policy não o entrega — e não porque
 * alguém lembrou de escrever `.eq("status", "published")` em todo lugar.
 *
 * Roda no servidor (Server Components).
 */

import { criarClientePublico } from "@/lib/supabase/server";
import { idsDaCategoria } from "./destinations";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";
import type { ExperienceWithRelations, ExperienceDate } from "@/types/models";

/**
 * Evita que o texto sobre o Peru, presente no card do Egito do site antigo,
 * continue aparecendo caso tenha sido copiado para o cadastro da NeoSenses.
 * Só corrige um campo em português quando ele contém referências inequívocas
 * ao destino errado. Não mexe no título, idiomas adicionais, itinerário,
 * preços, datas nem em páginas importadas como espelho 1:1.
 *
 * Texto resumido a partir da página própria "Jornada Espiritual Egito" da
 * NeoSenses. É proteção na leitura; o conteúdo do CMS ainda deve ser revisado.
 */
function revisarTextoEgito<T extends ExperienceWithRelations>(experiencia: T): T {
  const meta = experiencia.metadata as { render_mode?: string } | null | undefined;
  if (meta?.render_mode === "external_mirror") return experiencia;

  const titulo = t(experiencia.title as I18nField, "pt");
  if (!/egito\\s+espiritual|espiritual\\s+(?:no\\s+)?egito/i.test(titulo)) return experiencia;

  const referenciasDoPeru = /\\bperu\\b|perú|machu\\s+picchu|\\bcusco\\b|\\bcuzco\\b|vale\\s+sagrado|\\bincas?\\b/i;
  const textos: Array<[keyof ExperienceWithRelations, string]> = [
    ["short_description",
      "Uma jornada de autoconhecimento pelo Egito, entre as Pirâmides de Gizé, o Vale dos Reis e os templos de Luxor, unindo história, cultura e experiências de reflexão espiritual."],
    ["description",
      "A Jornada Espiritual Egito é uma viagem de imersão cultural e autoconhecimento. O roteiro percorre lugares como as Pirâmides de Gizé, o Vale dos Reis e os templos de Luxor, combinando o patrimônio histórico egípcio a momentos de contemplação e práticas espirituais."],
    ["why_created",
      "O roteiro foi criado para oferecer uma experiência de autoconhecimento em que a história, a cultura e a espiritualidade do Egito façam parte de uma jornada de reflexão pessoal."],
    ["value_proposition",
      "A proposta reúne visitas a monumentos históricos e experiências de contemplação, meditação e conexão com a cultura e a herança espiritual do Egito."],
  ];

  let corrigida: T = experiencia;
  for (const [campo, conteudo] of textos) {
    const original = experiencia[campo];
    if (!original || !referenciasDoPeru.test(t(original as I18nField, "pt"))) continue;
    corrigida = {
      ...corrigida,
      [campo]: { ...(typeof original === "object" ? original : {}), pt: conteudo },
    };
  }
  return corrigida;
}

/** Colunas da listagem. Buscar `*` traz descrição longa e SEO à toa. */
const CAMPOS_LISTA = `
  id, title, slug, short_description, hero_image, duration_days,
  price_from, price_currency, difficulty, intentions, is_featured, sort_order,
  audience, template,
  category:categories(id, name, slug, icon),
  destination:destinations(id, name, slug, country:countries(id, name, slug))
`;

export interface FiltroExperiencias {
  categoria?: string;
  destino?: string;
  intencao?: string;
  destaque?: boolean;
  limite?: number;
  pagina?: number;
  /**
   * Qual funil. O padrão é `viajante` de propósito: as páginas de
   * facilitador não têm data, não têm vaga e não têm preço, e apareceriam
   * no catálogo como uma jornada "sob consulta" — para quem quer comprar,
   * não para quem quer formar o grupo. Quem precisa das duas passa
   * `"todos"` conscientemente.
   */
  publico?: "viajante" | "facilitador" | "todos";
}

export interface ListaExperiencias {
  itens: ExperienceWithRelations[];
  total: number;
  temMais: boolean;
}

export async function listarExperiencias(
  filtro: FiltroExperiencias = {}
): Promise<ListaExperiencias> {
  const {
    categoria,
    destino,
    intencao,
    destaque,
    limite = 12,
    pagina = 1,
    publico = "viajante",
  } = filtro;
  const inicio = (Math.max(1, pagina) - 1) * limite;

  const supabase = criarClientePublico();

  let query = supabase
    .from("experiences")
    .select(CAMPOS_LISTA, { count: "exact" })
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .range(inicio, inicio + limite - 1);

  if (publico !== "todos") query = query.eq("audience", publico);
  if (destaque) query = query.eq("is_featured", true);

  // Filtro por categoria e destino resolve o id antes. Filtrar por
  // "category.slug" no PostgREST não restringe a lista: afeta só o join e
  // devolve a experiência com a relação nula — era o bug do código anterior.
  //
  // A categoria traz junto as subcategorias dela (017): "Retiros &
  // Imersões" é entrada de menu, e o conteúdo está em Retiros, Imersões e
  // Jornadas Femininas. Filtrar só pelo id da mãe abriria uma página vazia
  // logo na primeira opção do menu.
  if (categoria) {
    const ids = await idsDaCategoria(categoria);
    if (ids.length === 0) return { itens: [], total: 0, temMais: false };
    query = query.in("category_id", ids);
  }

  if (destino) {
    const { data } = await supabase
      .from("destinations")
      .select("id")
      .or(`slug->>pt.eq.${destino},slug->>en.eq.${destino},slug->>es.eq.${destino}`)
      .maybeSingle();
    if (!data) return { itens: [], total: 0, temMais: false };
    query = query.eq("destination_id", data.id);
  }

  if (intencao) query = query.contains("intentions", [intencao]);

  const { data, error, count } = await query;

  if (error) {
    console.error("[dal] listar experiências:", error.message);
    return { itens: [], total: 0, temMais: false };
  }

  const total = count ?? 0;
  return {
    itens: ((data ?? []) as unknown as ExperienceWithRelations[]).map(revisarTextoEgito),
    total,
    temMais: inicio + limite < total,
  };
}

export async function listarDestaques(limite = 3): Promise<ExperienceWithRelations[]> {
  const { itens } = await listarExperiencias({ destaque: true, limite });
  // Sem nenhuma marcada como destaque, mostrar as primeiras é melhor que
  // deixar a home vazia.
  if (itens.length > 0) return itens;
  const { itens: quaisquer } = await listarExperiencias({ limite });
  return quaisquer;
}

/**
 * Busca por slug em qualquer idioma: um link compartilhado em espanhol precisa
 * abrir mesmo para quem navega em português.
 */
export async function buscarExperiencia(slug: string): Promise<ExperienceWithRelations | null> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("experiences")
    .select(
      `*,
       category:categories(*),
       destination:destinations(*, country:countries(*))`
    )
    .or(`slug->>pt.eq.${slug},slug->>en.eq.${slug},slug->>es.eq.${slug}`)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[dal] buscar experiência:", error.message);
    return null;
  }

  const experiencia = revisarTextoEgito(data as unknown as ExperienceWithRelations);
  const hoje = new Date().toISOString().slice(0, 10);

  // Em paralelo: são consultas independentes, e em série a página de detalhe
  // esperaria sete idas ao banco enfileiradas.
  const [datas, roteiro, destaques, inclusoes, perguntas, depoimentos, facilitadores, parceria] =
    await Promise.all([
      supabase
        .from("experience_dates")
        .select("*")
        .eq("experience_id", experiencia.id)
        .eq("status", "published")
        .gte("start_date", hoje)
        .order("start_date"),
      supabase.from("itinerary_days").select("*").eq("experience_id", experiencia.id).order("day_number"),
      supabase.from("experience_highlights").select("*").eq("experience_id", experiencia.id).order("sort_order"),
      supabase.from("experience_inclusions").select("*").eq("experience_id", experiencia.id).order("sort_order"),
      supabase.from("experience_faqs").select("*").eq("experience_id", experiencia.id).order("sort_order"),
      supabase
        .from("testimonials")
        .select("*")
        .eq("experience_id", experiencia.id)
        .eq("status", "published")
        .order("sort_order"),
      supabase
        .from("experience_facilitators")
        .select("sort_order, role, facilitator:facilitators(*)")
        .eq("experience_id", experiencia.id)
        .order("sort_order"),
      supabase
        .from("experience_partnership")
        .select("*")
        .eq("experience_id", experiencia.id)
        .order("sort_order"),
    ]);

  return {
    ...experiencia,
    dates: (datas.data ?? []) as ExperienceDate[],
    itinerary: roteiro.data ?? [],
    highlights: destaques.data ?? [],
    inclusions: inclusoes.data ?? [],
    faqs: perguntas.data ?? [],
    testimonials: depoimentos.data ?? [],
    // O papel vem da tabela de ligação, não do facilitador: a mesma pessoa
    // conduz uma jornada e acompanha outra como guia. Ele entra dentro do
    // objeto para a seção "Quem conduz" poder separar os três blocos que o
    // documento pede — facilitador, guia NeoSenses e guia local.
    facilitators: (facilitadores.data ?? [])
      .map((v) => {
        const linha = v as { role?: string | null; facilitator: unknown };
        if (!linha.facilitator) return null;
        return { ...(linha.facilitator as object), papel: linha.role ?? "facilitator" };
      })
      .filter(Boolean) as ExperienceWithRelations["facilitators"],
    partnership: parceria.data ?? [],
  };
}

/**
 * Jornadas do funil de facilitador, para a página que as reúne.
 *
 * Separada de `listarExperiencias` porque o padrão daquela é o viajante e
 * um `publico: "facilitador"` esquecido devolveria o catálogo errado sem
 * dar erro — é o tipo de troca que ninguém percebe até um terapeuta ver
 * "3 vagas restantes" numa página feita para ele formar o grupo.
 */
export async function listarParaFacilitadores(limite = 24): Promise<ExperienceWithRelations[]> {
  const { itens } = await listarExperiencias({ publico: "facilitador", limite });
  return itens;
}

/** Slugs publicados, para as rotas estáticas e o sitemap. */
export async function listarSlugsDeExperiencias(): Promise<string[]> {
  const supabase = criarClientePublico();
  const { data, error } = await supabase.from("experiences").select("slug").eq("status", "published");

  if (error || !data) return [];
  return data
    .map((e) => (e.slug as Record<string, string> | null)?.pt)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

/** Sugestões para o rodapé da página de detalhe. */
export async function listarRelacionadas(
  experienciaId: string,
  destinoId: string | null,
  limite = 3
): Promise<ExperienceWithRelations[]> {
  const supabase = criarClientePublico();

  // Mesmo destino primeiro; sem resultado, qualquer outra publicada serve —
  // uma seção vazia no fim da página não ajuda ninguém.
  if (destinoId) {
    const { data } = await supabase
      .from("experiences")
      .select(CAMPOS_LISTA)
      .eq("status", "published")
      .eq("destination_id", destinoId)
      .neq("id", experienciaId)
      .limit(limite);

    if (data && data.length > 0) return (data as unknown as ExperienceWithRelations[]).map(revisarTextoEgito);
  }

  const { data: alternativas } = await supabase
    .from("experiences")
    .select(CAMPOS_LISTA)
    .eq("status", "published")
    .neq("id", experienciaId)
    .limit(limite);

  return ((alternativas ?? []) as unknown as ExperienceWithRelations[]).map(revisarTextoEgito);
}
