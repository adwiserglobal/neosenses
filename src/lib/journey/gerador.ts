/**
 * Chamada de IA que monta o roteiro.
 *
 * A IA recebe as respostas do questionário e o catálogo real, e devolve JSON
 * estruturado — não texto corrido. Texto corrido teria que ser interpretado
 * na exibição, e é aí que aparece experiência inventada com cara de real.
 *
 * O formato e a conferência do que voltou ficam em `roteiro.ts`, sem
 * dependência daqui: assim dá para testá-los sem chamada de rede.
 *
 * Roda apenas no servidor.
 */

import { generateAIResponse, type ChatMessage, type AIProviderConfig } from "@/lib/ai/provider";
import { descreverRespostas, estimarDias, type Respostas } from "./perguntas";
import { conferirRoteiro, extrairJson, type ExperienciaDisponivel, type Roteiro } from "./roteiro";

export type { ExperienciaDisponivel, Roteiro, TrechoRoteiro } from "./roteiro";

function montarPrompt(experiencias: ExperienciaDisponivel[], respostas: Respostas): ChatMessage[] {
  const faixa = estimarDias(respostas);

  const catalogo = experiencias
    .map((e) =>
      [
        `id: ${e.id}`,
        `título: ${e.titulo}`,
        `destino: ${e.destino}${e.pais ? `, ${e.pais}` : ""}`,
        e.dias ? `duração: ${e.dias} dias` : "duração: a confirmar",
        `valor: ${e.precoTexto}`,
        `perfil: ${e.intencoes.join(", ") || "não informado"}`,
        `esforço físico: ${e.dificuldade}`,
        e.proximasDatas.length ? `datas: ${e.proximasDatas.join(" | ")}` : "datas: não publicadas",
        `sobre: ${e.resumo}`,
      ].join("\n")
    )
    .join("\n\n---\n\n");

  const sistema = `Você monta roteiros de viagem para a NeoSenses, que organiza jornadas transformadoras e retiros.

Sua tarefa: ler as respostas de uma pessoa e propor um caminho para ela, combinando experiências reais do catálogo com sugestões livres de dias adicionais.

# Regras absolutas

Só existe uma fonte de experiências: o CATÁLOGO abaixo. Para marcar um trecho como "neosenses", copie o id exatamente como está lá. Nunca invente id, título, preço ou data.

Trecho do tipo "extensao" é sugestão sua de dias livres — chegar antes para aclimatar, ficar depois, atravessar entre dois destinos. Nele:
- descreva a ideia, não um pacote fechado
- nunca cite hotel, companhia aérea, preço, horário ou nome de fornecedor
- deixe claro que é sugestão a combinar com a equipe

Se o catálogo estiver vazio, devolva trechos apenas do tipo "extensao" e diga na observação que as experiências ainda não estão publicadas.

# Como escolher

O que trouxe a pessoa até aqui e como ela quer se sentir na volta são os critérios principais — mais que a lista de interesses. Alguém em luto e alguém celebrando pedem caminhos diferentes do mesmo destino.

Respeite o que ela disse que NÃO quer. Isso invalida uma sugestão, por melhor que ela pareça.

Respeite o tempo disponível${faixa ? `: entre ${faixa.min} e ${faixa.max} dias no total` : ""}. Não proponha mais dias do que ela tem.

Se ela nunca viajou em grupo, inclua em "aPreparar" o que costuma tranquilizar quem vai pela primeira vez.

Considere o esforço físico e as restrições informadas.

# Tom
Escreva em português do Brasil, na segunda pessoa, direto e caloroso. Sem linguagem de folheto. Nada de "experiência única e inesquecível".

# Formato da resposta

Responda SOMENTE com JSON válido, sem cercas de código e sem texto antes ou depois:

{
  "titulo": "nome curto para este roteiro, até 60 caracteres",
  "resumo": "dois ou três períodos sobre o caminho proposto",
  "porQueCombina": "um parágrafo ligando a proposta ao que a pessoa contou, citando o que ela disse",
  "trechos": [
    {
      "de": 1,
      "ate": 3,
      "titulo": "título do trecho",
      "descricao": "o que acontece nesses dias e por quê",
      "tipo": "extensao",
      "experienceId": null
    }
  ],
  "aPreparar": ["de 3 a 6 itens práticos e específicos para este caminho"],
  "observacao": "o que precisa ser confirmado com a equipe, ou null"
}`;

  const usuario = `RESPOSTAS DA PESSOA:

${descreverRespostas(respostas)}

CATÁLOGO DISPONÍVEL:

${catalogo || "(nenhuma experiência publicada no momento)"}`;

  return [
    { role: "system", content: sistema },
    { role: "user", content: usuario },
  ];
}

export interface ResultadoGeracao {
  roteiro: Roteiro;
  provider: string;
  model: string;
  tokensUsed?: number;
  tempoMs: number;
}

export async function gerarRoteiro(
  experiencias: ExperienciaDisponivel[],
  respostas: Respostas,
  config: AIProviderConfig
): Promise<ResultadoGeracao | null> {
  const mensagens = montarPrompt(experiencias, respostas);

  // Sem `thinking: "low"` de propósito: encaixar experiências reais nos dias
  // disponíveis é planejamento, e aqui o raciocínio extra compensa o custo.
  const resposta = await generateAIResponse(mensagens, config, {
    maxTokens: 4096,
    temperature: 0.8,
    json: true,
    timeoutMs: 60_000,
  });

  const roteiro = conferirRoteiro(
    extrairJson(resposta.content),
    experiencias,
    estimarDias(respostas)
  );
  if (!roteiro) {
    console.error("[journey] resposta da IA não aproveitável:", resposta.content.slice(0, 300));
    return null;
  }

  return {
    roteiro,
    provider: resposta.provider,
    model: resposta.model,
    tokensUsed: resposta.tokensUsed,
    tempoMs: resposta.responseTimeMs,
  };
}
