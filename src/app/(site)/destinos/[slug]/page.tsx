/**
 * Página de um destino.
 *
 * Não existia: o cartão da listagem levava direto para
 * `/experiencias?destino=slug`, o que transformava um destino sem jornada
 * publicada num catálogo vazio — e desperdiçava tudo que o banco já sabe
 * sobre o lugar (fotos, altitude, clima, guias de viagem).
 *
 * O que a página mostra é o que está cadastrado, e nada além disso. Sem
 * jornada aberta, ela diz isso e oferece os dois caminhos reais: falar com
 * a equipe ou levar o próprio grupo.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mountain, Clock3, CloudSun } from "lucide-react";
import { buscarDestinoCompleto, listarSlugsDeDestinos } from "@/lib/dal/destinations";
import { listarExperiencias } from "@/lib/dal/experiences";
import { listarGuias } from "@/lib/dal/content";
import { ExperienceCard } from "@/components/ui/Cards";
import { Capa, Corpo, Faixa, Perguntas, TituloDeSecao } from "@/components/templates/blocos";
import { ConviteAoFacilitador } from "@/components/templates/funil";
import { JsonLd } from "@/components/seo/JsonLd";
import * as schema from "@/lib/seo/dadosEstruturados";
import { linkWhatsApp, t, podeOtimizar } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listarSlugsDeDestinos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destino = await buscarDestinoCompleto(slug);

  if (!destino) return { title: "Destino não encontrado" };

  const nome = t(destino.name as I18nField, "pt");
  const pais = destino.country ? t(destino.country.name as I18nField, "pt") : "";
  const descricao = t(destino.description as I18nField, "pt");

  return {
    title: pais ? `${nome}, ${pais}` : nome,
    description: descricao || `Conheça ${nome} e as jornadas da NeoSenses neste destino.`,
    alternates: { canonical: `/destinos/${slug}` },
    openGraph: {
      title: nome,
      description: descricao,
      images: destino.fotos[0] ? [{ url: destino.fotos[0].url }] : undefined,
    },
  };
}

export default async function DestinoPage({ params }: Props) {
  const { slug } = await params;
  const destino = await buscarDestinoCompleto(slug);

  if (!destino) notFound();

  const nome = t(destino.name as I18nField, "pt");
  const pais = destino.country ? t(destino.country.name as I18nField, "pt") : "";
  const descricao = t(destino.description as I18nField, "pt");
  const textoLongo = t(destino.long_description as I18nField, "pt");
  const chapeu = t(destino.hero_kicker as I18nField, "pt") || pais || "Destino";

  const [{ itens: jornadas }, guias] = await Promise.all([
    listarExperiencias({ destino: slug, limite: 6 }),
    listarGuias({ destinoId: destino.id, limite: 8 }),
  ]);

  const capa = destino.fotos[0]?.url ?? null;
  const galeria = destino.fotos.slice(1);

  const dados = [
    pais && { icone: MapPin, rotulo: "País", valor: pais },
    destino.altitude_m && {
      icone: Mountain,
      rotulo: "Altitude",
      valor: `${destino.altitude_m.toLocaleString("pt-BR")} m`,
    },
    destino.climate && {
      icone: CloudSun,
      rotulo: "Clima",
      valor: t(destino.climate as I18nField, "pt"),
    },
    destino.timezone && { icone: Clock3, rotulo: "Fuso", valor: destino.timezone },
  ].filter(Boolean) as Array<{
    icone: typeof MapPin;
    rotulo: string;
    valor: string;
  }>;

  return (
    <>
      <JsonLd
        dados={schema.trilha([
          { nome: "Início", url: "/" },
          { nome: "Destinos", url: "/destinos" },
          { nome: nome, url: `/destinos/${slug}` },
        ])}
      />

      <Capa
        chapeu={chapeu}
        titulo={nome}
        resumo={descricao}
        imagem={capa}
        meta={
          dados.length > 0 ? (
            <>
              {dados.map(({ icone: Icone, rotulo, valor }) => (
                <span key={rotulo} className="flex items-center gap-1.5">
                  <Icone className="h-4 w-4" />
                  <span className="sr-only">{rotulo}: </span>
                  {valor}
                </span>
              ))}
            </>
          ) : undefined
        }
        acoes={
          jornadas.length > 0 ? (
            <a href="#jornadas" className="btn-primario">
              {jornadas.length === 1 ? "Ver a jornada" : `Ver as ${jornadas.length} jornadas`}
            </a>
          ) : (
            <a
              href={linkWhatsApp(`Olá! Quero saber sobre jornadas em ${nome}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primario"
            >
              Perguntar sobre {nome}
            </a>
          )
        }
      />

      {textoLongo && (
        <Faixa fundo="areia" largura="content">
          <TituloDeSecao chapeu="O território" titulo={`Sobre ${nome}`} />
          <Corpo texto={textoLongo} className="mt-8" />
        </Faixa>
      )}

      {galeria.length > 0 && (
        <Faixa fundo={textoLongo ? "clara" : "areia"}>
          <TituloDeSecao chapeu="Imagens" titulo={`${nome} de perto`} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galeria.map((foto) => (
              <li key={foto.url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-warm-gray">
                <Image
                  src={foto.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={!podeOtimizar(foto.url)}
                  className="object-cover"
                />
              </li>
            ))}
          </ul>

          {/* CC BY e CC BY-SA exigem atribuição visível: guardar o crédito
              no banco e não mostrar viola a licença igual a não ter
              crédito nenhum. */}
          {destino.creditos.length > 0 && (
            <p className="mt-5 text-[11px] leading-relaxed text-text-muted/70">
              Fotos: {destino.creditos.join(" · ")}
            </p>
          )}
        </Faixa>
      )}

      <Faixa fundo="areia" id="jornadas">
        <TituloDeSecao
          chapeu="Jornadas"
          titulo={
            jornadas.length > 0 ? `O que acontece em ${nome}` : `Ainda não há data aberta em ${nome}`
          }
          texto={
            jornadas.length > 0
              ? undefined
              : "Este destino faz parte da curadoria da NeoSenses, mas não há jornada com data publicada agora. A equipe monta roteiros sob medida para ele — inclusive para quem leva o próprio grupo."
          }
        />

        {jornadas.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {jornadas.map((e, i) => (
              <ExperienceCard key={e.id} experience={e} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={linkWhatsApp(`Olá! Quero saber sobre jornadas em ${nome}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primario"
            >
              Falar com a equipe
            </a>
            <Link href="/experiencias" className="btn-secundario">
              Ver todas as jornadas
            </Link>
          </div>
        )}
      </Faixa>

      {/* Os mesmos guias que o Concierge usa para responder. */}
      {guias.length > 0 && (
        <Faixa fundo="clara" largura="content">
          <TituloDeSecao
            chapeu="Antes de viajar"
            titulo={`O que costuma fazer diferença em ${nome}`}
          />
          <div className="mt-10">
            <Perguntas
              fundo="clara"
              itens={guias.map((g) => ({
                id: g.id,
                pergunta: t(g.title as I18nField, "pt"),
                resposta: t(g.content as I18nField, "pt"),
              }))}
            />
          </div>
        </Faixa>
      )}

      <ConviteAoFacilitador imagem={galeria[0]?.url ?? capa} />
    </>
  );
}
