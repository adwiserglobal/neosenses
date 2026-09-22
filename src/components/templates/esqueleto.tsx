/**
 * As oito seções obrigatórias de toda página de roteiro ou retiro.
 *
 * Vêm do passo 5 do documento "Reformulação do Site NeoSenses", que fixa a
 * ordem — e a ordem é o argumento de venda, não uma preferência de layout:
 *
 *   1. Título, subtítulo e período      quem é, e quando
 *   2. Introdução                        o que é isso, em uma respirada
 *   3. Por que criamos                   a intenção por trás
 *   4. O que é                           o destino, a energia, o formato
 *   5. Por que participar                o que a pessoa leva de volta
 *   6. A jornada                         o dia a dia, em sanfona
 *   7. Apenas relaxe                     as objeções, respondidas
 *   8. Quem conduz                       quem estará junto
 *
 * `classico` e `roteiro` montam as mesmas oito; o que muda entre eles é a
 * largura e onde entra a coluna de reserva. Por isso elas moram aqui e não
 * dentro de cada template: duas cópias divergem na primeira correção.
 *
 * Seção sem conteúdo cadastrado não é desenhada. Nenhuma delas inventa
 * texto de preenchimento — é a mesma regra do Concierge.
 */

import { Corpo, EtapasSanfona, Faixa, Grade, Perguntas, QuemConduz, TituloDeSecao, type Fundo } from "./blocos";
import type { DadosDaPagina } from "./dados";

/** Seção 2 — a visão geral, logo abaixo do topo. */
export function Introducao({ dados, fundo = "areia" }: { dados: DadosDaPagina; fundo?: Fundo }) {
  // O resumo já aparece na capa. Repeti-lo aqui seria eco; esta seção só
  // existe quando há um texto de abertura próprio.
  if (!dados.descricao) return null;
  return (
    <Faixa fundo={fundo} largura="content" id="sobre">
      <TituloDeSecao
        chapeu={dados.ehFacilitador ? "A proposta" : "A jornada"}
        titulo={`Sobre ${dados.titulo}`}
      />
      <Corpo texto={dados.descricao} fundo={fundo} className="mt-8" />
    </Faixa>
  );
}

/** Seção 3 — por que esta experiência existe. */
export function PorQueCriamos({ dados, fundo = "clara" }: { dados: DadosDaPagina; fundo?: Fundo }) {
  if (!dados.porQueCriamos) return null;
  return (
    <Faixa fundo={fundo} largura="content">
      <TituloDeSecao
        chapeu="A intenção"
        titulo="Por que criamos esta jornada"
        fundo={fundo}
      />
      <Corpo texto={dados.porQueCriamos} fundo={fundo} className="mt-8" />
    </Faixa>
  );
}

/**
 * Seção 5 — a proposta de valor.
 *
 * O texto abre e a grade lista. Quando existe uma grade nomeada `valor`,
 * ela é usada; senão, a primeira grade cadastrada serve — é o que as
 * experiências migradas têm.
 */
export function PorQueParticipar({
  dados,
  fundo = "noite",
}: {
  dados: DadosDaPagina;
  fundo?: Fundo;
}) {
  const grade = dados.grades.find((g) => g.chave === "valor") ?? dados.grades[0];
  if (!dados.propostaDeValor && !grade) return null;

  return (
    <Faixa fundo={fundo}>
      <TituloDeSecao
        chapeu="O que você leva"
        titulo="Por que participar desta jornada"
        texto={dados.propostaDeValor || undefined}
        fundo={fundo}
      />
      {grade && (
        <div className="mt-12">
          <Grade
            itens={grade.itens}
            fundo={fundo}
            colunas={grade.itens.length > 6 ? 4 : 3}
          />
        </div>
      )}
    </Faixa>
  );
}

/** Seção 6 — o dia a dia, em sanfona para não alongar a rolagem no celular. */
export function AJornada({ dados, fundo = "areia" }: { dados: DadosDaPagina; fundo?: Fundo }) {
  if (dados.etapas.length === 0) return null;

  const dias = dados.etapas.length;
  return (
    <Faixa fundo={fundo} id="roteiro" largura="content">
      <TituloDeSecao
        chapeu="A jornada"
        titulo="O que você vai vivenciar"
        texto={
          dados.ehFacilitador
            ? "Um caminho possível — o roteiro final se desenha com você, a partir do propósito do grupo."
            : `${dias} ${dias === 1 ? "etapa" : "etapas"}. Toque em cada uma para ver o que acontece.`
        }
        fundo={fundo}
      />
      <div className="mt-10">
        <EtapasSanfona itens={dados.etapas} fundo={fundo} />
      </div>
    </Faixa>
  );
}

/**
 * Seção 7 — "Apenas Relaxe".
 *
 * Quebra de objeção: "preciso ter experiência em meditação?", "e se eu for
 * sozinha?", "como funciona a logística?". O texto tranquiliza e as
 * perguntas cadastradas respondem uma a uma.
 *
 * Sem texto e sem pergunta, a seção some — um bloco chamado "Apenas
 * Relaxe" vazio é o oposto do que ele se propõe.
 */
export function ApenasRelaxe({ dados, fundo = "clara" }: { dados: DadosDaPagina; fundo?: Fundo }) {
  if (!dados.apenasRelaxe && dados.perguntas.length === 0) return null;

  return (
    <Faixa fundo={fundo} largura="content" id="duvidas">
      <TituloDeSecao
        chapeu="Sem preocupação"
        titulo="Apenas relaxe"
        texto={dados.apenasRelaxe || undefined}
        fundo={fundo}
      />
      {dados.perguntas.length > 0 && (
        <div className="mt-10">
          <Perguntas itens={dados.perguntas} fundo={fundo} />
        </div>
      )}
    </Faixa>
  );
}

/** Seção 8 — a equipe, separada por papel. */
export function Equipe({ dados, fundo = "areia" }: { dados: DadosDaPagina; fundo?: Fundo }) {
  if (dados.equipe.length === 0) return null;

  return (
    <Faixa fundo={fundo} largura="content">
      <TituloDeSecao chapeu="A equipe" titulo="Quem conduz a sua jornada" fundo={fundo} />
      <div className="mt-10">
        <QuemConduz pessoas={dados.equipe} fundo={fundo} />
      </div>
    </Faixa>
  );
}
