/**
 * As perguntas do Journey Builder.
 *
 * Ficam aqui, como dado, e não espalhadas pelo formulário: o servidor precisa
 * validar as respostas contra a mesma lista que o navegador exibiu, e o
 * gerador precisa saber o que cada resposta significa. Duas cópias divergem.
 *
 * ── Por que estas perguntas ──────────────────────────────────────────────
 *
 * "Quantos dias e quais interesses" é o que toda agência pergunta, e produz
 * exatamente o roteiro que toda agência entrega. Para uma jornada que se
 * propõe transformadora, três coisas mudam a recomendação de verdade e quase
 * nunca são perguntadas:
 *
 *   1. O que trouxe a pessoa até aqui. Quem busca uma pausa e quem atravessa
 *      um luto pedem coisas diferentes do mesmo destino.
 *   2. Como ela quer se sentir na volta. É o critério de sucesso da viagem,
 *      e sem ele o roteiro vira lista de atrações.
 *   3. O que ela NÃO quer. Evita a recomendação que parece perfeita no papel
 *      e é justamente o que a pessoa foi fugir.
 *
 * O peso disso aparece no prompt: intenção e sentimento desejado orientam a
 * narrativa; ritmo, companhia e limites filtram o que é viável.
 *
 * Só três perguntas são obrigatórias. O resto enriquece — questionário longo
 * e obrigatório é questionário abandonado no meio.
 */

export type TipoPergunta = "escolha_unica" | "escolha_multipla" | "texto";

export interface Opcao {
  valor: string;
  rotulo: string;
  /** Ajuda a pessoa a se reconhecer na opção sem ter que interpretar. */
  detalhe?: string;
}

export interface Pergunta {
  id: string;
  tipo: TipoPergunta;
  titulo: string;
  /** Aparece abaixo do título, explicando por que se pergunta isso. */
  ajuda?: string;
  obrigatoria: boolean;
  opcoes?: Opcao[];
  /** Para escolha_multipla: teto de seleções. */
  maximo?: number;
  placeholder?: string;
  maxCaracteres?: number;
}

export interface Passo {
  id: string;
  titulo: string;
  subtitulo: string;
  perguntas: Pergunta[];
}

