/**
 * Varre os links internos do site e falha se algum devolver 404.
 *
 * Existe porque o mesmo defeito apareceu três vezes: menu, rodapé e blog
 * apontando para rotas que não existem. `/experiencias/retiros` parece
 * plausível, mas essa rota é slug de experiência — "retiros" é categoria.
 * Revisão de código não pega isso; uma requisição pega.
 *
 * Rodar: npm run test:links   (com `npm run dev` no ar)
 */

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** Páginas cujos links serão coletados. */
const PONTOS_DE_PARTIDA = [
  "/",
  "/experiencias",
  "/destinos",
  "/blog",
  "/sobre",
  "/contato",
  "/contato/faq",
  "/planejar",
  "/legal/privacidade",
  "/legal/termos",
];

/**
 * Rotas que devem mesmo responder 404 ou redirecionar — não são defeito.
 * /admin redireciona para /login sem sessão; é o comportamento correto.
 */
const ESPERADO_NAO_200 = [/^\/admin/, /^\/roteiro\//];

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

async function coletarLinks(rota: string): Promise<string[]> {
  const res = await fetch(`${BASE}${rota}`);
  if (!res.ok) return [];
  const html = await res.text();

  const encontrados = new Set<string>();
  for (const m of html.matchAll(/href=\\?"(\/[^"\\?]*)/g)) {
    const href = m[1];
    if (!href || href.startsWith("//")) continue;
    // Fragmento e arquivo estático não são página.
    if (href.startsWith("/#") || /\.(png|jpg|jpeg|svg|ico|webp|xml|txt|webmanifest)$/.test(href)) {
      continue;
    }
    encontrados.add(href.split("#")[0]);
  }
  return [...encontrados];
}

async function main() {
  console.log(`\nAlvo: ${BASE}\n`);

  const todos = new Set<string>();
  for (const rota of PONTOS_DE_PARTIDA) {
    const links = await coletarLinks(rota);
    links.forEach((l) => todos.add(l));
  }

  const paraTestar = [...todos]
    .filter((l) => !ESPERADO_NAO_200.some((re) => re.test(l)))
    .sort();

  console.log(`=== ${paraTestar.length} links internos distintos ===\n`);

  const quebrados: Array<{ url: string; status: number }> = [];

  for (const url of paraTestar) {
    const res = await fetch(`${BASE}${url}`, { redirect: "manual" });
    const bom = res.status === 200 || res.status === 307 || res.status === 308;
    if (!bom) quebrados.push({ url, status: res.status });
  }

  ok(
    "nenhum link interno quebrado",
    quebrados.length === 0,
    quebrados.length ? `-> ${quebrados.map((q) => `${q.url} (${q.status})`).join(", ")}` : ""
  );

  // Os casos que já quebraram antes ficam explícitos, para não regredirem.
  console.log("\n=== Casos que já quebraram no passado ===");
  for (const rota of [
    "/experiencias?categoria=retiros",
    "/experiencias?categoria=jornadas",
    "/experiencias?categoria=peregrinacoes",
    "/experiencias?categoria=imersoes",
    "/experiencias?categoria=workshops",
    "/planejar",
  ]) {
    const res = await fetch(`${BASE}${rota}`);
    ok(`${rota} responde 200`, res.status === 200, `-> ${res.status}`);
  }

  console.log("\n=== Rotas que devem mesmo falhar ===");
  for (const [rota, esperado] of [
    ["/experiencias/nao-existe-mesmo", 404],
    ["/blog/artigo-inventado-pelo-rastreador", 404],
    ["/roteiro/00000000-0000-0000-0000-000000000000", 404],
  ] as Array<[string, number]>) {
    const res = await fetch(`${BASE}${rota}`, { redirect: "manual" });
    ok(`${rota} devolve ${esperado}`, res.status === esperado, `-> ${res.status}`);
  }

  console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
  process.exit(falhou > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nErro:", e instanceof Error ? e.message : e);
  console.error("O servidor está no ar? npm run dev\n");
  process.exit(1);
});

export {};
