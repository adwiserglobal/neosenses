/**
 * Catálogo de experiências.
 *
 * A visão geral separa por alcance geográfico (Brasil / internacional) e
 * mantém os filtros por categoria. Assim a pessoa entende o catálogo antes
 * de começar a filtrar, sem perder URLs compartilháveis.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { listarExperiencias } from "@/lib/dal/experiences";
import { listarCategorias } from "@/lib/dal/destinations";
import { ExperienceCard } from "@/components/ui/Cards";
import { MarrocosExperienceCard } from "@/components/experiences/MarrocosExperienceCard";
import { MigratedExperienceCard } from "@/components/experiences/MigratedExperience";
import { migratedExperiences } from "@/content/migratedExperiences";
import { t } from "@/lib/utils";
import type { ExperienceWithRelations, I18nField } from "@/types/models";
import { Capa } from "@/components/templates/base";
import { ConviteAoFacilitador } from "@/components/templates/funil";

export const metadata: Metadata = {
  title: "Experiências Transformadoras",
  description:
    "Retiros, jornadas espirituais, peregrinações e imersões no Brasil e no mundo. Encontre a experiência ideal para sua jornada.",
  alternates: { canonical: "/experiencias" },
};

export const revalidate = 3600;

const POR_PAGINA = 60;

type Escopo = "nacional" | "internacional" | "outros";

interface Props {
  searchParams: Promise<{ categoria?: string; destino?: string; pagina?: string }>;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TERMOS_BRASIL = [
  "brasil",
  "brasileiro",
  "brasileira",
  "chapada",
  "veadeiros",
  "amazonia",
  "amazonas",
  "bahia",
  "goias",
  "sao paulo",
  "rio de janeiro",
  "minas gerais",
  "parana",
  "santa catarina",
  "rio grande do sul",
  "pernambuco",
  "ceara",
  "para",
  "maranhao",
  "espirito santo",
  "mato grosso",
  "pantanal",
];

const TERMOS_INTERNACIONAIS = [
  "peru",
  "marrocos",
  "tailandia",
  "india",
  "nepal",
  "butao",
  "egito",
  "mexico",
  "turquia",
  "italia",
  "franca",
  "espanha",
  "portugal",
  "grecia",
  "japao",
  "indonesia",
  "bali",
  "islandia",
  "jordania",
  "israel",
  "tanzania",
  "africa do sul",
  "argentina",
  "chile",
  "bolivia",
  "colombia",
  "equador",
  "costa rica",
];

function escopoDaExperiencia(exp: ExperienceWithRelations): Escopo {
  const destination = exp.destination as
    | {
        name?: unknown;
        country?: { name?: unknown; slug?: string | null } | null;
      }
    | null
    | undefined;

  const paisNome = destination?.country?.name
    ? t(destination.country.name as I18nField, "pt")
    : "";
  const paisSlug = destination?.country?.slug ?? "";
  const titulo = t(exp.title as I18nField, "pt");
  const resumo = t(exp.short_description as I18nField, "pt");
  const alvo = normalizar(`${paisSlug} ${paisNome} ${titulo} ${resumo}`);

  if (TERMOS_BRASIL.some((termo) => alvo.includes(termo))) return "nacional";

  // Se existe um país cadastrado e não é Brasil, já sabemos que é internacional.
  if (paisNome || paisSlug) return "internacional";
  if (TERMOS_INTERNACIONAIS.some((termo) => alvo.includes(termo))) return "internacional";

  return "outros";
}

function TituloDeSecao({
  kicker,
  titulo,
  texto,
  quantidade,
}: {
  kicker: string;
  titulo: string;
  texto: string;
  quantidade: number;
}) {
  return (
    <header className="mb-8 flex flex-col gap-3 border-b border-secondary-300/35 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="chapeu chapeu-com-risco">{kicker}</p>
        <h2 className="mt-3 font-heading text-3xl text-primary-700 md:text-4xl">{titulo}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted md:text-base">{texto}</p>
      </div>
      <span className="w-fit rounded-full border border-secondary-300/50 bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-700">
        {quantidade} {quantidade === 1 ? "experiência" : "experiências"}
      </span>
    </header>
  );
}

export default async function ExperienciasPage({ searchParams }: Props) {
  const { categoria, destino, pagina } = await searchParams;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const [{ itens, total, temMais }, categorias] = await Promise.all([
    listarExperiencias({ categoria, destino, pagina: paginaAtual, limite: POR_PAGINA }),
    listarCategorias(),
  ]);

  // Marrocos e os roteiros migrados ainda não vivem todos no CMS atual.
  // Eles entram apenas na visão geral; filtros representam o catálogo do banco.
  const exibirEstaticas = !categoria && !destino && paginaAtual === 1;
  const slugsMigrados = new Set(migratedExperiences.map((experience) => experience.slug));
  const itensVisiveis = exibirEstaticas
    ? itens.filter((experience) => !slugsMigrados.has(t(experience.slug as I18nField, "pt")))
    : itens;
  const duplicadosRemovidos = itens.length - itensVisiveis.length;
  const totalExibido =
    total + (exibirEstaticas ? 1 + migratedExperiences.length - duplicadosRemovidos : 0);

  /** Preserva os demais filtros ao montar cada link. */
  const url = (mudanca: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { categoria, destino, ...mudanca };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const query = p.toString();
    return query ? `/experiencias?${query}` : "/experiencias";
  };

  const categoriaAtiva = categorias.find((c) => c.slug === categoria);

  const estruturadasNacionais = exibirEstaticas
    ? itensVisiveis.filter((exp) => escopoDaExperiencia(exp) === "nacional")
    : [];
  const estruturadasInternacionais = exibirEstaticas
    ? itensVisiveis.filter((exp) => escopoDaExperiencia(exp) === "internacional")
    : [];
  const estruturadasOutras = exibirEstaticas
    ? itensVisiveis.filter((exp) => escopoDaExperiencia(exp) === "outros")
    : [];

  const migradasNacionais = exibirEstaticas
    ? migratedExperiences.filter((exp) => normalizar(exp.country).includes("brasil"))
    : [];
  const migradasInternacionais = exibirEstaticas
    ? migratedExperiences.filter((exp) => !normalizar(exp.country).includes("brasil"))
    : [];

  const qtdNacionais = migradasNacionais.length + estruturadasNacionais.length;
  const qtdInternacionais = 1 + migradasInternacionais.length + estruturadasInternacionais.length;
  const qtdOutras = estruturadasOutras.length;

  return (
    <>
      <Capa
        chapeu="Descubra seu caminho"
        titulo={
          categoriaAtiva ? t(categoriaAtiva.name as I18nField, "pt") : "Experiências transformadoras"
        }
        resumo="Jornadas no Brasil e no mundo, criadas para ampliar presença, consciência e conexão."
        imagem="/images/b2b/peru-humantay.jpg"
        alinhamento="centro"
      />

      {categorias.length > 0 && (
        <section className="border-b border-secondary-300/25 bg-surface py-6">
          <nav className="container-wide flex flex-wrap items-center gap-3" aria-label="Filtrar por categoria">
            <Link
              href={url({ categoria: undefined, pagina: undefined })}
              aria-current={!categoria ? "page" : undefined}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                !categoria
                  ? "bg-primary-700 text-white shadow-sm"
                  : "border border-border text-text-muted hover:border-secondary-400 hover:text-primary-700"
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
                    ? "bg-primary-700 text-white shadow-sm"
                    : "border border-border text-text-muted hover:border-secondary-400 hover:text-primary-700"
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
          {itensVisiveis.length === 0 && !exibirEstaticas ? (
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
          ) : exibirEstaticas ? (
            <div className="space-y-20 md:space-y-24">
              {qtdNacionais > 0 && (
                <section id="nacionais" className="scroll-mt-28">
                  <TituloDeSecao
                    kicker="Brasil"
                    titulo="Experiências nacionais"
                    texto="Retiros, imersões e jornadas em territórios brasileiros, da natureza profunda aos encontros de reconexão."
                    quantidade={qtdNacionais}
                  />
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {migradasNacionais.map((experience, index) => (
                      <MigratedExperienceCard
                        key={experience.slug}
                        experience={experience}
                        index={index}
                      />
                    ))}
                    {estruturadasNacionais.map((exp, index) => (
                      <ExperienceCard
                        key={exp.id}
                        experience={exp}
                        index={migradasNacionais.length + index}
                      />
                    ))}
                  </div>
                </section>
              )}

              {qtdInternacionais > 0 && (
                <section id="internacionais" className="scroll-mt-28">
                  <TituloDeSecao
                    kicker="Pelo mundo"
                    titulo="Experiências internacionais"
                    texto="Jornadas para outros países e culturas, com roteiros que combinam território, significado e transformação."
                    quantidade={qtdInternacionais}
                  />
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <MarrocosExperienceCard index={0} />
                    {migradasInternacionais.map((experience, index) => (
                      <MigratedExperienceCard
                        key={experience.slug}
                        experience={experience}
                        index={index + 1}
                      />
                    ))}
                    {estruturadasInternacionais.map((exp, index) => (
                      <ExperienceCard
                        key={exp.id}
                        experience={exp}
                        index={migradasInternacionais.length + index + 1}
                      />
                    ))}
                  </div>
                </section>
              )}

              {qtdOutras > 0 && (
                <section id="outras" className="scroll-mt-28">
                  <TituloDeSecao
                    kicker="Novas jornadas"
                    titulo="Outras experiências"
                    texto="Experiências recém-publicadas que ainda não têm um destino geográfico definido no catálogo."
                    quantidade={qtdOutras}
                  />
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {estruturadasOutras.map((exp, index) => (
                      <ExperienceCard key={exp.id} experience={exp} index={index} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-text-muted">
                {totalExibido} {totalExibido === 1 ? "experiência" : "experiências"}
                {categoriaAtiva ? ` em ${t(categoriaAtiva.name as I18nField, "pt")}` : ""}
              </p>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {itensVisiveis.map((exp, i) => (
                  <ExperienceCard key={exp.id} experience={exp} index={i} />
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

      <ConviteAoFacilitador imagem={itensVisiveis[0]?.hero_image ?? migratedExperiences[0]?.hero ?? null} />
    </>
  );
}
