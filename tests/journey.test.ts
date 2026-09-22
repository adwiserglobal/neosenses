/**
 * Testes do Journey Builder — validação das respostas e conferência do
 * roteiro devolvido pela IA.
 *
 * Rodar: npm test (não chama a API, não consome cota).
 *
 * O que se verifica aqui é a parte que o prompt não garante: id inventado não
 * pode virar link, e roteiro maior que o tempo da pessoa não pode passar.
 */

const { validarRespostas, descreverRespostas, estimarDias, TODAS_PERGUNTAS } = await import(
  "../src/lib/journey/perguntas.ts"
);
const { conferirRoteiro } = await import("../src/lib/journey/roteiro.ts");

let passou = 0;
let falhou = 0;

function ok(nome: string, condicao: boolean, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  PASSOU  ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHOU  ${nome} ${detalhe}`);
  }
}

const CATALOGO = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    titulo: "Machu Picchu Xamânico",
    slug: "machu-picchu-xamanico",
    destino: "Vale Sagrado",
    pais: "Peru",
    dias: 12,
    precoTexto: "a partir de R$ 18.900",
    resumo: "Doze dias pelo Vale Sagrado.",
    intencoes: ["meditacao", "natureza"],
    dificuldade: "intermediate",
    proximasDatas: ["2026-10-24 a 2026-11-04 (5 vagas)"],
  },
];

const RESPOSTAS_VALIDAS = {
  dias: "8_a_12",
  motivo: "transicao",
  interesses: ["natureza", "meditacao"],
};

console.log("\n=== Validação das respostas ===");

ok("respostas completas passam", validarRespostas(RESPOSTAS_VALIDAS).length === 0);

ok(
  "falta obrigatória é apontada",
  validarRespostas({ dias: "8_a_12" }).some((e) => e.pergunta === "motivo")
);

ok(
  "opção inexistente é rejeitada",
  validarRespostas({ ...RESPOSTAS_VALIDAS, dias: "dez_anos" }).some((e) => e.pergunta === "dias")
);

ok(
  "valor fora da lista em múltipla escolha é rejeitado",
  validarRespostas({ ...RESPOSTAS_VALIDAS, interesses: ["natureza", "hackear"] }).some(
    (e) => e.pergunta === "interesses"
  )
);

ok(
  "limite de seleções é aplicado",
  validarRespostas({
    ...RESPOSTAS_VALIDAS,
    sentimento: ["descansado", "clareza", "leve"],
  }).some((e) => e.pergunta === "sentimento"),
  "-> sentimento aceita no máximo 2"
);

ok(
  "texto longo demais é rejeitado",
  validarRespostas({ ...RESPOSTAS_VALIDAS, evitar: "x".repeat(500) }).some(
    (e) => e.pergunta === "evitar"
  )
);

ok("opcional em branco não bloqueia", validarRespostas({ ...RESPOSTAS_VALIDAS, evitar: "" }).length === 0);

ok(
  "tipo errado é rejeitado",
  validarRespostas({ ...RESPOSTAS_VALIDAS, dias: ["8_a_12"] as never }).length > 0
);

console.log("\n=== Descrição para o prompt ===");

const descricao = descreverRespostas({
  ...RESPOSTAS_VALIDAS,
  evitar: "não quero acordar de madrugada",
});
ok("usa o rótulo, não o código", descricao.includes("8 a 12 dias"), descricao.slice(0, 80));
ok("não vaza o código cru", !descricao.includes("8_a_12"));
ok("inclui o texto livre", descricao.includes("madrugada"));
ok("traz a pergunta junto", descricao.includes("O que te trouxe até aqui?"));

console.log("\n=== Faixa de dias ===");
ok("8_a_12 vira 8–12", JSON.stringify(estimarDias({ dias: "8_a_12" })) === '{"min":8,"max":12}');
ok("flexível não limita", estimarDias({ dias: "flexivel" }) === null);

console.log("\n=== Conferência do roteiro ===");

const roteiroBom = {
  titulo: "Andes em doze dias",
  resumo: "Um caminho pelo Vale Sagrado com tempo de silêncio.",
  porQueCombina: "Você falou em virada de fase e em natureza.",
  trechos: [
    { de: 1, ate: 2, titulo: "Chegada e aclimatação", descricao: "Dois dias em Cusco.", tipo: "extensao", experienceId: null },
    {
      de: 3,
      ate: 12,
      titulo: "Machu Picchu Xamânico",
      descricao: "A jornada em si.",
      tipo: "neosenses",
      experienceId: "11111111-1111-1111-1111-111111111111",
    },
  ],
  aPreparar: ["Tênis amaciado", "Casaco térmico"],
  observacao: null,
};

const conferido = conferirRoteiro(roteiroBom, CATALOGO, { min: 8, max: 12 });
ok("roteiro válido é aceito", conferido !== null);
ok("mantém os dois trechos", conferido?.trechos.length === 2);
ok(
  "trecho do catálogo ganha URL",
  conferido?.trechos[1].url === "/experiencias/machu-picchu-xamanico",
  `-> ${conferido?.trechos[1].url}`
);
ok("trecho do catálogo ganha local", conferido?.trechos[1].local === "Vale Sagrado, Peru");
ok("extensão não ganha URL", conferido?.trechos[0].url === null);

// O caso que motiva a conferência existir.
const comIdInventado = {
  ...roteiroBom,
  trechos: [
    {
      de: 1,
      ate: 10,
      titulo: "Retiro na Toscana",
      descricao: "Experiência que não existe no catálogo.",
      tipo: "neosenses",
      experienceId: "99999999-9999-9999-9999-999999999999",
    },
  ],
};
const semInvencao = conferirRoteiro(comIdInventado, CATALOGO, { min: 8, max: 12 });
ok("id inventado é rebaixado a sugestão", semInvencao?.trechos[0].tipo === "extensao");
ok("id inventado não vira link", semInvencao?.trechos[0].url === null);
ok("id inventado é descartado", semInvencao?.trechos[0].experienceId === null);

const forjado = {
  ...roteiroBom,
  trechos: [
    { de: 1, ate: 30, titulo: "Volta ao mundo", descricao: "x", tipo: "extensao", experienceId: null },
  ],
};
ok(
  "roteiro maior que o tempo disponível é recusado",
  conferirRoteiro(forjado, CATALOGO, { min: 4, max: 7 }) === null
);

ok("sem trechos é recusado", conferirRoteiro({ ...roteiroBom, trechos: [] }, CATALOGO, { min: 8, max: 12 }) === null);
ok("sem resumo é recusado", conferirRoteiro({ ...roteiroBom, resumo: "" }, CATALOGO, { min: 8, max: 12 }) === null);
ok("resposta nula é recusada", conferirRoteiro(null, CATALOGO, { min: 8, max: 12 }) === null);
ok("texto solto é recusado", conferirRoteiro("um roteiro bonito", CATALOGO, { min: 8, max: 12 }) === null);

const desordenado = {
  ...roteiroBom,
  trechos: [
    { de: 5, ate: 8, titulo: "Depois", descricao: "x", tipo: "extensao", experienceId: null },
    { de: 1, ate: 4, titulo: "Antes", descricao: "x", tipo: "extensao", experienceId: null },
  ],
};
ok(
  "trechos são ordenados por dia",
  conferirRoteiro(desordenado, CATALOGO, { min: 8, max: 12 })?.trechos[0].titulo === "Antes"
);

const semCatalogo = conferirRoteiro(
  {
    ...roteiroBom,
    trechos: [
      { de: 1, ate: 5, titulo: "Sugestão livre", descricao: "x", tipo: "neosenses", experienceId: "11111111-1111-1111-1111-111111111111" },
    ],
  },
  [],
  { min: 8, max: 12 }
);
ok("catálogo vazio impede trecho 'neosenses'", semCatalogo?.trechos[0].tipo === "extensao");

console.log("\n=== Estrutura do questionário ===");
ok("todas as perguntas têm id único", new Set(TODAS_PERGUNTAS.map((p) => p.id)).size === TODAS_PERGUNTAS.length);
ok(
  "toda escolha tem opções",
  TODAS_PERGUNTAS.filter((p) => p.tipo !== "texto").every((p) => (p.opcoes?.length ?? 0) >= 2)
);
ok(
  "toda opção tem valor e rótulo",
  TODAS_PERGUNTAS.every((p) => (p.opcoes ?? []).every((o) => o.valor && o.rotulo))
);
ok(
  "poucas obrigatórias",
  TODAS_PERGUNTAS.filter((p) => p.obrigatoria).length <= 3,
  `-> ${TODAS_PERGUNTAS.filter((p) => p.obrigatoria).length} obrigatórias`
);

console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
process.exit(falhou > 0 ? 1 : 0);

export {};
