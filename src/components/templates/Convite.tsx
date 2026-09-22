/**
 * Template `convite` — B2B enxuto.
 *
 * A migration 015 o descreve como "imagem grande, texto curto, conversa
 * com consultora". É o layout para quando o conteúdo ainda é pouco: uma
 * proposta que existe, um território que a equipe quer oferecer, e nenhum
 * roteiro fechado para publicar.
 *
 * A diferença para o `territorio` não é de estilo — é de quantidade. Aqui
 * a imagem ocupa a tela inteira, o texto cabe numa leitura, e a página
 * inteira empurra para a mesma ação. Usar o layout completo com pouco
 * conteúdo produz a impressão contrária: uma página cheia de seções curtas
 * parece um site em construção.
 */

import { Corpo, Capa, Faixa, FaixaFoto, Grade, Perguntas, TituloDeSecao, Citacao } from "./blocos";
import { Parceria, Fechamento } from "./funil";
import { linkWhatsApp } from "@/lib/utils";
import type { DadosDaPagina } from "./dados";

export function Convite({ dados }: { dados: DadosDaPagina }) {
  const {
    titulo,
    resumo,
    descricao,
    paraQuem,
    chapeu,
    capa,
    fotos,
    parceria,
    grades,
    perguntas,
    fechamento,
    mensagemWhatsApp,
  } = dados;

  // Uma grade só, e das curtas: o layout perde a razão de ser se virar
  // catálogo. O que sobra continua no banco e aparece quando a página
  // migrar para `territorio`.
  const grade = grades[0];

  return (
    <>
      <Capa
        chapeu={chapeu}
        titulo={titulo}
        resumo={resumo}
        imagem={capa}
        altura="cheia"
        alinhamento="centro"
        acoes={
          <a
            href={linkWhatsApp(mensagemWhatsApp)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario"
          >
            Conversar sobre esta jornada
          </a>
        }
      />

      {descricao && (
        <Faixa fundo="areia" largura="content">
          <Corpo texto={descricao} className="mx-auto" />
          <Citacao>
            Você traz o seu grupo e a sua medicina. A NeoSenses cria o caminho.
          </Citacao>
        </Faixa>
      )}

      <FaixaFoto imagem={fotos[0]} altura="alta" />

      <Parceria
        chapeu="A parceria"
        titulo="Você conduz o grupo. A NeoSenses sustenta a jornada."
        facilitador={parceria.facilitador}
        neosenses={parceria.neosenses}
        fundo="clara"
      />

      {grade && (
        <Faixa fundo="noite">
          <TituloDeSecao titulo={grade.titulo} fundo="noite" centro />
          <div className="mt-12">
            <Grade itens={grade.itens.slice(0, 6)} fundo="noite" colunas={3} />
          </div>
        </Faixa>
      )}

      {paraQuem && (
        <Faixa fundo="areia" largura="content">
          <TituloDeSecao chapeu="Para quem é" titulo="Se isso ressoa com o seu trabalho" />
          <Corpo texto={paraQuem} className="mt-8" />
        </Faixa>
      )}

      {perguntas.length > 0 && (
        <Faixa fundo="clara" largura="content">
          <TituloDeSecao chapeu="Perguntas frequentes" titulo="O essencial, em poucas respostas" />
          <div className="mt-10">
            <Perguntas itens={perguntas} fundo="clara" />
          </div>
        </Faixa>
      )}

      <Fechamento
        chapeu="O convite"
        titulo={fechamento?.titulo ?? `${titulo} pode ser a próxima jornada do seu grupo`}
        texto={
          fechamento?.texto ??
          "Conte para a consultora quem é o seu grupo e o que você quer que essa viagem desperte. O roteiro nasce daí."
        }
        imagem={fotos[1] ?? capa}
        rotuloAcao="Falar com a consultora"
        mensagemWhatsApp={mensagemWhatsApp}
      />
    </>
  );
}
