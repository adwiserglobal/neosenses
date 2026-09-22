/**
 * Blog.
 *
 * Antes era uma lista fixa de seis títulos que não abriam nada. Agora lê do
 * banco — e, enquanto não houver post publicado, diz isso em vez de exibir
 * artigos que não existem.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SurgeEmCascata } from "@/components/ui/Surge";
import { listarPosts, listarCategoriasDoBlog } from "@/lib/dal/blog";
import { t, formatDate, podeOtimizar } from "@/lib/utils";
import type { I18nField } from "@/types/models";
import { Capa } from "@/components/templates/base";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos sobre espiritualidade, autoconhecimento, destinos e viagens transformadoras.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ categoria?: string; pagina?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { categoria, pagina } = await searchParams;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const [{ itens, total, temMais }, categorias] = await Promise.all([
    listarPosts({ categoria, pagina: paginaAtual }),
    listarCategoriasDoBlog(),
  ]);

  const url = (mudanca: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ categoria, ...mudanca })) if (v) p.set(k, v);
    const q = p.toString();
    return q ? `/blog?${q}` : "/blog";
  };

  return (
    <>
      <Capa
        chapeu="Inspiração"
        titulo="Blog"
        resumo="Reflexões sobre espiritualidade, destinos e o que se aprende no caminho."
        imagem="/images/b2b/amazonas-hero-lago.jpg"
        alinhamento="centro"
      />

      {categorias.length > 0 && itens.length > 0 && (
        <section className="border-b border-border bg-surface py-6">
          <nav className="container-wide flex flex-wrap items-center gap-3" aria-label="Filtrar por categoria">
            <Link
              href={url({ categoria: undefined, pagina: undefined })}
              aria-current={!categoria ? "page" : undefined}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                !categoria
                  ? "bg-primary-700 text-white"
                  : "border border-border text-text-muted hover:border-secondary-500 hover:text-secondary-500"
              }`}
            >
              Todos
            </Link>
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={url({ categoria: c.slug, pagina: undefined })}
                aria-current={categoria === c.slug ? "page" : undefined}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  categoria === c.slug
                    ? "bg-primary-700 text-white"
                    : "border border-border text-text-muted hover:border-secondary-500 hover:text-secondary-500"
                }`}
              >
                {t(c.name as I18nField, "pt")}
              </Link>
            ))}
          </nav>
        </section>
      )}

      <section className="py-16 md:py-24">
        <div className="container-wide">
          {itens.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-12 text-center">
              <h2 className="mb-2 font-heading text-xl text-primary-700">
                {categoria ? "Nada nesta categoria ainda" : "Os primeiros artigos estão a caminho"}
              </h2>
              <p className="text-sm text-text-muted">
                Enquanto isso, conheça as{" "}
                <Link href="/experiencias" className="text-secondary-500 underline underline-offset-4">
                  experiências abertas
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-text-muted">
                {total} {total === 1 ? "artigo" : "artigos"}
              </p>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {itens.map((post, i) => {
                  const titulo = t(post.title as I18nField, "pt");
                  const slug = t(post.slug as I18nField, "pt");
                  const resumo = t(post.excerpt as I18nField, "pt");

                  return (
                    <SurgeEmCascata key={post.id} indice={i} className="h-full">
                    <Link
                      href={`/blog/${slug}`}
                      className="group block h-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary-300/50 hover:shadow-card"
                    >
                      <div className="relative aspect-[3/2] overflow-hidden bg-warm-gray">
                        {post.featured_image ? (
                          <Image
                            src={post.featured_image}
                            alt={titulo}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            unoptimized={!podeOtimizar(post.featured_image)}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          /* Mesmo tratamento do cartão de experiência: sem
                             foto, o bloco assume a falta em vez de mostrar
                             um ícone de imagem quebrada. */
                          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-primary-700">
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 bg-gradient-to-br from-forest-700/60 via-transparent to-primary-800"
                            />
                            <span className="relative px-6 text-center font-heading text-base leading-snug text-secondary-300/75">
                              {titulo}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          {post.category && <span>{t(post.category.name as I18nField, "pt")}</span>}
                          {post.published_at && <span>{formatDate(post.published_at)}</span>}
                          {post.reading_time && <span>{post.reading_time} min</span>}
                        </div>
                        <h2 className="font-heading text-lg leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
                          {titulo}
                        </h2>
                        {resumo && (
                          <p className="mt-2 line-clamp-3 text-sm text-text-muted">{resumo}</p>
                        )}
                      </div>
                    </Link>
                    </SurgeEmCascata>
                  );
                })}
              </div>

              {(temMais || paginaAtual > 1) && (
                <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Paginação">
                  {paginaAtual > 1 && (
                    <Link
                      href={url({ pagina: String(paginaAtual - 1) })}
                      className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-muted transition hover:border-secondary-500 hover:text-secondary-500"
                    >
                      ← Anterior
                    </Link>
                  )}
                  {temMais && (
                    <Link
                      href={url({ pagina: String(paginaAtual + 1) })}
                      className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-muted transition hover:border-secondary-500 hover:text-secondary-500"
                    >
                      Próxima →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
