/**
 * Leitura de destinos, países e categorias.
 *
 * Roda no servidor, com a chave pública sob RLS.
 */

import { criarClientePublico } from "@/lib/supabase/server";
import type { Category, DestinationWithCountry } from "@/types/models";

export interface DestinoComContagem extends DestinationWithCountry {
  /** Quantas experiências publicadas apontam para este destino. */
  totalExperiencias: number;
  /**
   * Endereços das fotos, na ordem de exibição. A capa vem primeiro, seguida
   * da galeria. É o que o card alterna.
   */
  fotos: string[];
  /**
   * Créditos das fotos de licença livre, sem repetição.
   *
   * Não é enfeite: CC BY e CC BY-SA EXIGEM atribuição visível. Guardar o
   * crédito no banco e não mostrar na página é violar a licença do mesmo
   * jeito que não ter crédito nenhum.
   */
  creditos: string[];
}

export async function listarDestinos(paisSlug?: string): Promise<DestinoComContagem[]> {
  const supabase = criarClientePublico();

  let query = supabase
    .from("destinations")
    .select("*, country:countries(*)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (paisSlug) {
    const { data: pais } = await supabase.from("countries").select("id").eq("slug", paisSlug).maybeSingle();
    if (!pais) return [];
    query = query.eq("country_id", pais.id);
  }

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[dal] listar destinos:", error.message);
    return [];
  }

  const destinos = data as unknown as DestinationWithCountry[];
  if (destinos.length === 0) return [];

  // Uma consulta só para todas as contagens. Uma por destino seria N+1 e
  // deixaria a página de destinos lenta assim que o catálogo crescesse.
  //
  // Só as de viajante entram: o card diz "2 experiências" e leva ao
  // catálogo, que não mostra as de facilitador. Contar as duas fazia o
  // número prometer mais do que a página seguinte entrega.
  const { data: experiencias } = await supabase
    .from("experiences")
    .select("destination_id")
    .eq("status", "published")
    .eq("audience", "viajante");

  const contagem = new Map<string, number>();
  for (const e of experiencias ?? []) {
    const id = (e as { destination_id: string | null }).destination_id;
    if (id) contagem.set(id, (contagem.get(id) ?? 0) + 1);
  }

  // `gallery` guarda ids de `media`; a URL mora lá. Uma consulta para todas
  // as fotos de todos os destinos, pelo mesmo motivo da contagem acima: uma
  // por destino seria N+1.
  const idsDeMidia = [
    ...new Set(destinos.flatMap((d) => (d.gallery as string[] | null) ?? [])),
  ];

  const porId = new Map<string, { url: string; credito: string }>();
  if (idsDeMidia.length) {
    const { data: midias } = await supabase
      .from("media")
      .select("id, url, caption")
      .in("id", idsDeMidia);
    for (const m of (midias ?? []) as Array<{
      id: string;
      url: string;
      caption: { pt?: string } | null;
    }>) {
      if (m.url) porId.set(m.id, { url: m.url, credito: m.caption?.pt ?? "" });
    }
  }

  return destinos.map((d) => {
    const daGaleria = ((d.gallery as string[] | null) ?? [])
      .map((id) => porId.get(id))
      .filter((x): x is { url: string; credito: string } => Boolean(x));

    // A capa abre a sequência. Set remove a repetição de quando a capa também
    // está na galeria — senão a mesma foto apareceria duas vezes no rodízio.
    const fotos = [
      ...new Set(
        [d.hero_image, ...daGaleria.map((x) => x.url)].filter((u): u is string => Boolean(u))
      ),
    ];

    // Sem repetição: três fotos do mesmo autor renderiam a mesma linha três
    // vezes embaixo do card.
    const creditos = [...new Set(daGaleria.map((x) => x.credito).filter(Boolean))];

    return { ...d, totalExperiencias: contagem.get(d.id) ?? 0, fotos, creditos };
  });
}

export async function buscarDestino(slug: string): Promise<DestinationWithCountry | null> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("destinations")
    .select("*, country:countries(*)")
    .or(`slug->>pt.eq.${slug},slug->>en.eq.${slug},slug->>es.eq.${slug}`)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as DestinationWithCountry;
}

/**
 * O destino com tudo que a página dele mostra: as fotos resolvidas e o
 * crédito de cada uma.
 *
 * `gallery` guarda ids de `media`; a URL e a legenda moram lá. Sem esta
 * segunda consulta a página teria só a capa — que foi como a listagem
 * funcionou até ganharem as três fotos.
 */
