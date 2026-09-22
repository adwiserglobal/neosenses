/**
 * Testes do limitador de uso.
 *
 * Existe por causa de um bypass real: a chave anterior incluía o sessionId,
 * que vem do corpo do POST. Trocar o identificador a cada requisição criava
 * uma chave nova e o contador nunca subia — o limite não limitava nada.
 *
 * Rodar: npm test
 */

const { identificar, verificarLimite, limparContadores, totalDeChaves } = await import(
  "../src/lib/limite.ts"
);

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

const regra = { nome: "teste", maximo: 3, janelaMs: 60_000 };

console.log("\n=== Identificação vem do cabeçalho, não do corpo ===");

ok(
  "usa o primeiro salto do x-forwarded-for",
  identificar(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" })) === "203.0.113.7"
);
ok(
  "ignora saltos seguintes, que o cliente pode forjar",
  identificar(new Headers({ "x-forwarded-for": "203.0.113.7, 1.2.3.4" })) !== "1.2.3.4"
);
ok("cai no x-real-ip", identificar(new Headers({ "x-real-ip": "198.51.100.9" })) === "198.51.100.9");
ok("sem cabeçalho vira balde único", identificar(new Headers()) === "sem-ip");
ok(
  "valor gigante é truncado",
  identificar(new Headers({ "x-forwarded-for": "9".repeat(500) })).length <= 45
);

console.log("\n=== Contagem ===");

limparContadores();
const primeiras = [1, 2, 3].map(() => verificarLimite("203.0.113.7", regra).permitido);
ok("as primeiras passam", primeiras.every(Boolean));

const quarta = verificarLimite("203.0.113.7", regra);
ok("a que excede é bloqueada", !quarta.permitido);
ok("informa quanto esperar", quarta.esperarSegundos > 0 && quarta.esperarSegundos <= 60);

ok("outro IP não é afetado", verificarLimite("198.51.100.9", regra).permitido);

console.log("\n=== O bypass que motivou este módulo ===");

limparContadores();
// Antes, a chave era `${ip}|${sessionId}`: cada sessão nova zerava a contagem.
// Aqui o IP é o mesmo e a sessão é irrelevante — o limite tem que valer.
let passaram = 0;
for (let i = 0; i < 50; i++) {
  // O sessionId nem entra na chamada: não faz parte da identidade.
  if (verificarLimite("203.0.113.7", regra).permitido) passaram++;
}
ok(
  "50 requisições do mesmo IP não furam o limite",
  passaram === regra.maximo,
  `-> passaram ${passaram}, esperado ${regra.maximo}`
);

console.log("\n=== Janela ===");

limparContadores();
const curta = { nome: "curta", maximo: 1, janelaMs: 40 };
verificarLimite("203.0.113.7", curta);
ok("segunda dentro da janela é bloqueada", !verificarLimite("203.0.113.7", curta).permitido);

await new Promise((r) => setTimeout(r, 60));
ok("depois da janela libera de novo", verificarLimite("203.0.113.7", curta).permitido);

console.log("\n=== Regras não se misturam ===");

limparContadores();
const chat = { nome: "chat", maximo: 2, janelaMs: 60_000 };
const roteiro = { nome: "roteiro", maximo: 1, janelaMs: 60_000 };

verificarLimite("203.0.113.7", chat);
verificarLimite("203.0.113.7", chat);
ok("chat esgotado bloqueia chat", !verificarLimite("203.0.113.7", chat).permitido);
ok("mas não bloqueia roteiro", verificarLimite("203.0.113.7", roteiro).permitido);

console.log("\n=== Memória sob rajada ===");

limparContadores();
// Muitos IPs distintos não podem fazer a memória crescer sem teto — e a
// limpeza não pode zerar o contador de quem está abusando, que era o outro
// defeito da versão anterior.
for (let i = 0; i < 3; i++) verificarLimite("203.0.113.7", regra);
ok("abusador já está no teto", !verificarLimite("203.0.113.7", regra).permitido);

for (let i = 0; i < 3000; i++) {
  verificarLimite(`10.0.${Math.floor(i / 250)}.${i % 250}`, regra);
}
ok(
  "abusador continua bloqueado depois da rajada",
  !verificarLimite("203.0.113.7", regra).permitido,
  "-> a limpeza apagou o contador de quem abusa"
);
ok("memória não cresce sem limite", totalDeChaves() <= 20_001, `-> ${totalDeChaves()} chaves`);

console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
process.exit(falhou > 0 ? 1 : 0);

export {};
