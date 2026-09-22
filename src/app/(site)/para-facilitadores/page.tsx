/**
 * O outro funil: terapeutas, facilitadoras e líderes que levam o próprio
 * grupo.
 *
 * O site inteiro falava com quem compra uma vaga. Quem forma o grupo —
 * que é de onde vêm as jornadas dos três modelos da equipe — não tinha
 * porta nenhuma: chegava por uma página de experiência, lia "3 vagas
 * restantes" e saía.
 *
 * O endereço é `/para-facilitadores` e não `/b2b`: quem lê o menu é uma
 * pessoa, e "B2B" não diz nada para ela.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listarParaFacilitadores } from "@/lib/dal/experiences";
import { Capa, Chapeu, Faixa, Grade, TituloDeSecao } from "@/components/templates/blocos";
import { Parceria } from "@/components/templates/funil";
import { JsonLd } from "@/components/seo/JsonLd";
import * as schema from "@/lib/seo/dadosEstruturados";
import { linkWhatsApp, t, podeOtimizar } from "@/lib/utils";
import type { I18nField } from "@/types/models";

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

const MENSAGEM =
  "Olá! Sou terapeuta/facilitadora e quero levar meu grupo numa jornada. Podemos agendar uma conversa?";

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
    "Seu grupo — as pessoas que confiam na sua condução.",
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
 * do registro turístico, e são coisas diferentes — publicar um registro do
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
      "Agência regulada, emissão de contratos e gestão de recebimentos — a parte que costuma travar um projeto de retiro sai das suas mãos.",
  },
  {
    titulo: "Co-criação e divulgação",
    texto: "Apoio na estruturação do itinerário e divulgação do evento na rede NeoSenses.",
  },
];

const COMO_FUNCIONA = [
  {
    id: "conversa",
    titulo: "Uma conversa",
    descricao:
      "Você conta quem é o seu grupo, o que quer que essa viagem desperte e em que época faria sentido. Não precisa ter o grupo formado.",
  },
  {
    id: "proposta",
    titulo: "Um roteiro desenhado",
    descricao:
      "A NeoSenses monta a proposta: territórios, vivências, hospedagem, ritmo e os espaços reservados para o seu trabalho.",
  },
  {
    id: "ajuste",
    titulo: "O ajuste fino",
    descricao:
      "Vocês revisam juntos até o roteiro ficar do jeito do seu grupo. Nada é engessado — o desenho existe para servir ao propósito.",
  },
  {
    id: "jornada",
    titulo: "A jornada",
    descricao:
      "Você conduz o seu grupo. A NeoSenses sustenta a operação de ponta a ponta, no destino, durante toda a viagem.",
  },
];

export default async function ParaFacilitadoresPage() {
  const jornadas = await listarParaFacilitadores();

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
        imagem="/images/b2b/peru-lagoa-sagrada.jpg"
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
            <a href="#jornadas" className="btn-secundario btn-secundario-claro">
              Ver os territórios
            </a>
          </>
        }
      />

      <Faixa fundo="areia" largura="content">
        <TituloDeSecao chapeu="A proposta" titulo="A parceira estratégica do seu projeto" />
        <div className="mt-8 space-y-5">
          <p className="max-w-[68ch] leading-relaxed text-text-primary/85">
            Sabemos que organizar uma imersão ou viagem exige tempo, planejamento impecável
            e gestão de riscos. A NeoSenses é a parceira estratégica de terapeutas, mentores
            e facilitadores que desejam realizar seus projetos sem se preocupar com reservas,
            passagens, hospedagens energeticamente alinhadas ou burocracias operacionais.
          </p>
        </div>
      </Faixa>

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
        <ol className="mt-12 space-y-px">
          {BENEFICIOS.map((b, i) => (
            <li
              key={b.titulo}
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
            </li>
          ))}
        </ol>
      </Faixa>

      <Parceria
        chapeu="Como funciona a parceria"
        titulo="Cada uma no que faz melhor"
        facilitador={PARCERIA.facilitador}
        neosenses={PARCERIA.neosenses}
        fundo="areia"
      />

      <Faixa fundo="noite">
        <TituloDeSecao chapeu="O caminho" titulo="Do primeiro contato à viagem" fundo="noite" />
        <div className="mt-12">
          <Grade itens={COMO_FUNCIONA} fundo="noite" colunas={4} />
        </div>
      </Faixa>

      <Faixa fundo="areia" id="jornadas">
        <TituloDeSecao
          chapeu="Territórios"
          titulo="Onde a NeoSenses já sustenta jornadas de grupo"
          texto="Cada página mostra o território, as vivências possíveis e o que pode compor o roteiro do seu grupo. O destino que você procura não está aqui? Fale com a consultora — a lista é o que já está estruturado, não o limite."
        />

        {jornadas.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-text-muted">
              As jornadas para grupos ainda não foram publicadas.{" "}
              <a
                href={linkWhatsApp(MENSAGEM)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-500 underline underline-offset-4"
              >
                Fale com a consultora
              </a>{" "}
              para conhecer os territórios disponíveis.
            </p>
          </div>
        ) : (
          <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {jornadas.map((j) => {
              const titulo = t(j.title as I18nField, "pt");
              const slug = t(j.slug as I18nField, "pt");
              const resumo = t(j.short_description as I18nField, "pt");
              const chapeu = t(j.hero_kicker as I18nField, "pt");

              return (
                <li key={j.id}>
                  <Link
                    href={`/experiencias/${slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-secondary-300 hover:shadow-card"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden bg-warm-gray">
                      {j.hero_image && (
                        <Image
                          src={j.hero_image}
                          alt=""
                          aria-hidden="true"
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          unoptimized={!podeOtimizar(j.hero_image)}
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      {chapeu && <Chapeu className="mb-3">{chapeu}</Chapeu>}
                      <h3 className="font-heading text-xl leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
                        {titulo}
                      </h3>
                      {resumo && (
                        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-text-muted">
                          {resumo}
                        </p>
                      )}
                      <p className="mt-auto pt-5 text-sm font-medium text-secondary-500">
                        Conhecer o território →
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
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
              a: "Sim — é a razão de ser da parceria. O roteiro é desenhado com espaço e tempo reservados para o seu trabalho, não com a agenda cheia de passeio.",
            },
            {
              q: "E se o destino que eu quero não estiver na lista?",
              a: "Fale com a consultora. Os territórios publicados são os que já têm estrutura montada; outros destinos são avaliados caso a caso.",
            },
            {
              q: "Como funciona a parte financeira?",
              a: "Isso é conversado direto com a consultora, caso a caso — depende do território, do tamanho do grupo e do formato da jornada.",
            },
          ].map((item) => (
            <details key={item.q} className="group rounded-xl border border-border bg-warm-white px-6 py-5">
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
          ))}
        </div>
      </Faixa>

      <section className="relative overflow-hidden bg-forest-700 py-24 md:py-28">
        <div className="container-content relative z-10 text-center">
          <Chapeu escuro className="mb-5">
            O convite
          </Chapeu>
          <h2 className="mx-auto max-w-2xl font-heading text-3xl text-warm-white md:text-4xl">
            Conte para a consultora quem é o seu grupo
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-white/75">
            O roteiro nasce daí — do que você quer que essa viagem desperte nas pessoas
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
        </div>
      </section>
    </>
  );
}
