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
import Image from "next/image";
import { CorpoArtigo } from "@/components/blog/CorpoArtigo";
import { podeOtimizar } from "@/lib/utils";
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
      <div className="bg-warm-white">
        <section className="relative overflow-hidden border-b border-secondary-300/20 bg-[#f7f1f7] pb-14 pt-32 md:pb-16 md:pt-40">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
          <div className="container-content relative">
            <Link href="/blog" className="mb-9 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-500 transition-colors hover:text-primary-700">
              ← Voltar ao blog
            </Link>
            {categoria && <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">{categoria}</p>}
            <h1 className="max-w-4xl font-heading text-4xl leading-[1.13] text-primary-700 md:text-6xl">{titulo}</h1>
            {resumo && <p className="mt-7 max-w-3xl text-lg leading-relaxed text-text-muted md:text-xl">{resumo}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
              {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
              {post.reading_time && <span>{post.reading_time} min de leitura</span>}
              {post.author?.full_name && <span>Por {post.author.full_name}</span>}
            </div>
          </div>
        </section>

        <article className="pb-20 pt-10 md:pb-28 md:pt-14">
          <div className="container-content">
            {post.featured_image && (
              <figure className="mb-12 md:mb-16">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] bg-warm-gray">
                  <Image
                    src={post.featured_image}
                    alt={titulo}
                    fill
                    priority
                    sizes="(min-width: 1024px) 960px, 100vw"
                    unoptimized={!podeOtimizar(post.featured_image)}
                    className="object-cover"
                  />
                </div>
                {post.featured_credit && <figcaption className="mt-3 text-right text-xs text-text-muted">{post.featured_credit}</figcaption>}
              </figure>
            )}
            <div className="mx-auto max-w-[780px]">
              {conteudo ? (
                <CorpoArtigo conteudo={conteudo} />
              ) : (
                <p className="text-text-muted">Este artigo ainda não tem conteúdo publicado.</p>
              )}
              <div className="mt-16 border-t border-secondary-300/35 pt-6">
                <Link href="/blog" className="text-sm font-semibold text-secondary-500 hover:text-primary-700">← Explorar outros artigos</Link>
              </div>
            </div>
          </div>
        </article>
      </div>

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
