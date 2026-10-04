"use client";

/**
 * Capa e pilares da home.
 *
 * Separado da página porque usa framer-motion e precisa rodar no navegador.
 * A página em si virou Server Component para conseguir ler o catálogo — um
 * componente "use client" não consegue buscar dados no servidor.
 */

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const suave = [0.25, 0.46, 0.45, 0.94] as const;
const transicao = { duration: 0.6, ease: suave as unknown as [number, number, number, number] };

const surgir = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: transicao,
};

/**
 * Os quatro pilares, com os textos do documento de reformulação (passo 2.2).
 *
 * O primeiro card mudou de nome: era "Viajar com Propósito" e o documento
 * pede "Jornadas de Alma" — é o termo que a equipe escolheu para nomear o
 * que a NeoSenses vende, e não é sinônimo do que estava aqui.
 */
const PILARES = [
  {
    titulo: "Jornadas de Alma",
    descricao: "Intenção e aprendizados com experiências profundas para transformar a sua vida.",
    imagem: "/images/home/proposito-floresta.webp",
    alt: "Vivência de conexão interior em meio à natureza",
  },
  {
    titulo: "Autoconhecimento",
    descricao: "Avançar cada dia mais em sua jornada interior e evoluir continuamente como pessoa.",
    imagem: "/images/b2b/peru-lagoa-sagrada.jpg",
    alt: "Paisagem natural de uma jornada de autoconhecimento no Peru",
  },
  {
    titulo: "Roteiros e Vivências",
    descricao: "Caminhos e itinerários desenhados para você viver grandes transformações.",
    imagem: "/images/b2b/peru-machu-picchu.jpg",
    alt: "Roteiro de viagem por Machu Picchu",
  },
  {
    titulo: "Conexão",
    descricao: "Harmonia com a natureza e com pessoas que vibram na mesma energia e intenções.",
    imagem: "/images/b2b/amazonas-comunidade.jpg",
    alt: "Convívio e conexão humana em comunidade na Amazônia",
  },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/homepage.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* A capa volta ao tratamento anterior, neutro/azulado. A paleta roxa
          continua no restante da marca, mas não colore a fotografia. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#16232b]/70 via-[#16232b]/50 to-[#16232b]/80" />

      <div className="container-wide relative z-10 flex flex-col items-center py-32 text-center">
        <motion.p
          {...surgir}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-300"
        >
          Experiências Transformadoras de Viagem
        </motion.p>

        <motion.h1
          {...surgir}
          transition={{ ...transicao, delay: 0.1 }}
          className="mb-8 max-w-4xl font-heading text-5xl font-normal leading-[1.05] text-warm-white md:text-7xl"
        >
          Um Novo <span className="italic text-[#f0ca61]">Sentir</span>
        </motion.h1>

        <motion.p
          {...surgir}
          transition={{ ...transicao, delay: 0.2 }}
          className="mb-12 max-w-2xl text-lg leading-relaxed text-warm-white/80 md:text-xl"
        >
          Jornadas e retiros transformadores, experiências que elevam sua vibração e
          conectam com seu melhor.
        </motion.p>

        <motion.div
          {...surgir}
          transition={{ ...transicao, delay: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          {/* Os dois botões do documento (passo 2.1). O segundo era "Conheça
              a NeoSenses" e virou a porta do outro funil: quem conduz grupo
              chega pela home como qualquer visitante, e sem esta saída lia
              a página inteira achando que o site só vende vaga avulsa. */}
          <Link href="/experiencias" className="btn-primario px-8 py-4">
            Explorar Experiências
          </Link>
          <Link
            href="/para-facilitadores"
            className="btn-secundario btn-secundario-claro px-8 py-4"
          >
            Para Facilitadores
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-12 animate-float"
        >
          <div className="flex flex-col items-center gap-2 text-warm-white/50">
            <span className="text-xs uppercase tracking-widest">Descubra</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-60" aria-hidden="true">
              <path
                d="M10 4v12M10 16l-4-4M10 16l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** A proposta da marca: uma história à esquerda, fotografia orgânica à direita. */
export function Pilares() {
  return (
    <section id="nosso-proposito" className="relative overflow-hidden bg-warm-white py-24 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 top-20 h-96 w-96 rounded-full bg-secondary-200/15 blur-[90px]" />
      <div className="container-wide relative">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.07fr)_minmax(0,0.93fr)] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.23em] text-secondary-500">
              A essência da NeoSenses
            </p>
            <h2 className="max-w-xl font-heading text-4xl leading-[1.1] text-primary-700 md:text-5xl lg:text-[3.6rem]">
              Nosso <span className="italic text-secondary-500">Propósito</span>
            </h2>
            <div className="mt-8 h-px w-20 bg-secondary-300" aria-hidden="true" />
            <div className="mt-8 max-w-[64ch] space-y-5 text-[15px] leading-[1.85] text-text-muted md:text-base">
              <p>
                Nossa proposta de valor é realizar experiências de viagem a lugares que tragam a você
                um novo sentir, em jornadas que elevem sua vibração e conectem com seu melhor.
              </p>
              <p>
                Criamos roteiros espirituais que proporcionam um mergulho interno, grandes
                transformações e o resgate da nossa verdadeira essência: a Essência do Amor.
              </p>
              <p>
                Cada viagem tem sua particularidade energética. As experiências são conduzidas
                por profissionais qualificados e facilitadores, com destinos cuidadosamente
                escolhidos ao redor do mundo.
              </p>
              <p className="font-heading text-xl italic text-primary-700">
                Venha fazer parte deste novo sentir.
              </p>
            </div>
            <Link
              href="/sobre"
              className="mt-8 inline-flex items-center gap-3 border-b border-secondary-400 pb-2 text-sm font-semibold text-primary-700 transition-colors hover:text-secondary-500"
            >
              Conheça a NeoSenses <span aria-hidden="true">↗</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="relative mx-auto w-full max-w-[570px]"
          >
            <div aria-hidden="true" className="absolute -left-5 top-8 h-[76%] w-[87%] rotate-[-9deg] rounded-[49%_51%_62%_38%/39%_38%_62%_61%] border border-secondary-300/65" />
            <div aria-hidden="true" className="absolute -bottom-7 right-0 h-52 w-52 rounded-full bg-primary-200/25 blur-3xl" />
            <div
              className="relative aspect-[4/4.4] overflow-hidden bg-primary-100 shadow-[0_28px_80px_rgba(62,11,83,0.14)] sm:aspect-[5/4.5]"
              style={{ borderRadius: "42% 58% 56% 44% / 38% 40% 60% 62%" }}
            >
              <Image
                src="/images/home/proposito-floresta.webp"
                alt="Mulher de braços erguidos em uma floresta, em conexão com a natureza"
                fill
                sizes="(min-width: 1024px) 44vw, (min-width: 640px) 75vw, 100vw"
                quality={90}
                className="object-cover object-center"
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-20 border-t border-secondary-300/35 pt-10 md:mt-28">
          <div className="mb-10 flex w-full justify-center">
            <p className="mx-auto w-max max-w-none text-center text-xs font-semibold uppercase tracking-[0.21em] text-secondary-500">
              O que nos move
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PILARES.map((pilar, i) => (
              <motion.article
                key={pilar.titulo}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09 }}
                className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-secondary-300/30 bg-surface shadow-[0_10px_36px_rgba(58,21,73,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300/65 hover:shadow-[0_22px_56px_rgba(58,21,73,0.14)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-primary-100">
                  <Image
                    src={pilar.imagem}
                    alt={pilar.alt}
                    fill
                    sizes="(min-width: 1280px) 23vw, (min-width: 640px) 46vw, 100vw"
                    quality={90}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col px-6 pb-8 pt-7 text-center">
                  <h3 className="mb-3 font-heading text-2xl leading-tight text-primary-700">{pilar.titulo}</h3>
                  <p className="mx-auto max-w-[32ch] text-sm leading-[1.8] text-text-muted">{pilar.descricao}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
