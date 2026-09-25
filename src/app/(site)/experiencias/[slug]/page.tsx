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
import { migratedExperiences } from "@/content/migratedExperiences";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

interface ConfiguracaoEspelho {
  sourceUrl: string;
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
  const resumo = t(experiencia.short_description as I18nField, "pt");

  return {
    title: titulo,
    description: resumo,
    alternates: { canonical: `/experiencias/${slug}` },
    openGraph: {
      title: titulo,
      description: resumo,
      images: experiencia.hero_image ? [{ url: experiencia.hero_image }] : undefined,
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
    return (
      <ExperienciaEspelhada
        sourceUrl={espelho.sourceUrl}
        titulo={t(experiencia.title as I18nField, "pt")}
      />
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
