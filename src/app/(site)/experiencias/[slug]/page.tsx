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
