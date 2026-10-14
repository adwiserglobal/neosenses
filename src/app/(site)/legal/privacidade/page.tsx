/**
 * Política de Privacidade.
 *
 * O texto descreve o que o site de fato faz hoje (formulários, newsletter,
 * Concierge de IA, montador de roteiro, e-mail transacional). Se uma dessas
 * peças mudar, o documento muda junto.
 */

import type { Metadata } from "next";
import { lerConfiguracoesPublicas } from "@/lib/dal/content";
import {
  DocumentoLegal,
  Lista,
  Texto,
  lerDadosDaEmpresa,
  type SecaoLegal,
} from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a NeoSenses coleta, usa e protege seus dados pessoais, e como você exerce seus direitos pela LGPD.",
  alternates: { canonical: "/legal/privacidade" },
};

export const revalidate = 3600;

export default async function PrivacidadePage() {
  const empresa = lerDadosDaEmpresa(await lerConfiguracoesPublicas());
  const email = empresa.email || "contato@neosenses.com.br";

  const secoes: SecaoLegal[] = [
    {
      id: "responsavel",
      titulo: "Quem é responsável pelos seus dados",
      conteudo: (
        <>
          <Texto>
            A NeoSenses é a responsável pelo tratamento dos dados pessoais coletados neste site,
            nos termos da Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018). Os dados de
            contato da empresa estão no fim desta página.
          </Texto>
        </>
      ),
    },
    {
      id: "dados-coletados",
      titulo: "Quais dados coletamos e quando",
      conteudo: (
        <>
          <Texto>Só coletamos o que você nos entrega ao usar uma parte do site:</Texto>
          <Lista
            itens={[
              <><strong className="font-medium text-primary-700">Formulários de contato e de interesse em uma jornada:</strong> nome, e-mail, telefone, país, destino e mês desejados, número de viajantes e a mensagem que você escrever.</>,
              <><strong className="font-medium text-primary-700">Newsletter:</strong> seu e-mail e, se informar, seu nome.</>,
              <><strong className="font-medium text-primary-700">Concierge (chat com IA):</strong> as mensagens que você troca com ele e, se você decidir deixar, seus dados de contato.</>,
              <><strong className="font-medium text-primary-700">Montador de roteiro:</strong> as respostas do questionário e o roteiro gerado, que fica disponível por um endereço pessoal.</>,
              <><strong className="font-medium text-primary-700">WhatsApp:</strong> a conversa acontece na plataforma do WhatsApp, fora do nosso site, e segue as regras dela.</>,
              <><strong className="font-medium text-primary-700">Dados técnicos:</strong> usamos temporariamente o endereço IP para limitar envios abusivos e proteger os formulários e o chat.</>,
            ]}
          />
        </>
      ),
    },
    {
      id: "finalidades",
      titulo: "Para que usamos os dados",
      conteudo: (
        <Lista
          itens={[
            "Responder suas dúvidas e pedidos de contato.",
            "Apresentar jornadas, datas e condições que combinem com o que você procura.",
            "Enviar novidades, somente a quem se inscreveu na newsletter.",
            "Montar roteiros e atender você pelo Concierge.",
            "Melhorar o site, o Concierge e o atendimento.",
            "Proteger o site contra spam, abuso e uso indevido.",
            "Cumprir obrigações legais e, quando você contratar uma jornada, executar o serviço.",
          ]}
        />
      ),
    },
    {
      id: "inteligencia-artificial",
      titulo: "Concierge e roteiros com inteligência artificial",
      conteudo: (
        <>
          <Texto>
            O Concierge e o montador de roteiro usam inteligência artificial. Para gerar cada
            resposta, o texto que você digita é enviado a um provedor de IA contratado pela
            NeoSenses, que o processa para nos devolver a resposta.
          </Texto>
          <Texto>
            Por isso, <strong className="font-medium text-primary-700">não informe no chat dados sensíveis</strong>{" "}
            (como documentos, dados de cartão, senhas ou informações detalhadas de saúde). Para
            esses assuntos, fale com a nossa equipe pelo WhatsApp ou por e-mail.
          </Texto>
          <Texto>
            As respostas da IA são sugestões e podem conter imprecisões. Datas, valores e condições
            valem somente depois de confirmados pela equipe.
          </Texto>
        </>
      ),
    },
    {
      id: "compartilhamento",
      titulo: "Com quem compartilhamos",
      conteudo: (
        <>
          <Texto>Não vendemos seus dados e não os compartilhamos para fins de marketing de terceiros. Eles podem ser tratados por:</Texto>
          <Lista
            itens={[
              "Empresas que nos prestam serviço de tecnologia: hospedagem do site, banco de dados em nuvem, envio de e-mails e provedores de IA.",
              "Parceiros operacionais da jornada (hotéis, guias e condutores locais), apenas o necessário para executar o serviço que você contratou.",
              "Autoridades, quando a lei exigir.",
            ]}
          />
        </>
      ),
    },
    {
      id: "cookies",
      titulo: "Cookies",
      conteudo: (
        <Texto>
          O site usa apenas cookies essenciais ao seu funcionamento, como o de sessão da área
          restrita da equipe. No momento, não usamos cookies de publicidade nem ferramentas de
          análise de terceiros. Se isso mudar, atualizaremos esta política e pediremos seu
          consentimento quando a lei exigir.
        </Texto>
      ),
    },
    {
      id: "retencao",
      titulo: "Por quanto tempo guardamos",
      conteudo: (
        <Texto>
          Guardamos os dados pelo tempo necessário para cumprir as finalidades descritas acima e as
          obrigações legais. Você pode pedir a exclusão de seus dados a qualquer momento (veja
          “Seus direitos”), e atenderemos ao pedido, salvo quando a lei nos obrigar a manter
          alguma informação.
        </Texto>
      ),
    },
    {
      id: "direitos",
      titulo: "Seus direitos (LGPD)",
      conteudo: (
        <>
          <Texto>Você pode, a qualquer momento, pedir:</Texto>
          <Lista
            itens={[
              "A confirmação de que tratamos seus dados e o acesso a eles.",
              "A correção de dados incompletos, inexatos ou desatualizados.",
              "A anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desacordo com a lei.",
              "A portabilidade dos dados a outro fornecedor.",
              "A eliminação dos dados tratados com base no seu consentimento.",
              "Informações sobre com quem compartilhamos seus dados.",
              "A revogação do consentimento, inclusive para sair da newsletter.",
            ]}
          />
          <Texto>
            Para exercer qualquer direito, escreva para{" "}
            <a href={`mailto:${email}`} className="font-medium text-primary-700 underline underline-offset-4">
              {email}
            </a>
            . Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
          </Texto>
        </>
      ),
    },
    {
      id: "seguranca",
      titulo: "Como protegemos seus dados",
      conteudo: (
        <Texto>
          A comunicação com o site é criptografada (HTTPS), o acesso às informações pelo painel da
          equipe exige login e é limitado por perfil, e os dados ficam em um banco em nuvem com
          controle de acesso. Nenhum sistema é totalmente imune a falhas, mas trabalhamos para
          reduzir os riscos e, se houver um incidente relevante, avisaremos as pessoas afetadas e a
          ANPD, como manda a lei.
        </Texto>
      ),
    },
    {
      id: "alteracoes",
      titulo: "Mudanças nesta política",
      conteudo: (
        <Texto>
          Podemos atualizar este texto quando o site ou a lei mudarem. A data da última atualização
          fica sempre no topo da página.
        </Texto>
      ),
    },
  ];

  return (
    <DocumentoLegal
      icone="privacidade"
      titulo="Política de Privacidade"
      introducao="Cuidamos dos seus dados com o mesmo respeito com que cuidamos da sua jornada. Aqui está, sem rodeios, o que coletamos, por quê e como você controla."
      atualizadoEm="Outubro de 2026"
      destaque={{
        titulo: "Em poucas palavras",
        itens: [
          "Coletamos só o que você nos entrega em formulários, na newsletter e nos chats.",
          "Não vendemos seus dados.",
          "O Concierge usa IA: evite escrever dados sensíveis nele.",
          "Você pode pedir acesso, correção ou exclusão quando quiser.",
        ],
      }}
      secoes={secoes}
      empresa={empresa}
      outro={{ href: "/legal/termos", rotulo: "Termos de Uso" }}
    />
  );
}
