import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { t, formatDate } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog · Painel", robots: { index: false } };

const situacoes: Record<string, string> = {
  draft: "Rascunho", published: "No ar", archived: "Arquivado",
};

export default async function ListaDeArtigos() {
  let supabase;
  try { supabase = createAdminClient(); }
  catch {
    return <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">Supabase não configurado. Confira as variáveis no Vercel.</p>;
  }
  const { data, error } = await supabase.from("blog_posts")
    .select("id, title, slug, excerpt, status, published_at, updated_at, featured_image")
    .order("updated_at", { ascending: false }).limit(150);
  const artigos = data ?? [];
  if (error) return <p className="rounded-xl bg-red-50 p-6 text-sm text-red-800">Não foi possível carregar o blog: {error.message}</p>;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary-700">Blog</h1>
          <p className="mt-1 text-sm text-text-muted">
            {artigos.length} artigo{artigos.length === 1 ? "" : "s"} · {artigos.filter((p) => p.status === "published").length} no ar
          </p>
        </div>
        <Link href="/admin/blog/novo" className="inline-flex rounded-lg bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800">
          + Criar artigo
        </Link>
      </header>
      <div className="rounded-2xl border border-secondary-300/40 bg-secondary-50/40 p-6">
        <h2 className="font-heading text-xl text-primary-700">Escreva com a redatora de IA</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
          Escolha um assunto, gere um rascunho, adicione suas fotos e revise antes de publicar.
          Todos os artigos recebem a mesma diagramação da NeoSenses.
        </p>
        <Link href="/admin/blog/novo" className="mt-4 inline-block text-sm font-semibold text-secondary-500 underline underline-offset-4">
          Começar novo artigo →
        </Link>
      </div>
      {artigos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-heading text-xl text-primary-700">Nenhum artigo cadastrado</p>
          <p className="mt-2 text-sm text-text-muted">O blog público continuará vazio até você publicar o primeiro artigo.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {artigos.map((post) => {
            const titulo = t(post.title as I18nField, "pt") || "Artigo sem título";
            const slug = t(post.slug as I18nField, "pt");
            return (
              <li key={post.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
                <div className="min-w-0 flex-1">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${post.status === "published"
                    ? "bg-secondary-100 text-secondary-700" : "bg-warm-gray/50 text-text-muted"}`}>
                    {situacoes[post.status] || post.status}
                  </span>
                  <h2 className="mt-2 font-heading text-xl text-primary-700">{titulo}</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    {post.published_at && post.status === "published"
                      ? `Publicado em ${formatDate(post.published_at)}`
                      : `Atualizado em ${formatDate(post.updated_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {post.status === "published" && slug && <Link href={`/blog/${slug}`} target="_blank" className="text-text-muted underline underline-offset-4">Ver no site</Link>}
                  <Link href={`/admin/blog/${post.id}`} className="rounded-lg bg-primary-700 px-5 py-2.5 font-semibold text-white hover:bg-primary-800">
                    Editar
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
