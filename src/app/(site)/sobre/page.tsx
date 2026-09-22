/**
 * Sobre Nós.
 *
 * O texto é o do passo 4 do documento de reformulação, palavra por palavra.
 * Ele foi escrito para falar com os dois públicos ao mesmo tempo — quem vai
 * viajar e quem vai levar o próprio grupo —, e o que estava aqui antes era
 * genérico o bastante para servir a qualquer agência de viagem.
 *
 * A seção "Nossa História" saiu. Ela dizia "a NeoSenses nasceu de um desejo
 * profundo" sem citar quando, quem ou de onde: história sem fato é texto de
 * preenchimento, e ocupava o lugar do que a empresa realmente afirma sobre
 * si. Volta quando houver o ano de fundação e os nomes.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Capa, Corpo, Faixa, Grade, TituloDeSecao } from "@/components/templates/blocos";
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

const TEXTO = `Na NeoSenses, acreditamos que viajar é muito mais do que mudar de endereço geográfico: é uma oportunidade de um mergulho interno. Nascemos com a missão de criar e operar viagens, retiros e imersões de autoconhecimento que resgatam nossa verdadeira essência — a Essência do Amor.

Unimos a profundidade de práticas ancestrais, espiritualidade e autodesenvolvimento à excelência e segurança da operação turística. Cada itinerário é desenhado não apenas pelo apelo turístico, mas pelo seu campo energético e poder de transformação.

Seja conduzindo participantes em busca de sentido ou apoiando terapeutas e facilitadores na realização dos seus próprios projetos pelo mundo, a NeoSenses é a ponte entre o visível e o invisível, cuidando de cada detalhe com carinho, responsabilidade e presença.`;

const VALORES = [
  {
    id: "proposito",
    titulo: "Propósito",
    descricao: "Cada viagem tem uma intenção. Viajamos para evoluir, não apenas para conhecer.",
  },
  {
    id: "autenticidade",
    titulo: "Autenticidade",
    descricao:
      "Experiências genuínas com comunidades locais e práticas espirituais verdadeiras.",
  },
  {
    id: "excelencia",
    titulo: "Excelência",
    descricao: "Do planejamento à execução, cada detalhe é pensado para superar expectativas.",
  },
  {
    id: "transformacao",
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
        imagem="/images/b2b/peru-lagoa-sagrada.jpg"
        alinhamento="centro"
      />

      <Faixa fundo="areia" largura="content">
        <Corpo texto={TEXTO} />
      </Faixa>

      <Faixa fundo="clara">
        <TituloDeSecao chapeu="O que nos guia" titulo="Nossos valores" fundo="clara" centro />
        <div className="mt-12">
          <Grade itens={VALORES} fundo="clara" colunas={4} />
        </div>
      </Faixa>

      <ConviteAoFacilitador />

      <Faixa fundo="areia" largura="content">
        <div className="mx-auto max-w-2xl text-center">
          <TituloDeSecao chapeu="Onde estamos" titulo="Fale com a NeoSenses" centro />

          <div className="mt-8 space-y-2 text-text-muted">
            <p className="text-lg font-medium text-primary-700">NeoSenses</p>
            <p>Rua Alegre, 928 – Santa Paula</p>
            <p>São Caetano do Sul – SP, 09550-250</p>
            <p className="pt-2">
              <a
                href="mailto:contato@neosenses.com.br"
                className="text-secondary-500 underline underline-offset-4"
              >
                contato@neosenses.com.br
              </a>
            </p>
            <p>+55 11 94718-8319</p>
            <p className="pt-2 text-sm">Segunda a Sábado, 9:00 – 18:00</p>
            {/* Sai do banco: um CNPJ escrito no JSX envelhece sem ninguém
                notar, e este é o dado que identifica a parte no contrato. */}
            {cnpj && <p className="pt-2 text-sm">CNPJ {cnpj}</p>}
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
