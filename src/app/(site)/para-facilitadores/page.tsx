/**
 * O outro funil: terapeutas, facilitadoras e líderes que levam o próprio
 * grupo.
 *
 * O site inteiro falava com quem compra uma vaga. Quem forma o grupo ,
 * que é de onde vêm as jornadas dos três modelos da equipe, não tinha
 * porta nenhuma: chegava por uma página de experiência, lia "3 vagas
 * restantes" e saía.
 *
 * O endereço é `/para-facilitadores` e não `/b2b`: quem lê o menu é uma
 * pessoa, e "B2B" não diz nada para ela.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Capa, Chapeu, Faixa, Grade, TituloDeSecao } from "@/components/templates/blocos";
import { Parceria } from "@/components/templates/funil";
import { Surge } from "@/components/ui/Surge";
import { FaixaDeFotos, type FotoDaFaixa } from "@/components/ui/FaixaDeFotos";
import { JsonLd } from "@/components/seo/JsonLd";
import * as schema from "@/lib/seo/dadosEstruturados";
import { linkWhatsApp } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Para Facilitadores",
  description:
    "Traga seu retiro ou grupo para o mundo com a NeoSenses. Você cuida da facilitação; nós cuidamos da logística, da operação turística e da segurança do seu projeto.",
  alternates: { canonical: "/para-facilitadores" },
  openGraph: {
    title: "Traga seu Retiro ou Grupo para o Mundo com a NeoSenses",
    description:
      "Operação, logística, guia credenciado e tranquilidade jurídica para terapeutas, mentores e facilitadores.",
  },
};

export const revalidate = 3600;
export const dynamic = "force-static";

/** Fotos da NeoSenses, em arquivos próprios (ver public/images/b2b/ORIGEM.md). */
const FOTOS_DA_FAIXA: FotoDaFaixa[] = [
  { src: "/images/b2b/peru-titicaca.jpg", alt: "Paisagem andina do Peru" },
  { src: "/images/b2b/marrocos-entrega.jpg", alt: "Vivência no Marrocos" },
  { src: "/images/b2b/amazonas-floresta-aerea.jpg", alt: "Floresta amazônica vista do alto" },
  { src: "/images/b2b/marrocos-farmacia-berbere.jpg", alt: "Cultura local no Marrocos" },
  { src: "/images/b2b/peru-lagoa-sagrada.jpg", alt: "Lagoa em meio às montanhas do Peru" },
  { src: "/images/b2b/amazonas-flutuante.jpg", alt: "Comunidade ribeirinha na Amazônia" },
  { src: "/images/b2b/marrocos-rabat.jpg", alt: "Arquitetura e paisagem urbana do Marrocos" },
  { src: "/images/b2b/amazonas-hero-principal.jpg", alt: "Paisagem do rio e da floresta amazônica" },
];

const MOMENTOS = [
  {
    src: "/images/b2b/peru-titicaca.jpg",
    alt: "Paisagem andina do Peru",
    legenda: "Territórios que fazem parte da jornada",
  },
  {
    src: "/images/b2b/peru-lagoa-sagrada.jpg",
    alt: "Lagoa cercada pelas montanhas dos Andes",
    legenda: "Natureza e tempo para contemplar",
  },
  {
    src: "/images/b2b/amazonas-floresta-aerea.jpg",
    alt: "Vista aérea da floresta amazônica",
    legenda: "A dimensão da floresta",
  },
  {
    src: "/images/b2b/amazonas-flutuante.jpg",
    alt: "Paisagem ribeirinha da Amazônia",
    legenda: "A vida que acompanha o rio",
  },
];

const MENSAGEM =
  "Olá! Conduzo grupos e gostaria de conversar sobre como levar uma jornada com a NeoSenses.";

/**
 * O que a NeoSenses faz e o que fica com quem conduz.
 *
 * Fixo aqui, e não vindo do banco: é a proposta da empresa, igual em
 * qualquer destino. As três páginas de jornada trazem a versão específica
 * delas, que sai do conteúdo cadastrado.
 */
