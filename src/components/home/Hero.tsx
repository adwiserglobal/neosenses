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
    descricao: "Um convite para ouvir o que importa, criar memórias e descobrir novas perspectivas.",
    imagem: "/images/home/proposito-floresta.webp",
    alt: "Vivência de conexão interior em meio à natureza",
  },
  {
    titulo: "Autoconhecimento",
    descricao: "Uma pausa no ritmo de sempre para se escutar, respirar e se redescobrir.",
    imagem: "/images/b2b/peru-lagoa-sagrada.jpg",
    alt: "Paisagem natural de uma jornada de autoconhecimento no Peru",
  },
  {
    titulo: "Roteiros e Vivências",
    descricao: "Sabores, histórias, rituais e lugares que fazem cada dia valer a lembrança.",
    imagem: "/images/b2b/peru-machu-picchu.jpg",
    alt: "Roteiro de viagem por Machu Picchu",
  },
  {
    titulo: "Conexão",
    descricao: "As conversas, os abraços e os encontros que dão outro sentido a viajar.",
    imagem: "/images/b2b/amazonas-comunidade.jpg",
    alt: "Convívio e conexão humana em comunidade na Amazônia",
  },
];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[94svh] items-center overflow-hidden bg-[#221627]">
      {/* Fundo fotográfico preservado, mas com direção editorial mais quente. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero/homepage.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,14,26,0.91)_0%,rgba(31,16,35,0.81)_44%,rgba(33,15,34,0.49)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#221627]/50 to-transparent" />

      <div className="container-wide relative z-10 grid w-full items-center gap-12 pb-24 pt-36 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-16 lg:pb-28 lg:pt-40">
        <div className="max-w-[750px] text-center lg:text-left">
          <motion.p
            {...surgir}
            className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d98a]"
          >
            <span className="h-px w-8 bg-[#f4d98a]/80" aria-hidden="true" />
            NeoSenses · Um novo sentir
          </motion.p>

          <motion.h1
            {...surgir}
            transition={{ ...transicao, delay: 0.1 }}
            className="font-heading text-[clamp(2.8rem,5.2vw,5.3rem)] font-normal leading-[1.07] tracking-[-0.025em] text-warm-white"
          >
            Há viagens que nos levam para longe.
            <span className="mt-3 block italic text-[#f0c76b]">
              Outras nos aproximam de nós mesmas.
            </span>
          </motion.h1>

          <motion.p
            {...surgir}
            transition={{ ...transicao, delay: 0.2 }}
            className="mx-auto mt-8 max-w-[57ch] text-base leading-[1.85] text-white/86 md:text-lg lg:mx-0"
          >
            Encontros que acolhem, culturas que despertam os sentidos e experiências
            para viver com presença. Sua próxima jornada pode começar aqui.
          </motion.p>

          <motion.div
            {...surgir}
            transition={{ ...transicao, delay: 0.3 }}
            className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link href="/experiencias" className="btn-primario px-8 py-4">
              Descobrir minha jornada
            </Link>
            <Link href="/para-facilitadores" className="btn-secundario btn-secundario-claro px-8 py-4">
              Quero levar meu grupo
            </Link>
          </motion.div>

          <motion.div
            {...surgir}
            transition={{ ...transicao, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 lg:justify-start"
          >
            <span>Descoberta</span>
            <span className="h-1 w-1 rounded-full bg-[#e9c269]" aria-hidden="true" />
            <span>Conexão</span>
            <span className="h-1 w-1 rounded-full bg-[#e9c269]" aria-hidden="true" />
            <span>Pertencimento</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: suave, delay: 0.22 }}
          className="relative mx-auto hidden h-[540px] w-full max-w-[560px] lg:block"
          aria-label="Imagens de cultura, viagem e encontros"
        >
          <div className="absolute right-0 top-4 h-[410px] w-[72%] overflow-hidden rounded-[46%_46%_13%_13%/31%_31%_9%_9%] border-[5px] border-white/12 bg-[#4b2650] shadow-[0_32px_80px_rgba(0,0,0,0.28)]">
            <Image
              src="/images/b2b/marrocos-henna.jpg"
              alt="Encontro com tradições e rituais de henna no Marrocos"
              fill
              sizes="(min-width: 1024px) 32vw, 100vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="absolute bottom-3 left-2 h-[260px] w-[54%] rotate-[-5deg] overflow-hidden rounded-[44%_44%_12%_12%/34%_34%_8%_8%] border-[5px] border-[#fff5dc] bg-[#341b39] shadow-[0_22px_65px_rgba(0,0,0,0.32)]">
            <Image
              src="/images/b2b/amazonas-comunidade.jpg"
              alt="Encontro comunitário em uma experiência de viagem"
              fill
              sizes="(min-width: 1024px) 24vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="absolute bottom-7 right-2 rounded-2xl border border-white/25 bg-[#25152b]/80 px-5 py-4 shadow-xl backdrop-blur-lg">
            <span className="block font-heading text-xl italic text-[#f1d287]">O mundo é para sentir.</span>
            <span className="mt-1 block text-xs text-white/75">E a jornada é sua.</span>
          </div>

          <span
            aria-hidden="true"
            className="absolute -left-1 top-[22%] h-24 w-24 rounded-full border border-[#eecf82]/60"
          />
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.22em] text-white/55 lg:left-auto lg:right-12 lg:translate-x-0">
        Deslize para descobrir
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
              Sentir o mundo. <span className="italic text-secondary-500">Se encontrar nele.</span>
            </h2>
            <div className="mt-8 h-px w-20 bg-secondary-300" aria-hidden="true" />
            <div className="mt-8 max-w-[64ch] space-y-5 text-[15px] leading-[1.85] text-text-muted md:text-base">
              <p>
                Algumas viagens começam com a vontade de conhecer um lugar. Outras, com
                uma vontade mais íntima: respirar fundo, encontrar novas pessoas,
                experimentar outras culturas e voltar a olhar para si.
              </p>
              <p>
                É desse encontro entre o mundo lá fora e o que acontece dentro de nós
                que nasce a NeoSenses. Jornadas com intenção, roteiros espirituais e
                vivências que convidam a estar presente de verdade.
              </p>
              <p>
                Cada experiência tem seu próprio ritmo, seus encontros e seus saberes,
                com a presença de profissionais e facilitadores e destinos escolhidos
                para despertar novos sentidos.
              </p>
              <p className="font-heading text-xl italic text-primary-700">
                Há um mundo para descobrir. E um lugar para você nessa história.
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
              {/* Fotografia da celebração Holi, fornecida como referência pela equipe. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.natgeofe.com/n/b16edb14-92d9-4177-b511-a6e791250092/gettyimages-471366604.jpeg"
                alt="Mulher dançando durante o Holi, envolta em pós coloridos"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  const alternativa = "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/15ab1e2dfb63dcd7970809309e9b948eb21a31c22c3c037e0ecc56f058cc7f06.jpg";
                  if (event.currentTarget.src !== alternativa) event.currentTarget.src = alternativa;
                }}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#230b2e]/35 to-transparent" />
              <span className="absolute bottom-6 right-7 rounded-full border border-white/45 bg-[#32102b]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                Cultura em movimento · Holi, Índia
              </span>
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
