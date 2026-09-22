/**
 * Escolhe o layout da página pelo campo `template` do banco.
 *
 * Os quatro nomes descrevem a ESTRUTURA do conteúdo, não a aparência —
 * é o que a migration 015 registrou e o que faz o campo continuar dizendo
 * quando usar cada um depois da próxima troca de paleta:
 *
 *   classico    B2C, jornada curta: coluna de conteúdo + lateral de reserva
 *   roteiro     B2C, jornada longa: o dia a dia é o eixo
 *   territorio  B2B completo: territórios, vivências e a parceria
 *   convite     B2B enxuto: imagem grande, texto curto, conversa
 *
 * Um valor inesperado cai no clássico (ver `layoutDe`): o enum do banco já
 * impede lixo, mas um template novo publicado antes do deploy do layout
 * deve mostrar a página velha, não uma tela em branco.
 */

import { Classico, type PropsB2C } from "./Classico";
import { Roteiro } from "./Roteiro";
import { Territorio } from "./Territorio";
import { Convite } from "./Convite";
import { layoutDe } from "./dados";

export { montarDados, fotosDaExperiencia, layoutDe } from "./dados";
export type { DadosDaPagina } from "./dados";

export function PaginaDaExperiencia(props: PropsB2C) {
  const layout = layoutDe(props.experiencia);

  switch (layout) {
    case "territorio":
      return <Territorio dados={props.dados} />;
    case "convite":
      return <Convite dados={props.dados} />;
    case "roteiro":
      return <Roteiro {...props} />;
    default:
      return <Classico {...props} />;
  }
}