const PARCERIA = {
  facilitador: [
    "Sua medicina, sua abordagem e o seu método de trabalho.",
    "Seu grupo, as pessoas que confiam na sua condução.",
    "A intenção e o propósito que você quer que a viagem desperte.",
    "As práticas que forem parte do seu processo.",
  ],
  neosenses: [
    "A curadoria do roteiro, desenhado a partir do propósito do grupo.",
    "A estrutura local: hospedagem, deslocamentos e parceiros de confiança.",
    "A conexão com comunidades, condutores e vivências de cada território.",
    "O espaço e o tempo, dentro do roteiro, para você conduzir o seu trabalho.",
    "O suporte durante toda a jornada, para que você cuide do grupo e não da operação.",
  ],
};

/**
 * Os quatro benefícios do passo 3 do documento, com o texto da equipe.
 *
 * O que NÃO entrou: o número do CADASTUR. O documento traz o CNPJ no campo
 * do registro turístico, e são coisas diferentes, publicar um registro do
 * Ministério do Turismo errado é problema com o Ministério, não detalhe de
 * página. O texto afirma o que a equipe afirma sobre a operação; o número
 * entra quando ela disser qual é.
 */
const BENEFICIOS: Array<{
  titulo: string;
  texto: string;
  itens?: Array<{ titulo: string; texto: string }>;
}> = [
  {
    titulo: "Operação e logística 100% responsável",
    texto:
      "Curadoria e reservas em hotéis, ashrams e locais de vivência validados. Emissão de passagens, traslados, seguros-viagem e suporte 24h para os participantes.",
  },
  {
    titulo: "Acompanhamento técnico e condução terapêutica de apoio",
    texto:
      "Sua função na viagem é sustentar o campo, conduzir os participantes e focar na entrega da sua vivência. Para que você não precise se preocupar com logística ou imprevistos, todas as nossas viagens contam com o acompanhamento de um guia de turismo credenciado.",
    itens: [
      {
        titulo: "Sensibilidade terapêutica",
        texto:
          "guias com formação em linhas de autoconhecimento e práticas terapêuticas, prontos para atuar com acolhimento e sustentação ao seu lado.",
      },
      {
        titulo: "Anfitriões e guias locais ancestrais",
        texto:
          "parceiros locais exclusivos, como o xamã no Peru, que conduz rituais tradicionais e compartilha a sabedoria ancestral da região.",
      },
    ],
  },
  {
    titulo: "Tranquilidade jurídica e financeira",
    texto:
      "Agência regulada, emissão de contratos e gestão de recebimentos, a parte que costuma travar um projeto de retiro sai das suas mãos.",
  },
  {
    titulo: "Co-criação e divulgação",
    texto: "Apoio na estruturação do itinerário e divulgação do evento na rede NeoSenses.",
  },
];

const COMO_FUNCIONA = [
  {
    id: "intencao",
    titulo: "Alinhamento da Intenção",
    descricao:
      "Conversamos sobre o perfil do seu grupo, o propósito da vivência e o destino ideal.",
  },
  {
    id: "desenho",
    titulo: "Desenho e Precificação",
    descricao:
      "Montamos o roteiro completo, cuidando dos bloqueios aéreos, hospedagens e custos.",
  },
  {
    id: "embarque",
    titulo: "Divulgação e Embarque",
    descricao:
      "Apoiamos no material de apresentação para seus participantes e acompanhamos toda a operação do início ao fim.",
  },
];