export const PASSOS: Passo[] = [
  {
    id: "tempo",
    titulo: "O tempo que você tem",
    subtitulo: "Começando pelo que é concreto.",
    perguntas: [
      {
        id: "dias",
        tipo: "escolha_unica",
        titulo: "Quantos dias você consegue se ausentar?",
        ajuda: "Contando ida e volta. Se ainda estiver em aberto, tudo bem dizer.",
        obrigatoria: true,
        opcoes: [
          { valor: "ate_7", rotulo: "Até 7 dias", detalhe: "uma semana ou menos" },
          { valor: "8_a_12", rotulo: "8 a 12 dias", detalhe: "o formato mais comum" },
          { valor: "13_a_18", rotulo: "13 a 18 dias", detalhe: "dá para ir mais fundo" },
          { valor: "mais_18", rotulo: "Mais de 18 dias", detalhe: "sem pressa" },
          { valor: "flexivel", rotulo: "Ainda não sei", detalhe: "me mostre o que existe" },
        ],
      },
      {
        id: "periodo",
        tipo: "escolha_unica",
        titulo: "Quando pretende viajar?",
        ajuda: "O período muda o clima no destino e o que está aberto.",
        obrigatoria: false,
        opcoes: [
          { valor: "3_meses", rotulo: "Nos próximos 3 meses" },
          { valor: "6_meses", rotulo: "Em 3 a 6 meses" },
          { valor: "12_meses", rotulo: "Ainda este ano" },
          { valor: "sem_pressa", rotulo: "Sem data definida" },
          { valor: "depende", rotulo: "Depende da experiência", detalhe: "me organizo pela data certa" },
        ],
      },
    ],
  },

  {
    id: "intencao",
    titulo: "O que te move agora",
    subtitulo: "Esta é a parte que mais muda o que vamos sugerir.",
    perguntas: [
      {
        id: "motivo",
        tipo: "escolha_unica",
        titulo: "O que te trouxe até aqui?",
        ajuda: "Não existe resposta certa. Escolha a que estiver mais perto.",
        obrigatoria: true,
        opcoes: [
          { valor: "pausa", rotulo: "Preciso de uma pausa", detalhe: "cansaço, excesso, ritmo insustentável" },
          { valor: "transicao", rotulo: "Estou num momento de virada", detalhe: "carreira, relação, fase da vida" },
          { valor: "aprofundar", rotulo: "Quero aprofundar minha prática", detalhe: "já medito, quero mais" },
          { valor: "reconexao", rotulo: "Quero me reencontrar", detalhe: "sensação de estar longe de si" },
          { valor: "luto", rotulo: "Estou atravessando uma perda", detalhe: "elaboração, despedida" },
          { valor: "celebracao", rotulo: "Tenho algo a celebrar", detalhe: "conquista, marco, recomeço" },
          { valor: "curiosidade", rotulo: "Curiosidade genuína", detalhe: "quero conhecer, sem grande motivo" },
        ],
      },
      {
        id: "sentimento",
        tipo: "escolha_multipla",
        titulo: "Como você quer se sentir na volta?",
        ajuda: "Escolha até duas. É por aqui que medimos se a viagem deu certo.",
        obrigatoria: false,
        maximo: 2,
        opcoes: [
          { valor: "descansado", rotulo: "Descansado de verdade" },
          { valor: "clareza", rotulo: "Com clareza sobre os próximos passos" },
          { valor: "leve", rotulo: "Mais leve" },
          { valor: "forte", rotulo: "Mais forte" },
          { valor: "conectado", rotulo: "Conectado a algo maior" },
          { valor: "inspirado", rotulo: "Inspirado, com vontade de criar" },
          { valor: "acompanhado", rotulo: "Com pessoas novas na minha vida" },
        ],
      },
    ],
  },

  {
    id: "caminho",
    titulo: "O caminho",
    subtitulo: "O que te atrai e em que ritmo.",
    perguntas: [
      {
        id: "interesses",
        tipo: "escolha_multipla",
        titulo: "O que mais te atrai numa viagem assim?",
        ajuda: "Escolha até quatro.",
        obrigatoria: true,
        maximo: 4,
        opcoes: [
          { valor: "natureza", rotulo: "Natureza e paisagem" },
          { valor: "meditacao", rotulo: "Meditação e silêncio" },
          { valor: "cultura_local", rotulo: "Cultura e tradição local" },
          { valor: "cerimonias", rotulo: "Cerimônias e rituais" },
          { valor: "movimento", rotulo: "Movimento do corpo", detalhe: "trilha, yoga, dança" },
          { valor: "arte", rotulo: "Arte e artesanato" },
          { valor: "gastronomia", rotulo: "Comida e sabores" },
          { valor: "historia", rotulo: "História e sítios sagrados" },
          { valor: "comunidade", rotulo: "Convivência com o grupo" },
        ],
      },
      {
        id: "ritmo",
        tipo: "escolha_unica",
        titulo: "Que ritmo combina com você?",
        obrigatoria: false,
        opcoes: [
          {
            valor: "contemplativo",
            rotulo: "Contemplativo",
            detalhe: "poucos deslocamentos, tempo para ficar",
          },
          { valor: "equilibrado", rotulo: "Equilibrado", detalhe: "alterna passeio e descanso" },
          { valor: "ativo", rotulo: "Ativo", detalhe: "caminhadas, muitos lugares, dias cheios" },
        ],
      },
    ],
  },

  {
    id: "pratico",
    titulo: "O que precisamos saber",
    subtitulo: "Para não sugerir algo que não serve para você.",
    perguntas: [
      {
        id: "companhia",
        tipo: "escolha_unica",
        titulo: "Com quem você pretende ir?",
        obrigatoria: false,
        opcoes: [
          { valor: "sozinho", rotulo: "Sozinho", detalhe: "é como boa parte do grupo vai" },
          { valor: "casal", rotulo: "Com meu par" },
          { valor: "amigos", rotulo: "Com amigos" },
          { valor: "familia", rotulo: "Em família" },
        ],
      },
      {
        id: "experiencia_grupo",
        tipo: "escolha_unica",
        titulo: "Já viajou em grupo antes?",
        ajuda: "Se for a primeira vez, incluímos no roteiro o que costuma ajudar.",
        obrigatoria: false,
        opcoes: [
          { valor: "primeira_vez", rotulo: "Será a primeira vez" },
          { valor: "algumas", rotulo: "Já fui algumas vezes" },
          { valor: "prefiro", rotulo: "É como prefiro viajar" },
        ],
      },
      {
        id: "restricoes",
        tipo: "texto",
        titulo: "Alguma coisa que devemos considerar?",
        ajuda:
          "Alimentação, saúde, mobilidade, medo de avião ou de altura, ritmo mais lento. Quanto antes soubermos, mais dá para acomodar.",
        obrigatoria: false,
        placeholder: "Ex.: sou vegetariana e tenho receio de altitude",
        maxCaracteres: 400,
      },
      {
        // A pergunta que quase ninguém faz, e que evita a recomendação
        // impecável no papel e errada para a pessoa.
        id: "evitar",
        tipo: "texto",
        titulo: "E o que você não quer nesta viagem?",
        ajuda: "Vale tudo: multidão, madrugada, frio, religião, agenda cheia, ficar sozinha.",
        obrigatoria: false,
        placeholder: "Ex.: não quero acordar de madrugada nem lugar cheio de turista",
        maxCaracteres: 400,
      },
      {
        id: "investimento",
        tipo: "escolha_unica",
        titulo: "Faixa de investimento por pessoa",
        ajuda: "Só para sugerir o que cabe. Fica entre nós.",
        obrigatoria: false,
        opcoes: [
          { valor: "ate_15", rotulo: "Até R$ 15 mil" },
          { valor: "15_a_25", rotulo: "R$ 15 mil a R$ 25 mil" },
          { valor: "25_a_40", rotulo: "R$ 25 mil a R$ 40 mil" },
          { valor: "acima_40", rotulo: "Acima de R$ 40 mil" },
          { valor: "nao_dizer", rotulo: "Prefiro não dizer" },
        ],
      },
    ],
  },
];

