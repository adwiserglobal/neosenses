/**
 * Termos de Uso.
 *
 * Os dados da empresa vêm de `settings`, preenchidos em /admin/configuracoes, e
 * cada linha some quando o valor não existe: documento de contrato não leva
 * número de exemplo (antes exibia "CNPJ: XX.XXX.XXX/0001-XX" fixo).
 *
 * O texto das cláusulas é o da NeoSenses, sem alteração; esta página cuida da
 * apresentação (índice, numeração, contato).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { lerConfiguracoesPublicas } from "@/lib/dal/content";
import {
  DocumentoLegal,
  Lista,
  Texto,
  lerDadosDaEmpresa,
  type SecaoLegal,
} from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso do site da NeoSenses e das experiências de viagem transformadora.",
  alternates: { canonical: "/legal/termos" },
};

export const revalidate = 3600;

export default async function TermosPage() {
  const empresa = lerDadosDaEmpresa(await lerConfiguracoesPublicas());

  const secoes: SecaoLegal[] = [
    {
      id: "aceitacao",
      titulo: "Aceitação dos Termos",
      conteudo: (
        <Texto>
          Ao acessar e utilizar o site da NeoSenses, você concorda com estes termos de uso. Caso não
          concorde com algum dos termos, solicitamos que não utilize nosso site.
        </Texto>
      ),
    },
    {
      id: "servicos",
      titulo: "Serviços",
      conteudo: (
        <Texto>
          A NeoSenses oferece experiências de viagem transformadora, incluindo retiros, jornadas
          espirituais, peregrinações e imersões. Todos os roteiros estão sujeitos à disponibilidade
          e condições específicas de cada experiência.
        </Texto>
      ),
    },
    {
      id: "reservas",
      titulo: "Reservas e Pagamentos",
      conteudo: (
        <Texto>
          As reservas são confirmadas mediante pagamento de sinal conforme condições de cada
          experiência. O valor total, condições de parcelamento e política de cancelamento são
          informados antes da confirmação da reserva.
        </Texto>
      ),
    },
    {
      id: "cancelamento",
      titulo: "Cancelamento",
      conteudo: (
        <>
          <Texto>Regra geral de reembolso, pela antecedência do cancelamento:</Texto>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { quando: "Mais de 60 dias", regra: "Reembolso integral" },
              { quando: "Entre 30 e 60 dias", regra: "Reembolso de 50%" },
              { quando: "Menos de 30 dias", regra: "Valor pode ser convertido em crédito para outra experiência" },
            ].map((faixa) => (
              <div key={faixa.quando} className="rounded-xl border border-secondary-300/50 bg-[#fffaf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-600">{faixa.quando}</p>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">{faixa.regra}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "responsabilidade",
      titulo: "Responsabilidade",
      conteudo: (
        <Texto>
          A NeoSenses se compromete a oferecer experiências seguras e de alta qualidade. No entanto,
          não nos responsabilizamos por eventos de força maior, condições climáticas ou decisões
          pessoais dos participantes durante as experiências.
        </Texto>
      ),
    },
    {
      id: "inteligencia-artificial",
      titulo: "Concierge e roteiros gerados por IA",
      conteudo: (
        <>
          <Texto>
            O Concierge e o montador de roteiro usam inteligência artificial para orientar sua
            escolha. As respostas são sugestões e podem conter imprecisões: não constituem oferta,
            promessa de vaga, preço ou condição.
          </Texto>
          <Lista
            itens={[
              "Datas, valores, disponibilidade e regras valem somente quando confirmados pela equipe da NeoSenses.",
              "Trechos de um roteiro gerado que não correspondem a uma jornada do nosso catálogo são sugestões livres, a combinar.",
              "Quando houver divergência entre uma resposta da IA e a página oficial da jornada ou a confirmação da equipe, valem estas últimas.",
            ]}
          />
        </>
      ),
    },
    {
      id: "privacidade",
      titulo: "Dados pessoais",
      conteudo: (
        <Texto>
          O tratamento dos seus dados pessoais é explicado na{" "}
          <Link href="/legal/privacidade" className="font-medium text-primary-700 underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </Texto>
      ),
    },
    {
      id: "alteracoes",
      titulo: "Mudanças nestes termos",
      conteudo: (
        <Texto>
          Podemos atualizar estes termos quando o site, os serviços ou a lei mudarem. A data da
          última atualização fica sempre no topo da página.
        </Texto>
      ),
    },
  ];

  return (
    <DocumentoLegal
      icone="termos"
      titulo="Termos de Uso"
      introducao="As regras de uso do site e das experiências da NeoSenses, escritas para você ler com calma antes de reservar."
      atualizadoEm="Outubro de 2026"
      destaque={{
        titulo: "Em poucas palavras",
        itens: [
          "A reserva é confirmada com o pagamento do sinal, conforme cada jornada.",
          "Reembolso integral em cancelamentos com mais de 60 dias de antecedência.",
          "Respostas da IA são sugestões: valem as confirmações da equipe.",
          "Qualquer dúvida, fale com a gente antes de decidir.",
        ],
      }}
      secoes={secoes}
      empresa={empresa}
      outro={{ href: "/legal/privacidade", rotulo: "Política de Privacidade" }}
    />
  );
}