export default function ParaFacilitadoresPage() {
  return (
    <>
      <JsonLd
        dados={schema.trilha([
          { nome: "Início", url: "/" },
          { nome: "Para facilitadores", url: "/para-facilitadores" },
        ])}
      />

      <Capa
        chapeu="Para terapeutas, mentores e facilitadores"
        titulo="Traga seu Retiro ou Grupo para o Mundo com a NeoSenses"
        resumo="Você cuida da facilitação e do cuidado com as pessoas. Nós cuidamos de toda a logística, operação turística e segurança do seu projeto."
        imagem="https://cdn.openart.ai/openart-uploads/production/attachment-transfers/24a92239a3b08a656a404aa6816c8597ba6288bd83620f3bc145c38d34c5aee6.png"
        altura="cheia"
        acoes={
          <>
            <a
              href={linkWhatsApp(MENSAGEM)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primario"
            >
              Agendar reunião no WhatsApp
            </a>
            <a href="#beneficios" className="btn-secundario btn-secundario-claro">
              Ver o que você recebe
            </a>
          </>
        }
      />

      <Faixa fundo="areia" largura="content">
        <TituloDeSecao chapeu="A proposta" titulo="A parceira estratégica do seu projeto" />
        <Surge className="mt-8 space-y-5">
          <p className="max-w-[68ch] leading-relaxed text-text-primary/85">
            Sabemos que organizar uma imersão ou viagem exige tempo, planejamento impecável
            e gestão de riscos. A NeoSenses caminha ao lado de terapeutas, mentores e
            facilitadores que desejam realizar seus projetos sem se preocupar com reservas,
            passagens, hospedagens energeticamente alinhadas ou burocracias operacionais.
          </p>
        </Surge>
      </Faixa>

      <section aria-label="Território em imagens" className="overflow-hidden bg-warm-white py-8 md:py-12">
        <FaixaDeFotos fotos={FOTOS_DA_FAIXA} />
      </section>

      <section className="bg-warm-white py-6 md:py-10">
        <div className="container-wide">
          <div className="grid gap-4 md:grid-cols-[1.35fr_0.85fr]">
            <Surge className="relative min-h-[360px] overflow-hidden rounded-[26px] md:min-h-[560px]">
            <figure className="group absolute inset-0">
              <Image
                src="/images/b2b/peru-machu-picchu.jpg"
                alt="Machu Picchu, um dos territórios onde a NeoSenses desenvolve jornadas para grupos"
                fill
                sizes="(min-width: 768px) 65vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/70 via-transparent to-transparent" />
              <figcaption className="absolute bottom-0 left-0 right-0 p-7 text-warm-white md:p-9">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-300">
                  Territórios com intenção
                </span>
                <p className="mt-2 max-w-xl font-heading text-2xl md:text-3xl">
                  O destino também faz parte do processo.
                </p>
              </figcaption>
            </figure>
            </Surge>

            <div className="grid gap-4">
              <Surge atraso={0.12} className="relative min-h-[260px] overflow-hidden rounded-[26px]">
              <figure className="group absolute inset-0">
                <Image
                  src="/images/b2b/marrocos-deserto.jpg"
                  alt="Deserto do Marrocos"
                  fill
                  sizes="(min-width: 768px) 35vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/65 via-transparent to-transparent" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-6 text-warm-white">
                  <p className="font-heading text-xl">Marrocos</p>
                  <p className="mt-1 text-sm text-warm-white/80">Travessias, silêncio e presença.</p>
                </figcaption>
              </figure>
              </Surge>

              <Surge atraso={0.24} className="relative min-h-[260px] overflow-hidden rounded-[26px]">
              <figure className="group absolute inset-0">
                <Image
                  src="/images/b2b/amazonas-hero-lago.jpg"
                  alt="Paisagem amazônica"
                  fill
                  sizes="(min-width: 768px) 35vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/65 via-transparent to-transparent" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-6 text-warm-white">
                  <p className="font-heading text-xl">Amazônia</p>
                  <p className="mt-1 text-sm text-warm-white/80">Natureza, ancestralidade e reconexão.</p>
                </figcaption>
              </figure>
              </Surge>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5eddf] py-16 md:py-20">
        <div className="container-wide">
          <div className="mb-9 max-w-3xl">
            <p className="chapeu chapeu-com-risco">Roteiros para grupos</p>
            <h2 className="mt-3 font-heading text-3xl text-primary-700 md:text-4xl">
              Destinos que podemos desenhar com você
            </h2>
            <p className="mt-4 max-w-[68ch] leading-relaxed text-text-muted">
              Estes são pontos de partida para a conversa. O itinerário, o ritmo e as
              vivências são ajustados ao propósito e ao perfil de cada grupo.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                nome: "Marrocos",
                texto: "Cultura, travessias e encontros pelo território.",
                imagem: "/images/b2b/marrocos-entrega.jpg",
                href: "/experiencias/marrocos-com-neosenses",
              },
              {
                nome: "Peru",
                texto: "Andes, saberes locais e paisagens de contemplação.",
                imagem: "/images/b2b/peru-titicaca.jpg",
                href: linkWhatsApp("Olá! Quero conversar sobre um roteiro para meu grupo no Peru com a NeoSenses."),
              },
              {
                nome: "Amazônia",
                texto: "Floresta, rios e experiências com parceiros locais.",
                imagem: "/images/b2b/amazonas-floresta-aerea.jpg",
                href: linkWhatsApp("Olá! Quero conversar sobre um roteiro para meu grupo na Amazônia com a NeoSenses."),
              },
              {
                nome: "Egito",
                texto: "História, templos e uma jornada pelo patrimônio egípcio.",
                imagem: "/images/destinations/egito.jpg",
                href: linkWhatsApp("Olá! Quero conversar sobre um roteiro para meu grupo no Egito com a NeoSenses."),
              },
            ].map((destino) => (
              <a
                key={destino.nome}
                href={destino.href}
                target={destino.href.startsWith("http") ? "_blank" : undefined}
                rel={destino.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group relative isolate flex min-h-[300px] overflow-hidden rounded-2xl bg-primary-800"
              >
                <Image
                  src={destino.imagem}
                  alt={destino.nome}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b1020]/90 via-[#1b1020]/20 to-transparent" />
                <div className="relative z-10 mt-auto p-6 text-white">
                  <h3 className="font-heading text-2xl">{destino.nome}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{destino.texto}</p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-secondary-200">
                    Conhecer roteiro-base →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Os quatro benefícios do passo 3 do documento. Não é grade de
          cartões curtos: cada um carrega o detalhe que sustenta a promessa,
          e resumir "acompanhamento técnico" numa linha esvaziaria justamente
          o que diferencia a proposta. */}
      <Faixa fundo="clara" id="beneficios">
        <TituloDeSecao
          chapeu="O que você recebe"
          titulo="Quatro frentes que saem das suas mãos"
          fundo="clara"
        />
        <Surge className="mt-12 grid items-stretch gap-8 overflow-hidden rounded-[28px] border border-primary-100 bg-warm-white lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[320px] lg:min-h-[460px]">
            <Image
              src="https://cdn.openart.ai/openart-uploads/production/attachment-transfers/d2efb638a4bb7d5581aad932c55439d150ccbf887c191c939171bffdfdaea9ae.jpg"
              alt="Grupo caminhando por uma paisagem de montanha durante uma jornada"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
            <Chapeu className="mb-4">Você conduz. A gente sustenta.</Chapeu>
            <h3 className="max-w-xl font-heading text-3xl leading-tight text-primary-700 md:text-4xl">
              Menos energia na operação. Mais presença com o seu grupo.
            </h3>
            <p className="mt-5 max-w-[58ch] leading-relaxed text-text-muted">
              A proposta é tirar da facilitadora o peso de coordenar fornecedores, deslocamentos,
              reservas e imprevistos. A NeoSenses estrutura a jornada para que o seu trabalho
              continue sendo o centro da experiência.
            </p>
          </div>
        </Surge>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-secondary-300/50 bg-secondary-50 p-7 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-700">
              Acompanhamento durante a jornada
            </p>
            <h3 className="mt-3 font-heading text-2xl text-primary-700">
              Guia acompanhante credenciado
            </h3>
            <p className="mt-4 leading-relaxed text-text-muted">
              Um profissional acompanha o grupo e apoia a operação no destino, os
              deslocamentos, os horários e os imprevistos. Assim, você não precisa
              dividir sua atenção entre a condução da vivência e a logística da viagem.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-warm-white p-7 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-700">
              Conexão com o território
            </p>
            <h3 className="mt-3 font-heading text-2xl text-primary-700">
              Guia local ancestral
            </h3>
            <p className="mt-4 leading-relaxed text-text-muted">
              Conforme o destino e a proposta do grupo, parceiros locais aproximam
              os participantes da história, da cultura e dos conhecimentos do lugar.
              A presença e o formato dessas vivências são definidos no desenho do roteiro.
            </p>
          </article>
        </div>

        <ol className="mt-14 space-y-px">
          {BENEFICIOS.map((b, i) => (
            <Surge
              as="li"
              key={b.titulo}
              atraso={Math.min(i, 3) * 0.08}
              className="grid gap-4 border-t border-border py-8 md:grid-cols-[auto_1fr] md:gap-10"
            >
              <span
                aria-hidden="true"
                className="font-heading text-3xl leading-none text-secondary-500 md:w-16"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-xl text-primary-700">{b.titulo}</h3>
                <p className="mt-3 max-w-[68ch] leading-relaxed text-text-muted">{b.texto}</p>
                {b.itens && (
                  <ul className="mt-4 space-y-2.5">
                    {b.itens.map((item) => (
                      <li key={item.titulo} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-400"
                        />
                        <span className="max-w-[64ch] leading-relaxed text-text-primary/85">
                          <strong className="font-medium text-primary-700">{item.titulo}:</strong>{" "}
                          {item.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Surge>
          ))}
        </ol>

        <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {MOMENTOS.map((m, i) => (
            <Surge as="li" key={m.src} atraso={i * 0.08} className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src={m.src}
                alt={m.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-primary-900/75 via-transparent to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-4 font-heading text-base leading-snug text-warm-white md:p-5 md:text-lg">
                {m.legenda}
              </p>
            </Surge>
          ))}
        </ul>
      </Faixa>

      <Parceria
        chapeu="Como funciona a parceria"
        titulo="Cada uma no que faz melhor"
        facilitador={PARCERIA.facilitador}
        neosenses={PARCERIA.neosenses}
        fundo="areia"
      />

      <Faixa fundo="noite">
        <TituloDeSecao chapeu="O caminho" titulo="Como funciona na prática" fundo="noite" />
        <div className="mt-12">
          <Grade itens={COMO_FUNCIONA} fundo="noite" colunas={3} />
        </div>
      </Faixa>

      <Faixa fundo="clara" largura="content">
        <TituloDeSecao chapeu="Perguntas frequentes" titulo="O que costumam perguntar" />
        <div className="mt-10 space-y-3">
          {[
            {
              q: "Preciso já ter o grupo formado?",
              a: "Não. Muita gente procura a NeoSenses antes de abrir as inscrições, justamente para ter o roteiro e o valor em mãos na hora de convidar o grupo.",
            },
            {
              q: "Qual o tamanho mínimo de grupo?",
              a: "Depende do território e do formato. É uma das primeiras coisas que a consultora consegue responder, porque muda o custo por pessoa e o tipo de hospedagem possível.",
            },
            {
              q: "Posso conduzir minhas próprias práticas?",
              a: "Sim, é a razão de ser da parceria. O roteiro é desenhado com espaço e tempo reservados para o seu trabalho, não com a agenda cheia de passeio.",
            },
            {
              q: "E se o destino que eu quero não estiver na lista?",
              a: "Fale com a consultora. Os territórios publicados são os que já têm estrutura montada; outros destinos são avaliados caso a caso.",
            },
            {
              q: "Como funciona a parte financeira?",
              a: "Isso é conversado direto com a consultora, caso a caso, depende do território, do tamanho do grupo e do formato da jornada.",
            },
          ].map((item, i) => (
            <Surge key={item.q} atraso={i * 0.05}>
            <details className="group rounded-xl border border-border bg-warm-white px-6 py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-primary-700 marker:content-['']">
                {item.q}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg text-secondary-500 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-[68ch] leading-relaxed text-text-muted">{item.a}</p>
            </details>
            </Surge>
          ))}
        </div>
      </Faixa>

      <section className="relative isolate overflow-hidden bg-forest-700 py-24 md:py-32">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/images/b2b/marrocos-final.jpg"
            alt=""
            fill
            sizes="100vw"
            className="zoom-lento object-cover object-center"
          />
          <div className="absolute inset-0 bg-forest-700/70" />
        </div>
        <Surge className="container-content relative z-10 text-center">
          <Chapeu escuro className="mb-5">
            O convite
          </Chapeu>
          <h2 className="mx-auto max-w-2xl font-heading text-3xl text-warm-white md:text-4xl">
            Conte para a consultora quem é o seu grupo
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-white/75">
            O roteiro nasce daí, do que você quer que essa viagem desperte nas pessoas
            que confiam em você.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={linkWhatsApp(MENSAGEM)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primario"
            >
              Falar no WhatsApp
            </a>
            <Link href="/contato" className="btn-secundario btn-secundario-claro">
              Enviar uma mensagem
            </Link>
          </div>
        </Surge>
      </section>
    </>
  );
}