// ── Consulta e validação ───────────────────────────────────────────────────

export const TODAS_PERGUNTAS: Pergunta[] = PASSOS.flatMap((p) => p.perguntas);

export function acharPergunta(id: string): Pergunta | undefined {
  return TODAS_PERGUNTAS.find((p) => p.id === id);
}

export type Respostas = Record<string, string | string[]>;

export interface ErroValidacao {
  pergunta: string;
  mensagem: string;
}

/**
 * Valida no servidor. A checagem do formulário é conveniência para quem
 * preenche; esta é a que vale, porque a requisição pode vir de qualquer lugar.
 */
export function validarRespostas(respostas: Respostas): ErroValidacao[] {
  const erros: ErroValidacao[] = [];

  for (const pergunta of TODAS_PERGUNTAS) {
    const valor = respostas[pergunta.id];
    const vazia =
      valor === undefined ||
      valor === null ||
      (typeof valor === "string" && valor.trim() === "") ||
      (Array.isArray(valor) && valor.length === 0);

    if (vazia) {
      if (pergunta.obrigatoria) {
        erros.push({ pergunta: pergunta.id, mensagem: "Responda para continuar." });
      }
      continue;
    }

    if (pergunta.tipo === "texto") {
      if (typeof valor !== "string") {
        erros.push({ pergunta: pergunta.id, mensagem: "Formato inválido." });
      } else if (valor.length > (pergunta.maxCaracteres ?? 400)) {
        erros.push({ pergunta: pergunta.id, mensagem: "Texto muito longo." });
      }
      continue;
    }

    const permitidos = new Set((pergunta.opcoes ?? []).map((o) => o.valor));

    if (pergunta.tipo === "escolha_unica") {
      if (typeof valor !== "string" || !permitidos.has(valor)) {
        erros.push({ pergunta: pergunta.id, mensagem: "Opção inválida." });
      }
      continue;
    }

    if (pergunta.tipo === "escolha_multipla") {
      if (!Array.isArray(valor) || valor.some((v) => !permitidos.has(v))) {
        erros.push({ pergunta: pergunta.id, mensagem: "Opção inválida." });
      } else if (pergunta.maximo && valor.length > pergunta.maximo) {
        erros.push({
          pergunta: pergunta.id,
          mensagem: `Escolha no máximo ${pergunta.maximo}.`,
        });
      }
    }
  }

  return erros;
}

/**
 * Converte as respostas em texto para o prompt.
 *
 * Enviar os códigos crus ("ate_7", "transicao") obrigaria o modelo a adivinhar
 * o que significam. Aqui vira frase legível, com o rótulo que a pessoa viu.
 */
export function descreverRespostas(respostas: Respostas): string {
  const linhas: string[] = [];

  for (const pergunta of TODAS_PERGUNTAS) {
    const valor = respostas[pergunta.id];
    if (valor === undefined || valor === null) continue;
    if (Array.isArray(valor) && valor.length === 0) continue;
    if (typeof valor === "string" && !valor.trim()) continue;

    let texto: string;

    if (pergunta.tipo === "texto") {
      texto = String(valor).trim();
    } else {
      const valores = Array.isArray(valor) ? valor : [valor];
      texto = valores
        .map((v) => pergunta.opcoes?.find((o) => o.valor === v)?.rotulo ?? v)
        .join(", ");
    }

    linhas.push(`${pergunta.titulo} → ${texto}`);
  }

  return linhas.join("\n");
}

/** Dias estimados, para casar com a duração das experiências. */
export function estimarDias(respostas: Respostas): { min: number; max: number } | null {
  const faixas: Record<string, { min: number; max: number }> = {
    ate_7: { min: 4, max: 7 },
    "8_a_12": { min: 8, max: 12 },
    "13_a_18": { min: 13, max: 18 },
    mais_18: { min: 18, max: 30 },
  };
  const valor = respostas.dias;
  return typeof valor === "string" ? faixas[valor] ?? null : null;
}
