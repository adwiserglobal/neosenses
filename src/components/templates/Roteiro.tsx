/**
 * Template `roteiro` — B2C para jornada longa.
 *
 * As mesmas oito seções obrigatórias do `classico`, na mesma ordem, com um
 * peso diferente: aqui o dia a dia ocupa a largura inteira e vem cedo,
 * porque numa jornada de nove ou catorze dias é o roteiro que responde à
 * pergunta que decide a compra. No layout de coluna ele ficava espremido
 * entre "o que está incluído" e a barra de reserva.
 *
 * A decisão vem em dois momentos: o botão no topo, para quem já decidiu, e
 * a coluna de reserva depois da leitura, para quem estava avaliando.
 */

import { Capa, Corpo, Faixa, FaixaFoto, TituloDeSecao } from "./blocos";
import { ConviteAoFacilitador } from "./funil";
import { LateralDeReserva } from "./LateralDeReserva";
import { AJornada, ApenasRelaxe, Equipe, PorQueCriamos, PorQueParticipar } from "./esqueleto";
import {
  AntesDeViajar,
  Depoimentos,
  Inclusoes,
  MetaDaCapa,
  Relacionadas,
  type PropsB2C,
} from "./Classico";
import { linkWhatsApp } from "@/lib/utils";

export function Roteiro({
  dados,
  experiencia,
  guias,
  relacionadas,
  urlReservas,
  rotuloReservas,
}: PropsB2C) {
  // A imagem de cada etapa vem do banco quando existe; na falta, as fotos
  // da migração entram a cada três etapas para a lista não virar parede de
  // texto. Só a partir da segunda: a primeira já vem logo abaixo da capa,
  // que é imagem grande.
  const dadosComFotos = {
    ...dados,
    etapas: dados.etapas.map((etapa, i) => ({
      ...etapa,
      imagem: etapa.imagem ?? (i > 0 && i % 3 === 0 ? dados.fotos[Math.floor(i / 3)] ?? null : null),
    })),
  };

  return (
    <>
      {/* Seção 1 */}
      <Capa
        chapeu={dados.chapeu}
        titulo={dados.titulo}
        subtitulo={dados.subtitulo}
        resumo={dados.resumo}
        imagem={dados.capa}
        altura="cheia"
        meta={<MetaDaCapa dados={dados} experiencia={experiencia} />}
        acoes={
          <>
            <a href="#roteiro" className="btn-primario">
              Ver o dia a dia
            </a>
            <a
              href={linkWhatsApp(dados.mensagemWhatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secundario btn-secundario-claro"
            >
              Consultar disponibilidade
            </a>
          </>
        }
      />

      {/* Seções 2 e 4 */}
      {dados.descricao && (
        <Faixa fundo="areia" largura="content" id="sobre">
          <TituloDeSecao chapeu="A jornada" titulo="Sobre esta viagem" />
          <Corpo texto={dados.descricao} className="mt-8" />
        </Faixa>
      )}

      {/* Seção 3 */}
      <PorQueCriamos dados={dados} fundo="clara" />

      <FaixaFoto imagem={dados.fotos[0]} altura="media" />

      {/* Seção 5 */}
      <PorQueParticipar dados={dados} fundo="noite" />

      {/* Seção 6 — o eixo deste layout */}
      <AJornada dados={dadosComFotos} fundo="areia" />

      {/* Seção 7 */}
      <ApenasRelaxe dados={dados} fundo="clara" />

      {/* Seção 8 */}
      <Equipe dados={dados} fundo="areia" />

      <div className="container-wide py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            {dados.paraQuem && (
              <section className="rounded-xl border border-secondary-200 bg-secondary-50/50 p-6">
                <h2 className="mb-3 font-heading text-2xl text-primary-700">
                  Para quem é esta jornada
                </h2>
                <Corpo texto={dados.paraQuem} />
              </section>
            )}

            <Inclusoes experiencia={experiencia} />
            <AntesDeViajar guias={guias} />
            <Depoimentos experiencia={experiencia} />
          </div>

          <aside className="lg:col-span-1">
            <LateralDeReserva
              experiencia={experiencia}
              titulo={dados.titulo}
              urlReservas={urlReservas}
              rotuloReservas={rotuloReservas}
              mensagemWhatsApp={dados.mensagemWhatsApp}
            />
          </aside>
        </div>
      </div>

      <Relacionadas itens={relacionadas} />

      <ConviteAoFacilitador imagem={dados.fotos[2] ?? dados.capa} />
    </>
  );
}
