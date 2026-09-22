/**
 * Template `classico` — B2C, o padrão.
 *
 * Segue as oito seções obrigatórias do documento de reformulação (passo 5),
 * na ordem, com a coluna de reserva fixa ao lado do miolo. Serve à jornada
 * curta: um retiro de fim de semana não tem dia a dia longo para carregar
 * a página inteira.
 *
 * A diferença para o `roteiro` não é de conteúdo — as duas mostram as
 * mesmas oito seções, que moram em `esqueleto.tsx`. É de peso: aqui o
 * miolo é uma coluna com a reserva ao lado o tempo todo; lá a jornada
 * ocupa a largura toda e a reserva vem depois da leitura.
 */

import { MapPin, Clock, Users, Mountain, Check, X } from "lucide-react";
import { ExperienceCard } from "@/components/ui/Cards";
import { Capa, Corpo, Faixa, FaixaFoto, Perguntas, TituloDeSecao } from "./blocos";
import { ConviteAoFacilitador } from "./funil";
import { LateralDeReserva } from "./LateralDeReserva";
import { AJornada, ApenasRelaxe, Equipe, PorQueParticipar } from "./esqueleto";
import { t } from "@/lib/utils";
import type { ExperienceWithRelations, I18nField, TravelGuide } from "@/types/models";
import type { DadosDaPagina } from "./dados";

const DIFICULDADE: Record<string, string> = {
  beginner: "Leve",
  intermediate: "Moderada",
  advanced: "Exigente",
  all_levels: "Todos os níveis",
};

export interface PropsB2C {
  dados: DadosDaPagina;
  experiencia: ExperienceWithRelations;
  guias: TravelGuide[];
  relacionadas: ExperienceWithRelations[];
  urlReservas: string;
  rotuloReservas: string;
}

/** Os dados do topo: local, duração, tamanho do grupo e exigência física. */
export function MetaDaCapa({
  dados,
  experiencia,
}: {
  dados: DadosDaPagina;
  experiencia: ExperienceWithRelations;
}) {
  return (
    <>
      {dados.periodo && (
        <span className="flex items-center gap-1.5 font-medium text-secondary-300">
          {dados.periodo}
        </span>
      )}
      {dados.destino && (
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {dados.destino}
          {dados.pais ? `, ${dados.pais}` : ""}
        </span>
      )}
      {experiencia.duration_days && (
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {experiencia.duration_days} dias
        </span>
      )}
      {experiencia.group_size_max && (
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          até {experiencia.group_size_max} pessoas
        </span>
      )}
      {experiencia.difficulty && (
        <span className="flex items-center gap-1.5">
          <Mountain className="h-4 w-4" />
          {DIFICULDADE[experiencia.difficulty] ?? experiencia.difficulty}
        </span>
      )}
    </>
  );
}

/** O que está incluído e o que não está. Compartilhado com o `roteiro`. */
export function Inclusoes({ experiencia }: { experiencia: ExperienceWithRelations }) {
  const incluido = (experiencia.inclusions ?? []).filter((i) => i.is_included);
  const naoIncluido = (experiencia.inclusions ?? []).filter((i) => !i.is_included);
  if (incluido.length === 0 && naoIncluido.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-2xl text-primary-700">O que está incluído</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {incluido.length > 0 && (
          <ul className="space-y-2">
            {incluido.map((i) => (
              <li key={i.id} className="flex gap-2 text-sm text-text-primary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>{t(i.text as I18nField, "pt")}</span>
              </li>
            ))}
          </ul>
        )}
        {naoIncluido.length > 0 && (
          <ul className="space-y-2">
            {naoIncluido.map((i) => (
              <li key={i.id} className="flex gap-2 text-sm text-text-muted">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-text-muted/50" aria-hidden="true" />
                <span>{t(i.text as I18nField, "pt")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Guias do destino: o mesmo conteúdo que o Concierge usa para responder. */
export function AntesDeViajar({ guias }: { guias: TravelGuide[] }) {
  if (guias.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 font-heading text-2xl text-primary-700">Antes de viajar</h2>
      <p className="mb-4 text-sm text-text-muted">
        O que costuma fazer diferença para quem vai nesta jornada.
      </p>
      <Perguntas
        itens={guias.map((g) => ({
          id: g.id,
          pergunta: t(g.title as I18nField, "pt"),
          resposta: t(g.content as I18nField, "pt"),
        }))}
      />
    </section>
  );
}

export function Depoimentos({ experiencia }: { experiencia: ExperienceWithRelations }) {
  const itens = experiencia.testimonials ?? [];
  if (itens.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-2xl text-primary-700">Quem já foi</h2>
      <ul className="space-y-4">
        {itens.map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-warm-gray/30 p-5">
            <blockquote className="font-heading text-lg italic leading-snug text-primary-700">
              “{t(d.quote as I18nField, "pt")}”
            </blockquote>
            <p className="mt-3 text-sm text-text-muted">
              {d.name}
              {d.location ? ` · ${d.location}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Relacionadas({ itens }: { itens: ExperienceWithRelations[] }) {
  if (itens.length === 0) return null;
  return (
    <Faixa fundo="clara">
      <TituloDeSecao chapeu="Continue explorando" titulo="Outras jornadas" />
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {itens.map((e, i) => (
          <ExperienceCard key={e.id} experience={e} index={i} />
        ))}
      </div>
    </Faixa>
  );
}

export function Classico({
  dados,
  experiencia,
  guias,
  relacionadas,
  urlReservas,
  rotuloReservas,
}: PropsB2C) {
  return (
    <>
      {/* Seção 1 — título, subtítulo e período */}
      <Capa
        chapeu={dados.chapeu}
        titulo={dados.titulo}
        subtitulo={dados.subtitulo}
        resumo={dados.resumo}
        imagem={dados.capa}
        meta={<MetaDaCapa dados={dados} experiencia={experiencia} />}
      />

      <div className="container-wide py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            {/* Seções 2 e 4 — a introdução e o aprofundamento */}
            {dados.descricao && (
              <section id="sobre">
                <h2 className="mb-4 font-heading text-2xl text-primary-700">Sobre a jornada</h2>
                <Corpo texto={dados.descricao} />
              </section>
            )}

            {/* Seção 3 */}
            {dados.porQueCriamos && (
              <section className="rounded-xl border border-border bg-warm-gray/25 p-6">
                <h2 className="mb-3 font-heading text-2xl text-primary-700">
                  Por que criamos esta jornada
                </h2>
                <Corpo texto={dados.porQueCriamos} />
              </section>
            )}

            {/* "Para quem é" — numa compra de vinte mil para viajar com
                desconhecidos, dizer para quem NÃO é evita frustração e
                vende mais que outra foto. */}
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

      {/* Seção 5 */}
      <PorQueParticipar dados={dados} fundo="noite" />

      <FaixaFoto imagem={dados.fotos[0]} altura="baixa" />

      {/* Seção 6 */}
      <AJornada dados={dados} fundo="areia" />

      {/* Seção 7 */}
      <ApenasRelaxe dados={dados} fundo="clara" />

      {/* Seção 8 */}
      <Equipe dados={dados} fundo="areia" />

      <Relacionadas itens={relacionadas} />

      <ConviteAoFacilitador imagem={dados.fotos[1] ?? dados.capa} />
    </>
  );
}
