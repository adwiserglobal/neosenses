/**
 * Página de uma experiência.
 *
 * Esta rota só busca os dados e escolhe o layout — os quatro moram em
 * `components/templates`. Antes o arquivo trazia o layout inteiro escrito
 * à mão, e um segundo layout significaria duplicar 460 linhas.
 *
 * A regra do conteúdo continua a mesma: mostra o que está cadastrado e diz
 * claramente quando algo não está. Datas, roteiro e valores ausentes viram
 * um convite a falar com a equipe, nunca um bloco vazio nem informação
 * inventada. É a mesma regra do Concierge.
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
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listarSlugsDeExperiencias();
  return slugs.map((slug) => ({ slug }));
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

  // Endereço da plataforma de reservas. Vem da configuração, não do código:
  // é o link que fecha a venda, e no dia em que a plataforma mudar ninguém
  // vai procurar por ele dentro de um JSX. Vazio esconde o botão — link
  // morto no caminho da compra é pior que caminho mais curto.
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
      {/* Dados estruturados: é o que faz o buscador exibir data, valor e
          disponibilidade no resultado, em vez de um link seco. Só declara o
          que existe — sem saída publicada, nenhuma oferta é anunciada.

          Nas páginas de facilitador não há oferta a declarar: elas não têm
          preço, data nem vaga. Anunciá-las como produto poria no buscador
          um resultado de compra para uma página que não vende nada. */}
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
