/**
 * Sobre Nós.
 *
 * O conteúdo institucional segue o texto aprovado pela equipe; esta página
 * cuida apenas da apresentação editorial e da hierarquia visual.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Capa, Faixa, TituloDeSecao } from "@/components/templates/blocos";
import { ConviteAoFacilitador } from "@/components/templates/funil";
import { lerConfiguracoesPublicas } from "@/lib/dal/content";
import { linkWhatsApp } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "A NeoSenses cria e opera viagens, retiros e imersões de autoconhecimento — unindo práticas ancestrais e espiritualidade à segurança da operação turística.",
  alternates: { canonical: "/sobre" },
};

export const revalidate = 3600;

const PARAGRAFOS = [
  "Na NeoSenses, acreditamos que viajar é muito mais do que mudar de endereço geográfico: é uma oportunidade de um mergulho interno. Nascemos com a missão de criar e operar viagens, retiros e imersões de autoconhecimento que resgatam nossa verdadeira essência — a Essência do Amor.",
  "Unimos a profundidade de práticas ancestrais, espiritualidade e autodesenvolvimento à excelência e segurança da operação turística. Cada itinerário é desenhado não apenas pelo apelo turístico, mas pelo seu campo energético e poder de transformação.",
  "Seja conduzindo participantes em busca de sentido ou apoiando terapeutas e facilitadores na realização dos seus próprios projetos pelo mundo, a NeoSenses é a ponte entre o visível e o invisível, cuidando de cada detalhe com carinho, responsabilidade e presença.",
];

const VALORES = [
  {
    numero: "01",
    titulo: "Propósito",
    descricao: "Cada viagem tem uma intenção. Viajamos para evoluir, não apenas para conhecer.",
  },
  {
    numero: "02",
    titulo: "Autenticidade",
    descricao:
      "Experiências genuínas com comunidades locais e práticas espirituais verdadeiras.",
  },
  {
    numero: "03",
    titulo: "Excelência",
    descricao: "Do planejamento à execução, cada detalhe é pensado para superar expectativas.",
  },
  {
    numero: "04",
    titulo: "Transformação",
    descricao:
      "Nosso compromisso é que você retorne diferente — mais consciente, mais inteiro.",
  },
];

export default async function SobrePage() {
  const config = await lerConfiguracoesPublicas();
  const cnpj = typeof config["empresa.cnpj"] === "string" ? (config["empresa.cnpj"] as string) : "";

  return (
    <>
      <Capa
        chapeu="Quem somos"
        titulo="A Essência do Amor em Cada Jornada"
        resumo="Conectando pessoas, propósitos e lugares através de experiências que transformam."
        imagem="https://cdn.openart.ai/openart-uploads/production/attachment-transfers/1bf305dfd09276a3f8b502d7546301a49e4f4d8f51d701ab14acbf2da4c23260.png"
        altura="cheia"
        alinhamento="centro"
      />

      <Faixa fundo="areia" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-secondary-100/40 blur-3xl"
        />
        <div className="relative grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-20">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-secondary-400/70" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">
                Sobre nós
              </p>
            </div>

            <div className="relative pl-2 md:pl-5">
              <span
                aria-hidden="true"
                className="absolute -left-2 -top-8 font-heading text-[7.5rem] leading-none text-secondary-300/80 md:-left-4 md:text-[10rem]"
              >
                “
              </span>
              <h2 className="relative max-w-2xl pt-12 font-heading text-4xl leading-[1.12] text-primary-700 md:text-5xl">
                Viajar, para nós, é também um movimento para dentro.
              </h2>
            </div>

            <div className="mt-8 max-w-[66ch] space-y-5 text-[15px] leading-[1.9] text-text-muted md:text-base">
              {PARAGRAFOS.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/experiencias" className="btn-primario">
                Conhecer experiências
              </Link>
              <Link href="/para-facilitadores" className="btn-secundario">
                Para facilitadores
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div
              aria-hidden="true"
              className="absolute -right-5 -top-5 h-full w-full rounded-[38px] border border-secondary-300/60"
            />
            <div className="relative overflow-hidden rounded-[38px] bg-primary-100 shadow-[0_28px_70px_rgba(57,0,75,0.13)]">
              <Image
                src="https://cdn.openart.ai/openart-uploads/production/attachment-transfers/2ac7788ab8babc735a2a31ff8a954ff0b9d12a170490f4c825856126e1d0e813.png"
                alt="Pessoas em meditação diante de uma imagem de Buda"
                width={1200}
                height={1200}
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="aspect-[4/5] w-full object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-5 left-6 rounded-full bg-primary-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-200 shadow-card">
              Presença · propósito · cuidado
            </div>
          </div>
        </div>
      </Faixa>

      <Faixa fundo="clara" className="overflow-hidden">
        <TituloDeSecao
          chapeu="O que nos guia"
          titulo="Valores que atravessam cada jornada"
          texto="Do primeiro desenho do roteiro ao retorno para casa, estes princípios orientam a forma como a NeoSenses cuida de cada experiência."
          fundo="clara"
          centro
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {VALORES.map((valor) => (
            <article
              key={valor.titulo}
              className="group relative overflow-hidden rounded-[22px] border border-primary-100/80 bg-warm-white p-7 shadow-[0_8px_28px_rgba(57,0,75,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300/70 hover:shadow-[0_18px_42px_rgba(57,0,75,0.10)]"
            >
              <span className="text-xs font-semibold tracking-[0.16em] text-secondary-500">
                {valor.numero}
              </span>
              <div className="mt-5 h-px w-10 bg-secondary-300 transition-all duration-300 group-hover:w-16" />
              <h3 className="mt-6 font-heading text-2xl text-primary-700">{valor.titulo}</h3>
              <p className="mt-4 text-sm leading-[1.8] text-text-muted">{valor.descricao}</p>
            </article>
          ))}
        </div>
      </Faixa>

      <section className="relative overflow-hidden py-20 md:py-24">
        <Image
          src="https://cdn.openart.ai/openart-uploads/production/attachment-transfers/6543fe3a334967c84fc11915fc0322e192623354f71776841959cd7d293c3745.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(30,7,39,0.72)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl"
        />
        <div className="container-content relative z-10 text-center">
          <p className="mx-auto mb-4 w-max text-xs font-semibold uppercase tracking-[0.2em] text-secondary-300">
            Entre o visível e o invisível
          </p>
          <h2 className="mx-auto max-w-3xl font-heading text-3xl leading-tight text-warm-white md:text-5xl">
            Cuidamos da jornada para que você possa viver o que realmente importa.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-warm-white/75 md:text-lg">
            Estrutura, operação e presença para transformar um destino em uma experiência com intenção.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link href="/experiencias" className="btn-primario">
              Explorar experiências
            </Link>
            <a
              href={linkWhatsApp("Olá! Vim pela página Sobre Nós e gostaria de conhecer melhor a NeoSenses.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secundario btn-secundario-claro"
            >
              Falar com a equipe
            </a>
          </div>
        </div>
      </section>

      <ConviteAoFacilitador />

      <Faixa fundo="areia" largura="content">
        <div className="mx-auto max-w-2xl text-center">
          <TituloDeSecao chapeu="Onde estamos" titulo="Fale com a NeoSenses" centro />

          <div className="mt-8 space-y-2 text-text-muted">
            <p className="mx-auto text-lg font-medium text-primary-700">NeoSenses</p>
            <p className="mx-auto">Rua Alegre, 928 – Santa Paula</p>
            <p className="mx-auto">São Caetano do Sul – SP, 09550-250</p>
            <p className="mx-auto pt-2">
              <a
                href="mailto:contato@neosenses.com.br"
                className="text-secondary-500 underline underline-offset-4"
              >
                contato@neosenses.com.br
              </a>
            </p>
            <p className="mx-auto">+55 11 94718-8319</p>
            <p className="mx-auto pt-2 text-sm">Segunda a Sábado, 9:00 – 18:00</p>
            {cnpj && <p className="mx-auto pt-2 text-sm">CNPJ {cnpj}</p>}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={linkWhatsApp("Olá! Vim pelo site e gostaria de falar com a NeoSenses.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              Falar no WhatsApp
            </a>
            <Link href="/contato" className="btn-secundario">
              Enviar uma mensagem
            </Link>
          </div>
        </div>
      </Faixa>
    </>
  );
}
