/**
 * Catálogo de experiências.
 *
 * Antes era um array fixo no arquivo: seis cards que não abriam nada e seis
 * botões de filtro sem comportamento.
 *
 * Os filtros são links, não botões com JavaScript. Assim cada combinação tem
 * URL própria — compartilhável, indexável e funcional antes de o JS carregar.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { listarExperiencias } from "@/lib/dal/experiences";
import { listarCategorias } from "@/lib/dal/destinations";
import { ExperienceCard } from "@/components/ui/Cards";
import { MarrocosExperienceCard } from "@/components/experiences/MarrocosExperienceCard";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";
import { Capa } from "@/components/templates/base";
import { ConviteAoFacilitador } from "@/components/templates/funil";

export const metadata: Metadata = {
  title: "Experiências Transformadoras",
  description:
    "Retiros, jornadas espirituais, peregrinações e imersões. Encontre a experiência ideal para a sua jornada.",
  alternates: { canonical: "/experiencias" },
};

// Conteúdo publicado muda pelo admin; revalidar de hora em hora evita
// republicar o site a cada edição sem deixar a página desatualizada por dias.
export const revalidate = 3600;

const POR_PAGINA = 12;

interface Props {
  searchParams: Promise<{ categoria?: string; destino?: string; pagina?: string }>;
}

export default async function ExperienciasPage({ searchParams }: Props) {
  const { categoria, destino, pagina } = await searchParams;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const [{ itens, total, temMais }, categorias] = await Promise.all([
    listarExperiencias({ categoria, destino, pagina: paginaAtual, limite: POR_PAGINA }),
    listarCategorias(),
  ]);

  // A landing de Marrocos ainda é independente do CMS principal. Ela aparece
  // só na visão geral, sem interferir em filtros que dependem de category_id e
  // destination_id do Supabase.
  const exibirMarrocos = !categoria && !destino && paginaAtual === 1;
  const totalExibido = total + (exibirMarrocos ? 1 : 0);

  /** Preserva os demais filtros ao montar cada link. */
  const url = (mudanca: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { categoria, destino, ...mudanca };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const query = p.toString();
    return query ? `/experiencias?${query}` : "/experiencias";
  };

  const categoriaAtiva = categorias.find((c) => c.slug === categoria);

  return (
    <>
      <Capa
        chapeu="Descubra seu caminho"
        titulo={
          categoriaAtiva ? t(categoriaAtiva.name as I18nField, "pt") : "Experiências transformadoras"
        }
        resumo="Cada jornada é desenhada para expandir sua consciência e conectar com seu melhor."
        imagem="/images/b2b/peru-humantay.jpg"
        alinhamento="centro"
      />

      {/* Filtros */}
      {categorias.length > 0 && (
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
          {itens.length === 0 && !exibirMarrocos ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-12 text-center">
              <h2 className="mb-2 font-heading text-xl text-primary-700">
                {categoria || destino
                  ? "Nada por aqui com esses filtros"
                  : "Ainda não há experiências publicadas"}
              </h2>
              <p className="text-sm text-text-muted">
                {categoria || destino ? (
                  <>
                    Experimente{" "}
                    <Link href="/experiencias" className="text-secondary-500 underline underline-offset-4">
                      ver todas as experiências
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Estamos preparando as próximas jornadas. Fale com nossa equipe pelo{" "}
                    <a
                      href="https://wa.me/5511947188319"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary-500 underline underline-offset-4"
                    >
                      WhatsApp
                    </a>{" "}
                    para saber das próximas.
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-text-muted">
                {totalExibido} {totalExibido === 1 ? "experiência" : "experiências"}
                {categoriaAtiva ? ` em ${t(categoriaAtiva.name as I18nField, "pt")}` : ""}
              </p>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {exibirMarrocos && <MarrocosExperienceCard index={0} />}
                {itens.map((exp, i) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    index={i + (exibirMarrocos ? 1 : 0)}
                  />
                ))}
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
                  <span className="text-sm text-text-muted">
                    Página {paginaAtual} de {Math.max(1, Math.ceil(total / POR_PAGINA))}
                  </span>
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

      {/* A ponte para o funil de facilitador, no fim da leitura. Quem conduz
          grupo costuma chegar por aqui — pesquisando como cliente e pensando
          como facilitador — e a listagem era a única página de viajante sem
          essa porta. */}
      <ConviteAoFacilitador imagem={itens[0]?.hero_image ?? null} />
    </>
  );
}
