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
    icone: "✦",
    titulo: "Jornadas de Alma",
    descricao:
      "Intenção e aprendizados com experiências profundas para transformar a sua vida.",
  },
  {
    icone: "◯",
    titulo: "Autoconhecimento",
    descricao:
      "Avançar cada dia mais em sua jornada interior e evoluir continuamente como pessoa.",
  },
  {
    icone: "❋",
    titulo: "Roteiros e Vivências",
    descricao:
      "Caminhos e itinerários desenhados para você viver grandes transformações.",
  },
  {
    icone: "∞",
    titulo: "Conexão",
    descricao:
      "Harmonia com a natureza e com pessoas que vibram na mesma energia e intenções.",
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
                src="https://images.unsplash.com/photo-1610313898425-a5c637a940db?auto=format&fit=crop&w=1440&q=88"
                alt="Mulher celebrando o festival Holi, com cores vibrantes no rosto"
                fill
                sizes="(min-width: 1024px) 44vw, (min-width: 640px) 75vw, 100vw"
                quality={90}
                className="object-cover object-center"
              />
            </div>
            <p className="mt-4 text-right text-[10px] text-text-muted/75">
              Foto: Bulbul Ahmed / Unsplash
            </p>
          </motion.div>
        </div>

        <div className="mt-20 border-t border-secondary-300/35 pt-10 md:mt-28">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.21em] text-secondary-500">
            O que nos move
          </p>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {PILARES.map((pilar, i) => (
              <motion.div
                key={pilar.titulo}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="px-3 py-2 text-center lg:border-r lg:border-secondary-300/25 lg:px-6 lg:last:border-r-0"
              >
                <div className="mb-3 text-2xl text-secondary-500" aria-hidden="true">{pilar.icone}</div>
                <h3 className="mb-2 font-heading text-xl text-primary-700">{pilar.titulo}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-text-muted">{pilar.descricao}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
