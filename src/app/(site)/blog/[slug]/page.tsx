/**
 * Página de um artigo.
 *
 * Antes, esta rota fabricava o artigo a partir do endereço: capitalizava o
 * slug como título, servia um texto fixo e devolvia 200 para qualquer URL.
 * Um buscador rastreando links inventados encontraria páginas infinitas com
 * conteúdo duplicado, todas assinadas pela NeoSenses.
 *
 * Agora lê do banco e devolve 404 quando o artigo não existe.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarPost, listarSlugsDePosts, listarPostsRelacionados } from "@/lib/dal/blog";
import { t, formatDate } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listarSlugsDePosts();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await buscarPost(slug);

  if (!post) {
    return { title: "Artigo não encontrado", robots: { index: false, follow: false } };
  }

  const titulo = t(post.title as I18nField, "pt");
  const resumo = t(post.excerpt as I18nField, "pt");

  return {
    title: titulo,
    description: resumo,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: titulo,
      description: resumo,
      publishedTime: post.published_at ?? undefined,
      images: post.featured_image ? [{ url: post.featured_image }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await buscarPost(slug);

  if (!post) notFound();

  const titulo = t(post.title as I18nField, "pt");
  const conteudo = t(post.content as I18nField, "pt");
  const resumo = t(post.excerpt as I18nField, "pt");
  const categoria = post.category ? t(post.category.name as I18nField, "pt") : "";

  const relacionados = await listarPostsRelacionados(post.id, post.category_id, 3);

  return (
    <>
      <section className="bg-primary-700 pb-12 pt-32 md:pb-16 md:pt-40">
        <div className="container-content text-center">
          <Link
            href="/blog"
            className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-secondary-300 transition-colors hover:text-secondary-200"
          >
            ← Voltar ao Blog
          </Link>
          <h1 className="mx-auto max-w-3xl font-heading text-3xl text-warm-white md:text-5xl">{titulo}</h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-warm-white/70">
            {categoria && <span>{categoria}</span>}
            {post.published_at && (
              <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            )}
            {post.reading_time && <span>{post.reading_time} min de leitura</span>}
          </div>
        </div>
      </section>

      <article className="py-16 md:py-20">
        <div className="container-content">
          {post.featured_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featured_image}
              alt=""
              className="mb-10 w-full rounded-2xl object-cover"
              style={{ maxHeight: 480 }}
            />
          )}

          {resumo && <p className="mb-8 text-lg leading-relaxed text-text-muted">{resumo}</p>}

          {conteudo ? (
            <div className="whitespace-pre-line leading-relaxed text-text-primary">{conteudo}</div>
          ) : (
            <p className="text-text-muted">Este artigo ainda não tem conteúdo publicado.</p>
          )}
        </div>
      </article>

      {relacionados.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="container-content">
            <h2 className="mb-6 font-heading text-2xl text-primary-700">Leia também</h2>
            <ul className="grid gap-6 md:grid-cols-3">
              {relacionados.map((r) => {
                const rTitulo = t(r.title as I18nField, "pt");
                const rSlug = t(r.slug as I18nField, "pt");
                return (
                  <li key={r.id}>
                    <Link
                      href={`/blog/${rSlug}`}
                      className="block rounded-xl border border-border bg-surface p-5 transition hover:border-secondary-300"
                    >
                      <h3 className="font-heading text-lg text-primary-700">{rTitulo}</h3>
                      {r.published_at && (
                        <p className="mt-1 text-xs text-text-muted">{formatDate(r.published_at)}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
