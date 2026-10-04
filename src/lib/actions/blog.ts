"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { readingTime, slugify, t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

type ResultadoBlog = { success: boolean; id?: string; slug?: string; error?: string };

function texto(form: FormData, key: string, max: number): string {
  const valor = form.get(key);
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

function textoI18n(atual: unknown, pt: string) {
  return { ...(atual && typeof atual === "object" ? atual as Record<string, unknown> : {}), pt };
}

function validarImagem(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return new URL(value).protocol === "https:"; }
  catch { return false; }
}

export async function salvarArtigoBlog(form: FormData): Promise<ResultadoBlog> {
  const perfil = await exigirPapel(["admin", "editor"]);
  let supabase;
  try { supabase = createAdminClient(); }
  catch { return { success: false, error: "Configure o Supabase do painel." }; }

  const id = texto(form, "id", 40);
  const titulo = texto(form, "title", 180);
  const resumo = texto(form, "excerpt", 500);
  const conteudo = texto(form, "content", 60000);
  const urlCapa = texto(form, "featured_image", 1500);
  const creditoCapa = texto(form, "featured_credit", 300);
  const status = texto(form, "status", 20);
  const categoriaId = texto(form, "category_id", 40) || null;
  const destaque = form.get("is_featured") === "on";

  if (titulo.length < 5) return { success: false, error: "Informe um título com pelo menos 5 caracteres." };
  if (!["draft", "published", "archived"].includes(status)) return { success: false, error: "Situação inválida." };
  if (!validarImagem(urlCapa)) return { success: false, error: "A capa deve ser uma imagem enviada pelo painel ou uma URL HTTPS." };
  if (status === "published" && (resumo.length < 20 || conteudo.length < 150))
    return { success: false, error: "Antes de publicar, preencha o resumo e revise o artigo completo." };

  let anterior: {
    title: unknown; slug: unknown; excerpt: unknown; content: unknown;
    published_at: string | null; author_id: string | null;
  } | null = null;
  if (id) {
    const r = await supabase.from("blog_posts")
      .select("title, slug, excerpt, content, published_at, author_id")
      .eq("id", id).maybeSingle();
    if (r.error || !r.data) return { success: false, error: "Artigo não encontrado." };
    anterior = r.data;
  }

  const slug = slugify(texto(form, "slug", 120) || t(anterior?.slug as I18nField, "pt") || titulo).slice(0, 90);
  if (!slug) return { success: false, error: "Informe um título para criar o endereço do artigo." };
  const consulta = await supabase.from("blog_posts").select("id").eq("slug->>pt", slug).limit(1);
  if (consulta.error) return { success: false, error: "Não foi possível verificar o endereço do artigo." };
  if (consulta.data?.some((artigo) => artigo.id !== id))
    return { success: false, error: "Já existe um artigo com esse endereço. Altere o slug." };

  const registro = {
    title: textoI18n(anterior?.title, titulo),
    slug: textoI18n(anterior?.slug, slug),
    excerpt: textoI18n(anterior?.excerpt, resumo),
    content: textoI18n(anterior?.content, conteudo),
    featured_image: urlCapa || null,
    category_id: categoriaId,
    status: status as "draft" | "published" | "archived",
    is_featured: destaque,
    reading_time: readingTime(conteudo),
    author_id: anterior?.author_id ?? perfil.id,
    published_at: status === "published" ? anterior?.published_at ?? new Date().toISOString() : null,
    seo: { description: resumo, title: titulo },
  };

  const gravar = id
    ? supabase.from("blog_posts").update(registro as never).eq("id", id).select("id").single()
    : supabase.from("blog_posts").insert(registro as never).select("id").single();
  const { data, error } = await gravar;
  if (error || !data) {
    console.error("[blog] salvar artigo:", error?.message);
    return { success: false, error: "Não foi possível salvar o artigo. Confira a conexão com o banco." };
  }

  // Rastro de geração é opcional: a edição não depende da migration 018.
  const geracao = texto(form, "generation", 4000);
  if (geracao) {
    try {
      const info = JSON.parse(geracao) as Record<string, unknown>;
      await supabase.from("blog_posts").update({ generation: info, featured_credit: creditoCapa || null } as never).eq("id", data.id);
    } catch { /* A publicação não depende do histórico opcional. */ }
  } else if (creditoCapa) {
    await supabase.from("blog_posts").update({ featured_credit: creditoCapa }).eq("id", data.id);
  }

  revalidatePath("/blog");
  revalidatePath("/blog/" + slug);
  if (anterior) {
    const antigoSlug = t(anterior.slug as I18nField, "pt");
    if (antigoSlug && antigoSlug !== slug) revalidatePath("/blog/" + antigoSlug);
  }
  revalidatePath("/admin/blog");
  return { success: true, id: data.id, slug };
}

export async function excluirArtigoBlog(id: string): Promise<ResultadoBlog> {
  await exigirPapel(["admin"]);
  const supabase = createAdminClient();
  const { data } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { success: false, error: "Não foi possível excluir este artigo." };
  const slug = t(data?.slug as I18nField, "pt");
  if (slug) revalidatePath("/blog/" + slug);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { success: true };
}
