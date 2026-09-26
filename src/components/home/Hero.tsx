"use client";

/**
 * Capa e pilares da home.
 *
 * Separado da página porque usa framer-motion e precisa rodar no navegador.
 * A página em si virou Server Component para conseguir ler o catálogo — um
 * componente "use client" não consegue buscar dados no servidor.
 */

import Link from "next/link";
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
    titulo: "Roteiros & Vivências",
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
          Um Novo <span className="text-gradient-gold italic">Sentir</span>
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

export function Pilares() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-wide">
        <div className="mb-16 text-center">
          <motion.p
            {...surgir}
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="mx-auto mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500"
          >
            Nosso Propósito
          </motion.p>
          <motion.h2
            {...surgir}
            transition={{ ...transicao, delay: 0.1 }}
            className="mx-auto max-w-3xl font-heading text-3xl text-primary-700 md:text-4xl"
          >
            Experiências que transformam sua jornada interior
          </motion.h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {PILARES.map((pilar, i) => (
            <motion.div
              key={pilar.titulo}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...transicao, delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-surface p-8 text-center transition-all duration-300 hover:border-secondary-300 hover:shadow-card"
            >
              <div className="mb-6 text-3xl text-secondary-500" aria-hidden="true">
                {pilar.icone}
              </div>
              <h3 className="mb-3 font-heading text-xl text-primary-700">{pilar.titulo}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{pilar.descricao}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
