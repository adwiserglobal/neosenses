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
// Fotografias reais sob licença gratuita da Unsplash; URLs das fontes
// preservadas aqui para conferência editorial, sem créditos visíveis no layout.
// Jornadas de Alma: https://unsplash.com/photos/dQm-kS_l1dg
// Autoconhecimento: https://unsplash.com/photos/VD-Vjc8VmRA
// Roteiros e Vivências: https://unsplash.com/photos/dvaF23kPc-0
// Conexão: https://unsplash.com/photos/pc8BUVAVXzo
const PILARES = [
  {
    titulo: "Jornadas de Alma",
    descricao: "Experiências que despertam sentidos, emoções e novos significados.",
    imagem: "https://images.unsplash.com/photo-1758797315487-b3b225dff7d8?auto=format&fit=crop&w=1000&q=85",
    alt: "Participantes em uma vivência de yoga ao ar livre em Rishikesh, Índia",
  },
  {
    titulo: "Autoconhecimento",
    descricao: "Um convite para olhar para dentro e se reconectar com sua essência.",
    imagem: "https://images.unsplash.com/photo-1559595500-e15296bdbb48?auto=format&fit=crop&w=1000&q=85",
    alt: "Mulher meditando diante da paisagem do Grand Canyon",
  },
  {
    titulo: "Roteiros e Vivências",
    descricao: "Culturas, destinos e encontros que transformam cada jornada em uma história.",
    imagem: "https://images.unsplash.com/photo-1526052056866-810289073817?auto=format&fit=crop&w=1000&q=85",
    alt: "Viajante conhecendo as ruínas de Machu Picchu, no Peru",
  },
  {
    titulo: "Conexão",
    descricao: "Pessoas, histórias e momentos que criam laços além da viagem.",
    imagem: "https://images.unsplash.com/photo-1758599668542-53e8c63c8e68?auto=format&fit=crop&w=1000&q=85",
    alt: "Amigos conversando durante uma trilha na floresta",
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
    <section id="nosso-proposito" className="relative overflow-hidden bg-[#f5eddf] py-16 md:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 top-20 h-96 w-96 rounded-full bg-secondary-200/15 blur-[90px]" />
      <div className="container-wide relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.07fr)_minmax(0,0.93fr)] lg:gap-14">
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
            <div className="mt-6 max-w-[64ch] space-y-4 text-[16px] leading-[1.8] text-text-muted md:text-[17px]">
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
              className="mt-8 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-8 py-4 text-sm font-semibold text-primary-700 transition-all hover:border-secondary-500 hover:text-secondary-500"
            >
              Conheça a NeoSenses
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="relative mx-auto w-full max-w-[570px]"
          >
            <div
              className="relative aspect-[4/4.2] overflow-hidden bg-[#411a35] shadow-[0_22px_60px_rgba(62,11,83,0.15)] sm:aspect-[5/4.3]"
              style={{ borderRadius: "42% 58% 56% 44% / 38% 40% 60% 62%" }}
            >
              {/* Foto da celebração Holi escolhida para esta seção. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.natgeofe.com/n/b16edb14-92d9-4177-b511-a6e791250092/gettyimages-471366604.jpeg"
                alt="Mulher celebrando o Holi, envolta em cores vibrantes"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

export function OQueNosMove() {
  return (
    <section
      id="o-que-nos-move"
      aria-labelledby="o-que-nos-move-titulo"
      className="relative overflow-hidden bg-[#f0e5d3] py-12 md:py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_0%_15%,rgba(215,168,40,0.12),transparent_27%),radial-gradient(circle_at_100%_85%,rgba(126,35,155,0.06),transparent_30%)]"
      />

      <div className="container-wide relative">
        <header className="mx-auto mb-9 max-w-[810px] text-center md:mb-11">
          <p className="text-xs font-semibold uppercase tracking-[0.21em] text-secondary-500">
            O que nos move
          </p>
          <h2
            id="o-que-nos-move-titulo"
            className="mt-4 font-heading text-[clamp(2.5rem,4.2vw,3.7rem)] leading-[1.12] text-primary-700"
          >
            Muito além de uma viagem.
          </h2>
          <p className="mx-auto mt-5 max-w-[68ch] text-base leading-[1.8] text-[#625348] md:text-lg">
            Cada jornada é uma oportunidade de descobrir novos lugares, criar
            conexões e transformar a maneira como sentimos o mundo.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4">
          {PILARES.map((pilar, i) => (
            <motion.article
              key={pilar.titulo}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e5d4b3] bg-[#fffaf2] shadow-[0_8px_28px_rgba(70,37,27,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300/70 hover:shadow-[0_18px_45px_rgba(70,37,27,0.12)]"
            >
              <div className="relative aspect-[6/5] overflow-hidden bg-primary-100">
                <Image
                  src={pilar.imagem}
                  alt={pilar.alt}
                  fill
                  sizes="(min-width: 1280px) 23vw, (min-width: 640px) 47vw, 100vw"
                  quality={85}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-1 flex-col items-center px-5 pb-7 pt-5 text-center">
                <h3 className="flex min-h-[2.5em] w-full items-center justify-center text-center font-heading text-[1.7rem] leading-[1.18] text-primary-700">
                  {pilar.titulo}
                </h3>
                <p className="mx-auto mt-2 max-w-[31ch] text-center text-[16px] leading-[1.7] text-[#655648]">
                  {pilar.descricao}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}