export async function buscarDestinoCompleto(slug: string): Promise<
  | (DestinationWithCountry & {
      fotos: Array<{ url: string; credito: string }>;
      creditos: string[];
    })
  | null
> {
  const destino = await buscarDestino(slug);
  if (!destino) return null;

  const supabase = criarClientePublico();
  const ids = (destino.gallery as string[] | null) ?? [];

  const daGaleria: Array<{ url: string; credito: string }> = [];
  if (ids.length) {
    const { data } = await supabase.from("media").select("id, url, caption").in("id", ids);
    // A ordem de `gallery` é a ordem de exibição escolhida no painel; o
    // `in()` devolve na ordem do banco, que é outra.
    const porId = new Map(
      ((data ?? []) as Array<{ id: string; url: string; caption: { pt?: string } | null }>).map(
        (m) => [m.id, { url: m.url, credito: m.caption?.pt ?? "" }]
      )
    );
    for (const id of ids) {
      const m = porId.get(id);
      if (m?.url) daGaleria.push(m);
    }
  }

  const vistas = new Set<string>();
  const fotos: Array<{ url: string; credito: string }> = [];
  for (const f of [
    ...(destino.hero_image ? [{ url: destino.hero_image, credito: "" }] : []),
    ...daGaleria,
  ]) {
    if (vistas.has(f.url)) continue;
    vistas.add(f.url);
    fotos.push(f);
  }

  return {
    ...destino,
    fotos,
    // CC BY e CC BY-SA EXIGEM atribuição visível. Sem repetição: três
    // fotos do mesmo autor renderiam a mesma linha três vezes.
    creditos: [...new Set(daGaleria.map((f) => f.credito).filter(Boolean))],
  };
}

/** Slugs ativos, para as rotas estáticas e o sitemap. */
export async function listarSlugsDeDestinos(): Promise<string[]> {
  const supabase = criarClientePublico();
  const { data, error } = await supabase.from("destinations").select("slug").eq("is_active", true);

  if (error || !data) return [];
  return data
    .map((d) => (d.slug as Record<string, string> | null)?.pt)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

export async function listarCategorias(): Promise<Category[]> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    if (error) console.error("[dal] listar categorias:", error.message);
    return [];
  }
  return data as Category[];
}

export interface CategoriaComFilhas extends Category {
  filhas: Category[];
}

/**
 * As categorias como árvore de dois níveis, que é o que o menu mostra.
 *
 * A migration 017 pôs as sete categorias antigas debaixo de três novas.
 * Quem monta menu ou filtro precisa das três; quem já tem link para uma
 * das sete continua funcionando, porque nenhuma foi apagada.
 */
export async function listarCategoriasEmArvore(): Promise<CategoriaComFilhas[]> {
  const todas = await listarCategorias();

  const raizes = todas.filter((c) => !c.parent_id);
  const porMae = new Map<string, Category[]>();
  for (const c of todas) {
    if (!c.parent_id) continue;
    const irmas = porMae.get(c.parent_id) ?? [];
    irmas.push(c);
    porMae.set(c.parent_id, irmas);
  }

  // Categoria ativa cuja mãe foi desativada ficaria invisível no menu sem
  // deixar rastro. Ela sobe para o primeiro nível em vez de sumir.
  const idsDeRaiz = new Set(raizes.map((c) => c.id));
  const orfas = todas.filter((c) => c.parent_id && !idsDeRaiz.has(c.parent_id));

  return [...raizes, ...orfas].map((mae) => ({
    ...mae,
    filhas: porMae.get(mae.id) ?? [],
  }));
}

/**
 * Os ids que um filtro por categoria deve considerar: o da própria e o das
 * filhas.
 *
 * Sem isso, `?categoria=retiros-imersoes` devolveria só o que estivesse
 * marcado na categoria-mãe — quase nada, já que o conteúdo está nas
 * filhas — e a entrada principal do menu abriria uma página vazia.
 */
export async function idsDaCategoria(slug: string): Promise<string[]> {
  const supabase = criarClientePublico();

  const { data: categoria } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!categoria) return [];

  const { data: filhas } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", categoria.id)
    .eq("is_active", true);

  return [categoria.id, ...(filhas ?? []).map((f) => f.id)];
}
