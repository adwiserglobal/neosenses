/**
 * Página de uma experiência do catálogo estruturado.
 *
 * Roteiros legados que ganharam páginas explícitas ficam fora dos params
 * estáticos desta rota para não disputar a mesma URL durante o build.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buscarExperiencia,
  listarSlugsDeExperiencias,
  listarRelacionadas,
} from "@/lib/dal/experiences";
import { listarGuias, lerConfiguracoesPublicas } from "@/lib/dal/content";
import { JsonLd } from "@/components/seo/JsonLd";
import * as schema from "@/lib/seo/dadosEstruturados";
import { PaginaDaExperiencia, montarDados, fotosDaExperiencia } from "@/components/templates";
import { CopiaDaExperiencia } from "@/components/templates/CopiaDaExperiencia";
import { lerCopia, origemDisponivel } from "@/lib/importacao/copia";
import { migratedExperiences } from "@/content/migratedExperiences";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

interface ConfiguracaoEspelho {
  sourceUrl: string;
  copia: ReturnType<typeof lerCopia>;
  plataforma?: string;
}

function lerEspelho(metadata: unknown): ConfiguracaoEspelho | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, unknown>;
  if (meta.render_mode !== "external_mirror") return null;

  const bloco = meta.external_mirror;
  if (!bloco || typeof bloco !== "object") return null;
  const sourceUrl = (bloco as Record<string, unknown>).source_url;
  if (typeof sourceUrl !== "string" || !/^https?:\/\//i.test(sourceUrl)) return null;

  const plataforma = (bloco as Record<string, unknown>).plataforma;
  return {
    sourceUrl,
    copia: lerCopia(bloco),
    plataforma: typeof plataforma === "string" ? plataforma : undefined,
  };
}

function ExperienciaEspelhada({ sourceUrl, titulo }: { sourceUrl: string; titulo: string }) {
  return (
    <div className="fixed inset-0 z-[2147483647] h-[100dvh] w-screen bg-white">
      <iframe
        src={sourceUrl}
        title={titulo || "Experiência"}
        className="block h-[100dvh] w-screen border-0 bg-white"
        allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; payment; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

/** Parágrafos da cópia guardada, para o texto que os buscadores e leitores de tela enxergam. */
function paragrafosDaCopia(copia: ConfiguracaoEspelho["copia"], limite = 24): string[] {
  return (copia?.texto ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30)
    .slice(0, limite);
}

export async function generateStaticParams() {
  const slugs = await listarSlugsDeExperiencias();
  const explicitas = new Set(migratedExperiences.map((experience) => experience.slug));
  return slugs.filter((slug) => !explicitas.has(slug)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const experiencia = await buscarExperiencia(slug);

  if (!experiencia) return { title: "Experiência não encontrada" };

  const titulo = t(experiencia.title as I18nField, "pt");
  const espelhoMeta = lerEspelho(experiencia.metadata);
  // Espelho sem descrição própria: usa o começo do texto guardado, em vez de
  // deixar o Google escolher um trecho qualquer.
  const resumo =
    t(experiencia.short_description as I18nField, "pt") ||
    (espelhoMeta ? (paragrafosDaCopia(espelhoMeta.copia, 1)[0] ?? "").slice(0, 155) : "");
  const imagemSocial = experiencia.hero_image ?? espelhoMeta?.copia?.fotos[0] ?? null;

  return {
    title: titulo,
    description: resumo,
    alternates: { canonical: `/experiencias/${slug}` },
    openGraph: {
      title: titulo,
      description: resumo,
      images: imagemSocial ? [{ url: imagemSocial }] : undefined,
    },
  };
}

export default async function ExperienciaPage({ params }: Props) {
  const { slug } = await params;
  const experiencia = await buscarExperiencia(slug);

  if (!experiencia) notFound();

  // Experiência criada pelo importador 1:1: não passa por nenhum template da
  // NeoSenses. A página externa ocupa o viewport inteiro, inclusive por cima
  // do header/footer do layout pai, preservando o site que a cliente montou.
  const espelho = lerEspelho(experiencia.metadata);
  if (espelho) {
    const titulo = t(experiencia.title as I18nField, "pt");

    // Origem fora do ar (ou que proíbe iframe): a cópia guardada na importação
    // assume sozinha, com o menu e o rodapé da NeoSenses.
    if (!(await origemDisponivel(espelho.sourceUrl))) {
      return (
        <CopiaDaExperiencia
          titulo={titulo}
          resumo={t(experiencia.short_description as I18nField, "pt")}
          capa={experiencia.hero_image}
          copia={espelho.copia}
        />
      );
    }

    // O conteúdo do iframe não conta como da nossa página para o Google. Por
    // isso a página também traz, em HTML real, o título e o texto guardados na
    // importação (os mesmos que o iframe exibe), além dos dados estruturados.
    const textos = paragrafosDaCopia(espelho.copia);

    return (
      <>
        <JsonLd dados={schema.experiencia(experiencia)} />
        <JsonLd
          dados={schema.trilha([
            { nome: "Início", url: "/" },
            { nome: "Experiências", url: "/experiencias" },
            { nome: titulo, url: `/experiencias/${slug}` },
          ])}
        />
        <article className="sr-only">
          <h1>{titulo}</h1>
          {textos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
        <ExperienciaEspelhada sourceUrl={espelho.sourceUrl} titulo={titulo} />
      </>
    );
  }

  const [guias, relacionadas, config] = await Promise.all([
    listarGuias({ destinoId: experiencia.destination_id ?? undefined, limite: 6 }),
    listarRelacionadas(experiencia.id, experiencia.destination_id, 3),
    lerConfiguracoesPublicas(),
  ]);

  const urlReservas =
    typeof config["site.reservas_url"] === "string"
      ? (config["site.reservas_url"] as string).trim()
      : "";
  const rotuloReservas =
    typeof config["site.reservas_rotulo"] === "string"
      ? (config["site.reservas_rotulo"] as string).trim()
      : "Reservar agora";

  const dados = montarDados(experiencia, fotosDaExperiencia(experiencia));

  return (
    <>
      {!dados.ehFacilitador && (
        <>
          <JsonLd dados={schema.experiencia(experiencia)} />
          <JsonLd dados={schema.roteiro(experiencia)} />
        </>
      )}
      <JsonLd dados={schema.perguntasFrequentes(experiencia.faqs ?? [])} />
      <JsonLd
        dados={schema.trilha([
          { nome: "Início", url: "/" },
          dados.ehFacilitador
            ? { nome: "Para facilitadores", url: "/para-facilitadores" }
            : { nome: "Experiências", url: "/experiencias" },
          { nome: dados.titulo, url: `/experiencias/${slug}` },
        ])}
      />

      <PaginaDaExperiencia
        dados={dados}
        experiencia={experiencia}
        guias={guias}
        relacionadas={relacionadas}
        urlReservas={urlReservas}
        rotuloReservas={rotuloReservas}
      />
    </>
  );
}
