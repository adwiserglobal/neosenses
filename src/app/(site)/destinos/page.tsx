/**
 * Destinos.
 *
 * Reorganizada em duas camadas: os destinos com jornada publicada vêm
 * primeiro, em cartões grandes com foto; os que ainda não têm ficam
 * abaixo, num bloco separado e honesto sobre isso.
 *
 * Antes tudo era uma grade só, agrupada por país, e cada cartão levava
 * direto para `/experiencias?destino=slug`. Um destino sem experiência
 * publicada levava a um catálogo vazio — o clique era um beco. Agora cada
 * um tem página própria, com as fotos, o que existe por lá e as jornadas
 * ligadas a ele.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mountain, Image as ImageIcon } from "lucide-react";
import { listarDestinos, type DestinoComContagem } from "@/lib/dal/destinations";
import { Capa, Faixa, TituloDeSecao } from "@/components/templates/blocos";
import { ConviteAoFacilitador } from "@/components/templates/funil";
import { linkWhatsApp, t, podeOtimizar } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export const metadata: Metadata = {
  title: "Destinos",
  description:
    "Peru, Índia, Marrocos, Egito e outros territórios de força para jornadas de autoconhecimento. Conheça cada destino e as experiências que acontecem por lá.",
  alternates: { canonical: "/destinos" },
};

export const revalidate = 3600;

function CartaoDeDestino({ destino, prioridade }: { destino: DestinoComContagem; prioridade: boolean }) {
  const nome = t(destino.name as I18nField, "pt");
  const slug = t(destino.slug as I18nField, "pt");
  const descricao = t(destino.description as I18nField, "pt");
  const pais = destino.country ? t(destino.country.name as I18nField, "pt") : "";
  const capa = destino.fotos[0];

  return (
    <Link
      href={`/destinos/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-secondary-300 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-warm-gray">
        {capa ? (
          <Image
            src={capa}
            alt=""
            aria-hidden="true"
            fill
            priority={prioridade}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={!podeOtimizar(capa)}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-warm-gray">
            <ImageIcon className="h-8 w-8 text-text-muted/25" aria-hidden="true" />
          </div>
        )}

        {/* 90% e não 85%: o selo precisa se sustentar sozinho, porque a foto
            atrás dele pode ser clara — ou não carregar. */}
        {pais && (
          <span className="absolute left-4 top-4 rounded-full bg-primary-700/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-warm-white backdrop-blur-sm">
            {pais}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-xl leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
          {nome}
        </h3>

        {(destino.altitude_m ?? 0) > 1500 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
            <Mountain className="h-3.5 w-3.5" />
            {destino.altitude_m!.toLocaleString("pt-BR")} m de altitude
          </p>
        )}

        {descricao && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-muted">{descricao}</p>
        )}

        <p className="mt-auto pt-5 text-sm font-medium text-secondary-500">
          {destino.totalExperiencias > 0
            ? `${destino.totalExperiencias} ${
                destino.totalExperiencias === 1 ? "jornada" : "jornadas"
              } neste destino →`
            : "Conhecer o destino →"}
        </p>
      </div>
    </Link>
  );
}

export default async function DestinosPage() {
  const destinos = await listarDestinos();

  // Quem já tem jornada publicada abre a página. Um destino sem nada para
  // vender no topo empurra para baixo o que a pessoa veio comprar.
  const comJornada = destinos.filter((d) => d.totalExperiencias > 0);
  const semJornada = destinos.filter((d) => d.totalExperiencias === 0);

  // Nenhum destino do banco tem foto hoje (`hero_image` e `gallery` nulos nos
  // quatro), e sem o último degrau a página abriria com o topo chapado — o
  // mesmo defeito que as outras internas acabaram de perder. O fallback é a
  // rede de segurança, não a escolha: assim que um destino ganhar capa, ela
  // assume.
  const capaDaPagina =
    comJornada[0]?.fotos[0] ?? destinos[0]?.fotos[0] ?? "/images/b2b/amazonas-floresta-aerea.jpg";

  return (
    <>
      <Capa
        chapeu="Onde vamos"
        titulo="Territórios que transformam"
        resumo="Lugares escolhidos pela força do que oferecem a quem chega aberto — e pelo que o grupo consegue viver ali que não viveria em outro lugar."
        imagem={capaDaPagina}
        alinhamento="centro"
      />

      {destinos.length === 0 ? (
        <Faixa fundo="areia" largura="narrow">
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <h2 className="mb-2 font-heading text-xl text-primary-700">
              Ainda não há destinos publicados
            </h2>
            <p className="text-sm text-text-muted">
              Fale com nossa equipe pelo{" "}
              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-500 underline underline-offset-4"
              >
                WhatsApp
              </a>{" "}
              para conhecer as próximas jornadas.
            </p>
          </div>
        </Faixa>
      ) : (
        <>
          {comJornada.length > 0 && (
            <Faixa fundo="areia">
              <TituloDeSecao
                chapeu="Com jornadas abertas"
                titulo="Onde a NeoSenses está agora"
                texto="Cada destino tem a sua página: as fotos, o que se vive por lá e as jornadas ligadas a ele."
              />
              <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {comJornada.map((d, i) => (
                  <CartaoDeDestino key={d.id} destino={d} prioridade={i < 3} />
                ))}
              </div>
            </Faixa>
          )}

          {semJornada.length > 0 && (
            <Faixa fundo="clara">
              <TituloDeSecao
                chapeu="Também no mapa"
                titulo="Territórios sem data publicada"
                texto="A NeoSenses conhece e opera nestes lugares, mas não há jornada com data aberta no momento. Eles entram em roteiros sob medida — inclusive para quem leva o próprio grupo."
              />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {semJornada.map((d) => {
                  const nome = t(d.name as I18nField, "pt");
                  const slug = t(d.slug as I18nField, "pt");
                  const pais = d.country ? t(d.country.name as I18nField, "pt") : "";

                  return (
                    <Link
                      key={d.id}
                      href={`/destinos/${slug}`}
                      className="group flex items-center gap-4 rounded-xl border border-border bg-warm-white p-4 transition-colors hover:border-secondary-300"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-warm-gray">
                        {d.fotos[0] && (
                          <Image
                            src={d.fotos[0]}
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes="64px"
                            unoptimized={!podeOtimizar(d.fotos[0])}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-base text-primary-700 transition-colors group-hover:text-secondary-500">
                          {nome}
                        </h3>
                        {pais && (
                          <p className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin className="h-3 w-3" />
                            {pais}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Faixa>
          )}

          {/* Os créditos de todas as fotos, uma vez só no fim da página.
              CC BY e CC BY-SA exigem atribuição visível; repetir sob cada
              cartão poluía a grade sem cumprir a licença melhor. */}
          {(() => {
            const creditos = [...new Set(destinos.flatMap((d) => d.creditos))];
            if (creditos.length === 0) return null;
            return (
              <div className="container-wide pb-10">
                <p className="text-[11px] leading-relaxed text-text-muted/70">
                  Fotos: {creditos.join(" · ")}
                </p>
              </div>
            );
          })()}
        </>
      )}

      <ConviteAoFacilitador imagem={destinos[1]?.fotos[0] ?? capaDaPagina} />
    </>
  );
}
