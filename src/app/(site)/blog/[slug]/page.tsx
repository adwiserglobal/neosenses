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
            </div>
          </div>
        </article>
      </div>

      {relacionados.length > 0 && (
        <section className="relative overflow-hidden border-t border-secondary-300/25 bg-[#f8f4f8] py-20 md:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-primary-100/45 blur-3xl" />
          <div className="container-wide relative">
            <div className="mb-10 text-center md:mb-12">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">
                Continue explorando
              </p>
              <h2 className="font-heading text-3xl text-primary-700 md:text-4xl">
                Artigos recomendados
              </h2>
            </div>

            <ul className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((r) => {
                const rTitulo = t(r.title as I18nField, "pt");
                const rSlug = t(r.slug as I18nField, "pt");
                const rResumo = t(r.excerpt as I18nField, "pt");
                const rCategoria = r.category ? t(r.category.name as I18nField, "pt") : "";

                return (
                  <li key={r.id} className="h-full">
                    <Link
                      href={`/blog/${rSlug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-primary-100/80 bg-surface shadow-[0_10px_32px_rgba(51,14,65,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300/70 hover:shadow-[0_18px_45px_rgba(51,14,65,0.11)]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-primary-700">
                        {r.featured_image ? (
                          <Image
                            src={r.featured_image}
                            alt={rTitulo}
                            fill
                            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 48vw, 100vw"
                            unoptimized={!podeOtimizar(r.featured_image)}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-8 text-center">
                            <span className="font-heading text-xl text-secondary-200">{rTitulo}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.08em] text-secondary-500">
                          {rCategoria && <span>{rCategoria}</span>}
                          {r.published_at && <time dateTime={r.published_at}>{formatDate(r.published_at)}</time>}
                        </div>

                        <h3 className="font-heading text-xl leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
                          {rTitulo}
                        </h3>

                        {rResumo && (
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-muted">
                            {rResumo}
                          </p>
                        )}

                        <span className="mt-auto pt-6 text-sm font-semibold text-secondary-500">
                          Ler artigo →
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-12 flex justify-center">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
              >
                Ver todos os artigos
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
