import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Capa, Faixa } from "@/components/templates/base";
import {
  Corpo,
  EtapasSanfona,
  FaixaFoto,
  Grade,
  TituloDeSecao,
} from "@/components/templates/blocos";
import type { MigratedExperience } from "@/content/migratedExperiences";

function whatsapp(title: string) {
  const text = encodeURIComponent(
    `Olá! Tenho interesse na experiência "${title}". Pode me contar sobre as próximas saídas?`
  );
  return `https://wa.me/5511947188319?text=${text}`;
}

export function MigratedExperiencePage({ experience }: { experience: MigratedExperience }) {
  const whatsappUrl = whatsapp(experience.title);
  const firstPhoto = experience.photos.find((photo) => photo !== experience.hero) ?? experience.hero;

  return (
    <>
      <Capa
        chapeu={experience.kicker}
        titulo={experience.title}
        subtitulo={experience.subtitle}
        resumo={experience.summary}
        imagem={experience.hero}
        altura="cheia"
        meta={
          <>
            <span>{experience.destination}</span>
            <span>{experience.country}</span>
            <span>{experience.period}</span>
          </>
        }
        acoes={
          <>
            {experience.itinerary.length > 0 && (
              <a href="#roteiro" className="btn-primario">
                Ver o dia a dia
              </a>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secundario btn-secundario-claro"
            >
              Consultar disponibilidade
            </a>
          </>
        }
      />

      <Faixa fundo="areia" largura="content" id="sobre">
        <TituloDeSecao chapeu="A jornada" titulo="Sobre esta viagem" />
        <Corpo texto={experience.description} className="mt-8" />
      </Faixa>

      <Faixa fundo="clara" largura="content">
        <TituloDeSecao
          chapeu="Por que criamos"
          titulo="Uma viagem com intenção"
          texto={experience.why}
        />
        <div className="mt-10 rounded-xl border border-secondary-200 bg-secondary-50/50 p-6 md:p-8">
          <p className="font-heading text-xl leading-relaxed text-primary-700 md:text-2xl">
            {experience.value}
          </p>
        </div>
      </Faixa>

      <FaixaFoto imagem={firstPhoto} altura="media" />

      <Faixa fundo="noite" id="destaques">
        <TituloDeSecao
          chapeu="O que você vai viver"
          titulo="Pontos que dão sentido à jornada"
          fundo="noite"
          texto="O conteúdo das páginas antigas foi reorganizado em uma mesma linguagem visual, preservando o que define cada experiência."
        />
        <div className="mt-10">
          <Grade
            fundo="noite"
            colunas={experience.highlights.length <= 4 ? 2 : 3}
            itens={experience.highlights.map((item, index) => ({
              id: `${experience.slug}-highlight-${index}`,
              titulo: item.title,
              descricao: item.description,
            }))}
          />
        </div>
      </Faixa>

      {experience.itinerary.length > 0 && (
        <Faixa fundo="areia" id="roteiro">
          <TituloDeSecao
            chapeu="A jornada"
            titulo="O roteiro, etapa por etapa"
            texto="A sequência abaixo preserva o percurso da experiência original, sem reapresentar datas de edições que já aconteceram."
          />
          <div className="mt-10 max-w-4xl">
            <EtapasSanfona
              itens={experience.itinerary.map((step) => ({
                id: `${experience.slug}-day-${step.day}`,
                numero: step.day,
                titulo: step.title,
                descricao: step.description,
                local: step.location,
                imagem: step.image,
              }))}
            />
          </div>
        </Faixa>
      )}

      <Faixa fundo="clara" largura="content">
        <TituloDeSecao chapeu="Para quem" titulo="Esta jornada pode fazer sentido para você" />
        <Corpo texto={experience.forWhom} className="mt-8" />
      </Faixa>

      {experience.facilitators.length > 0 && (
        <Faixa fundo="areia">
          <TituloDeSecao chapeu="Quem conduz" titulo="Pessoas que acompanham a experiência" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {experience.facilitators.map((facilitator) => (
              <article
                key={facilitator.name}
                className="rounded-xl border border-border bg-surface p-7 md:p-8"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-500">
                  {facilitator.role}
                </p>
                <h3 className="mt-3 font-heading text-2xl text-primary-700">
                  {facilitator.name}
                </h3>
                <p className="mt-4 leading-relaxed text-text-muted">{facilitator.bio}</p>
              </article>
            ))}
          </div>
        </Faixa>
      )}

      {experience.notes && experience.notes.length > 0 && (
        <Faixa fundo="clara" largura="content">
          <TituloDeSecao chapeu="Antes de reservar" titulo="Informações desta nova página" />
          <ul className="mt-8 space-y-3">
            {experience.notes.map((note) => (
              <li
                key={note}
                className="rounded-lg border border-border bg-warm-white px-5 py-4 text-sm leading-relaxed text-text-muted"
              >
                {note}
              </li>
            ))}
          </ul>
        </Faixa>
      )}

      <Faixa fundo="floresta" largura="content">
        <div className="text-center">
          <p className="chapeu chapeu-claro">Próxima saída</p>
          <h2 className="mt-4 font-heading text-3xl text-warm-white md:text-4xl">
            O próximo caminho começa em uma conversa
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-warm-white/75">
            Datas, disponibilidade e condições comerciais são confirmadas pela equipe para cada nova edição.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario mt-8 inline-flex"
          >
            Falar com a NeoSenses
          </a>
        </div>
      </Faixa>
    </>
  );
}

export function MigratedExperienceCard({
  experience,
  index = 0,
}: {
  experience: MigratedExperience;
  index?: number;
}) {
  return (
    <Link
      href={`/experiencias/${experience.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-secondary-300/50 hover:shadow-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-primary-700">
        <Image
          src={experience.hero}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-warm-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-700 backdrop-blur-sm">
          Jornada NeoSenses
        </span>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-1 text-xs text-text-muted">
          <MapPin className="h-3 w-3" />
          {experience.destination}
        </div>
        <h3 className="mb-2 font-heading text-lg leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
          {experience.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-text-muted">
          {experience.summary}
        </p>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm italic text-text-muted">Consulte</span>
          <span className="text-sm font-medium text-secondary-500 transition-transform group-hover:translate-x-1">
            Conhecer →
          </span>
        </div>
      </div>
    </Link>
  );
}
