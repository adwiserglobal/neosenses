/**
 * Leitura do blog.
 *
 * Roda no servidor, com a chave pública sob RLS. Post agendado (published_at
 * no futuro) não aparece: a policy compara com now(), então não depende de o
 * código lembrar de filtrar.
 */

import { criarClientePublico } from "@/lib/supabase/server";
import type { BlogCategory, BlogPostWithRelations } from "@/types/models";

const CAMPOS_LISTA = `
  id, title, slug, excerpt, featured_image, reading_time, published_at, is_featured,
  category:blog_categories(id, name, slug)
`;

export interface ListaPosts {
  itens: BlogPostWithRelations[];
  total: number;
  temMais: boolean;
}

export async function listarPosts(opcoes?: {
  categoria?: string;
  destaque?: boolean;
  limite?: number;
  pagina?: number;
}): Promise<ListaPosts> {
  const { categoria, destaque, limite = 9, pagina = 1 } = opcoes ?? {};
  const inicio = (Math.max(1, pagina) - 1) * limite;

  const supabase = criarClientePublico();

  let query = supabase
    .from("blog_posts")
    .select(CAMPOS_LISTA, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(inicio, inicio + limite - 1);

  if (destaque) query = query.eq("is_featured", true);

  if (categoria) {
    const { data } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", categoria)
      .maybeSingle();
    if (!data) return { itens: [], total: 0, temMais: false };
    query = query.eq("category_id", data.id);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[dal] listar posts:", error.message);
    return { itens: [], total: 0, temMais: false };
  }

  const total = count ?? 0;
  return {
    itens: (data ?? []) as unknown as BlogPostWithRelations[],
    total,
    temMais: inicio + limite < total,
  };
}

export async function buscarPost(slug: string): Promise<BlogPostWithRelations | null> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `*,
       category:blog_categories(*),
       author:profiles(id, full_name, avatar_url)`
    )
    .or(`slug->>pt.eq.${slug},slug->>en.eq.${slug},slug->>es.eq.${slug}`)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[dal] buscar post:", error.message);
    return null;
  }
  return data as unknown as BlogPostWithRelations;
}

export async function listarCategoriasDoBlog(): Promise<BlogCategory[]> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) console.error("[dal] categorias do blog:", error.message);
  return (data ?? []) as BlogCategory[];
}

export async function listarSlugsDePosts(): Promise<string[]> {
  const supabase = criarClientePublico();
  const { data } = await supabase.from("blog_posts").select("slug").eq("status", "published");

  return (data ?? [])
    .map((p) => (p.slug as Record<string, string> | null)?.pt)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

export async function listarPostsRelacionados(
  postId: string,
  categoriaId: string | null,
  limite = 3
): Promise<BlogPostWithRelations[]> {
  const supabase = criarClientePublico();

  if (categoriaId) {
    const { data } = await supabase
      .from("blog_posts")
      .select(CAMPOS_LISTA)
      .eq("status", "published")
      .eq("category_id", categoriaId)
      .neq("id", postId)
      .limit(limite);

    if (data && data.length > 0) return data as unknown as BlogPostWithRelations[];
  }

  const { data: recentes } = await supabase
    .from("blog_posts")
    .select(CAMPOS_LISTA)
    .eq("status", "published")
    .neq("id", postId)
    .order("published_at", { ascending: false })
    .limit(limite);

  return (recentes ?? []) as unknown as BlogPostWithRelations[];
}
