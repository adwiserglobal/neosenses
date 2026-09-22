/**
 * Template `territorio` — B2B, o mais completo.
 *
 * É a estrutura dos três modelos da equipe, na ordem em que eles a usam:
 * capa → o que a proposta é → por que este território → a parceria →
 * os lugares → as vivências → para quem é → foto larga → perguntas →
 * o convite.
 *
 * As grades vêm nomeadas do banco (`experience_highlights.grupo`), então
 * uma página pode ter três delas e outra nenhuma sem que este arquivo
 * mude. O que este layout garante é o ritmo: nunca dois blocos escuros
 * seguidos, e uma faixa de foto sempre que a leitura passa de um assunto
 * para outro.
 */

import Link from "next/link";
import { Corpo, Capa, Faixa, FaixaFoto, Grade, Etapas, Perguntas, TituloDeSecao } from "./blocos";
import { Parceria, Fechamento, ConviteAoViajante } from "./funil";
import { linkWhatsApp } from "@/lib/utils";
import type { DadosDaPagina } from "./dados";

export function Territorio({ dados }: { dados: DadosDaPagina }) {
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
    etapas,
    perguntas,
    fechamento,
    mensagemWhatsApp,
  } = dados;

  // Alterna claro e escuro conforme as grades existirem: com uma grade só,
  // ela fica clara; com duas, a segunda escurece e vira capítulo.
  const fundoDaGrade = (indice: number) => (indice % 2 === 1 ? "noite" : "clara");

  return (
    <>
      <Capa
        chapeu={chapeu}
        titulo={titulo}
        resumo={resumo}
        imagem={capa}
        altura="cheia"
        acoes={
          <>
            <a
              href={linkWhatsApp(mensagemWhatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primario"
            >
              Quero levar meu grupo
            </a>
            <a href="#parceria" className="btn-secundario btn-secundario-claro">
              Conhecer a parceria
            </a>
          </>
        }
      />

      {descricao && (
        <Faixa fundo="areia" largura="content">
          <TituloDeSecao
            chapeu="A proposta"
            titulo="Mais do que uma viagem: uma jornada que você conduz"
          />
          <Corpo texto={descricao} className="mt-8" />
        </Faixa>
      )}

      {/* Primeira grade logo depois do texto de abertura: é onde o leitor
          decide se o território serve ao trabalho dele. */}
      {grades[0] && (
        <Faixa fundo={fundoDaGrade(0)}>
          <TituloDeSecao chapeu="Por que aqui" titulo={grades[0].titulo} fundo={fundoDaGrade(0)} />
          <div className="mt-12">
            <Grade itens={grades[0].itens} fundo={fundoDaGrade(0)} colunas={grades[0].itens.length > 6 ? 4 : 3} />
          </div>
        </Faixa>
      )}

      <FaixaFoto imagem={fotos[0]} altura="media" />

      <Parceria
        chapeu="Como funciona a parceria"
        titulo="Você conduz o grupo. A NeoSenses sustenta a jornada."
        texto="Criar uma experiência internacional exige curadoria, estrutura, parceiros locais, deslocamentos, hospedagem e ritmo — tudo em coerência com o propósito de quem conduz. É essa parte que a NeoSenses assume."
        facilitador={parceria.facilitador}
        neosenses={parceria.neosenses}
        fundo="areia"
      />

      {etapas.length > 0 && (
        <Faixa fundo="floresta">
          <TituloDeSecao
            chapeu="O território"
            titulo="Os lugares que podem compor o roteiro do seu grupo"
            texto="Cada um carrega a própria energia e o próprio convite. O roteiro final se desenha com você."
            fundo="floresta"
          />
          <div className="mt-12">
            <Etapas itens={etapas} fundo="floresta" />
          </div>
        </Faixa>
      )}

      {/* As grades restantes seguem alternando o fundo. */}
      {grades.slice(1).map((grade, i) => {
        const fundo = fundoDaGrade(i + 1);
        return (
          <Faixa key={grade.chave || i} fundo={fundo}>
            <TituloDeSecao titulo={grade.titulo} fundo={fundo} />
            <div className="mt-12">
              <Grade itens={grade.itens} fundo={fundo} colunas={grade.itens.length > 6 ? 4 : 3} />
            </div>
          </Faixa>
        );
      })}

      <FaixaFoto imagem={fotos[1]} altura="baixa" />

      {paraQuem && (
        <Faixa fundo="clara" largura="content">
          <TituloDeSecao chapeu="O convite" titulo="Para quem é esta parceria" />
          <Corpo texto={paraQuem} className="mt-8" />
        </Faixa>
      )}

      {perguntas.length > 0 && (
        <Faixa fundo="areia" largura="content">
          <TituloDeSecao chapeu="Perguntas frequentes" titulo="O essencial, em poucas respostas" />
          <div className="mt-10">
            <Perguntas itens={perguntas} fundo="areia" />
          </div>
        </Faixa>
      )}

      <ConviteAoViajante />

      <Fechamento
        chapeu="O convite"
        titulo={fechamento?.titulo}
        texto={fechamento?.texto}
        imagem={fotos[2] ?? capa}
        rotuloAcao="Falar com a consultora"
        mensagemWhatsApp={mensagemWhatsApp}
      />

      {/* Sem fechamento cadastrado a página terminaria no convite ao
          viajante, que fala com outra pessoa. Esta linha garante que quem
          conduz grupo sempre tenha a última porta. */}
      {!fechamento && (
        <Faixa fundo="noite" largura="content">
          <div className="text-center">
            <h2 className="font-heading text-3xl text-warm-white">
              Vamos desenhar essa jornada juntos
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={linkWhatsApp(mensagemWhatsApp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primario"
              >
                Falar com a consultora
              </a>
              <Link href="/contato" className="btn-secundario btn-secundario-claro">
                Enviar uma mensagem
              </Link>
            </div>
          </div>
        </Faixa>
      )}
    </>
  );
}
