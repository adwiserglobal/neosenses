/**
 * Põe cada experiência na categoria que a equipe definiu.
 *
 * A lista veio em "ROTEIROS CLASSIFICADOS.txt" (01/09/2026) e divide o
 * catálogo em três: Viagens & Peregrinações, Retiros & Imersões e
 * Workshops & Aulas — que são exatamente as três entradas do menu novo.
 *
 * ── Como o casamento é feito ──────────────────────────────────────────────
 *
 * Por semelhança de nome, não por posição: os títulos do banco vieram da
 * migração do site antigo e não batem letra por letra com a lista ("PERU
 * INKA SOL" no papel, "Retiro INKA SOL" no banco). O script normaliza os
 * dois lados — sem acento, sem pontuação, sem palavra vazia — e exige que
 * a maior parte das palavras da lista apareça no título.
 *
 * Casamento fraco NÃO é aplicado: vira aviso. Uma experiência na categoria
 * errada some do filtro certo e aparece no errado, e ninguém percebe até
 * um cliente reclamar que não achou.
 *
 * ── O que este script não faz ─────────────────────────────────────────────
 *
 * Não apaga, não despublica e não cria experiência nenhuma. O que está no
 * banco e não está na lista é reportado para a equipe decidir; o que está
 * na lista e não existe no banco também. Decisão de catálogo é da equipe.
 *
 * Idempotente.
 *
 * Uso:
 *   node scripts/classificar-roteiros.mjs --dry      só mostra
 *   node scripts/classificar-roteiros.mjs --local    banco de desenvolvimento
 *   node scripts/classificar-roteiros.mjs            projeto da nuvem
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIMULAR = process.argv.includes("--dry");
const LOCAL = process.argv.includes("--local");

const env = {};
const arquivo = LOCAL ? ".env.development.local" : ".env.local";
for (const l of readFileSync(join(RAIZ, arquivo), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const S = env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !S) {
  console.error(`Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em ${arquivo}.`);
  process.exit(1);
}
const cab = { apikey: S, Authorization: `Bearer ${S}`, "Content-Type": "application/json" };

async function req(caminho, opcoes = {}) {
  const r = await fetch(`${U}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: { ...cab, Prefer: opcoes.prefer ?? "return=representation" },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${opcoes.method ?? "GET"} ${caminho} → ${r.status} ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

// ──────────────────────────────────────────────────────────────────────────
// A lista da equipe, transcrita
// ──────────────────────────────────────────────────────────────────────────
const LISTA = [
  // Viagens & Peregrinações — nacionais
  { nome: "Chapada dos Veadeiros - Energia e Natureza", categoria: "viagens-peregrinacoes" },
  { nome: "Alter do Chão - Despertar da Floresta", categoria: "viagens-peregrinacoes" },
  { nome: "Amazônia - Sabores e Cores", categoria: "viagens-peregrinacoes" },
  // Viagens & Peregrinações — internacionais
  { nome: "Caminho de Maria Madalena", categoria: "viagens-peregrinacoes" },
  { nome: "Caminho de São Francisco de Assis", categoria: "viagens-peregrinacoes" },
  { nome: "Noruega e seus Fiordes", categoria: "viagens-peregrinacoes" },
  { nome: "Ushuaia e El Calafate - Despertar da Magia", categoria: "viagens-peregrinacoes" },
  { nome: "Egito - Mistérios e Tesouros", categoria: "viagens-peregrinacoes" },
  { nome: "Tailândia Iluminada", categoria: "viagens-peregrinacoes" },
  { nome: "Índia dos Saberes Ancestrais", categoria: "viagens-peregrinacoes" },
  { nome: "Marrocos - Deserto, Rosas e Aromas", categoria: "viagens-peregrinacoes" },
  { nome: "Machu Picchu Xamânico", categoria: "viagens-peregrinacoes" },
  { nome: "Peru Inka Sol", categoria: "viagens-peregrinacoes" },
  // Retiros & Imersões
  { nome: "Musa Música", categoria: "retiros-imersoes" },
  { nome: "Retiro com Elas", categoria: "retiros-imersoes" },
  { nome: "Som e o Silêncio", categoria: "retiros-imersoes" },
  { nome: "Realinhamento Espiritual com Ananda Prem", categoria: "retiros-imersoes" },
  { nome: "Desvendando Shaktis", categoria: "retiros-imersoes" },
  // Workshops & Aulas
  { nome: "Metafísica Chinesa", categoria: "workshops-aulas" },
  { nome: "Sementes Plant Based", categoria: "workshops-aulas" },
];

/** Palavras que não distinguem nada e só inflariam o casamento. */
const VAZIAS = new Set([
  "de", "da", "do", "das", "dos", "e", "o", "a", "os", "as", "em", "com", "para",
  "retiro", "roteiro", "jornada", "viagem", "imersao", "the",
]);

function palavras(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 2 && !VAZIAS.has(p));
}

/**
 * Quanto do nome da lista aparece no título do banco.
 *
 * Da lista para o título, e não o contrário: o título do banco costuma ter
 * palavras a mais ("Retiro INKA SOL — Caminhos da Iluminação"), e exigir
 * que elas apareçam na lista reprovaria casamentos corretos.
 */
function afinidade(nomeDaLista, tituloDoBanco) {
  const alvo = palavras(nomeDaLista);
  if (alvo.length === 0) return 0;
  const tem = new Set(palavras(tituloDoBanco));
  return alvo.filter((p) => tem.has(p)).length / alvo.length;
}

const MINIMO = 0.6;

console.log(`\nBanco: ${LOCAL ? "LOCAL" : "NUVEM"} — ${U}\n`);

const categorias = await req("categories?select=id,slug,name");
const idPorSlug = new Map(categorias.map((c) => [c.slug, c.id]));
const nomePorId = new Map(categorias.map((c) => [c.id, c.name?.pt ?? c.slug]));

for (const alvo of ["viagens-peregrinacoes", "retiros-imersoes", "workshops-aulas"]) {
  if (!idPorSlug.has(alvo)) {
    console.error(`Categoria "${alvo}" não existe. Aplique a migration 017 antes.`);
    process.exit(1);
  }
}

const experiencias = await req(
  "experiences?audience=eq.viajante&select=id,slug,title,category_id,status&order=created_at"
);

const usados = new Set();
const semCasar = [];
let aplicados = 0;
let jaCertos = 0;

console.log("── Casamentos ────────────────────────────────────────────────");

for (const e of experiencias) {
  const titulo = e.title?.pt ?? "";
  const slug = e.slug?.pt ?? "";

  let melhor = null;
  let melhorNota = 0;
  for (const item of LISTA) {
    // O slug também conta: "machu-picchu-xamanico-antarki-huaminca" casa com
    // "Machu Picchu Xamânico" mesmo quando o título traz outras palavras.
    const nota = Math.max(afinidade(item.nome, titulo), afinidade(item.nome, slug));
    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = item;
    }
  }

  if (!melhor || melhorNota < MINIMO) {
    semCasar.push({ slug, titulo, nota: melhorNota, palpite: melhor?.nome });
    continue;
  }

  usados.add(melhor.nome);
  const idAlvo = idPorSlug.get(melhor.categoria);
  const marca = melhorNota === 1 ? " " : "~";

  if (e.category_id === idAlvo) {
    jaCertos++;
    console.log(`  ${marca} ${slug.slice(0, 42).padEnd(44)} já em ${melhor.categoria}`);
    continue;
  }

  const antes = e.category_id ? nomePorId.get(e.category_id) ?? "?" : "(sem categoria)";
  console.log(
    `  ${marca} ${slug.slice(0, 42).padEnd(44)} ${String(antes).slice(0, 20).padEnd(22)} → ${melhor.categoria}`
  );

  if (!SIMULAR) {
    await req(`experiences?id=eq.${e.id}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ category_id: idAlvo }),
    });
  }
  aplicados++;
}

if (semCasar.length) {
  console.log("\n── No banco e fora da lista da equipe ─────────────────────────");
  console.log("   (nada foi alterado nestas — decidir se entram na lista ou saem do ar)");
  for (const x of semCasar) {
    console.log(
      `     ${x.slug.slice(0, 46).padEnd(48)} ${
        x.palpite ? `parecida com "${x.palpite}" (${Math.round(x.nota * 100)}%)` : "sem palpite"
      }`
    );
  }
}

const faltando = LISTA.filter((i) => !usados.has(i.nome));
if (faltando.length) {
  console.log("\n── Na lista da equipe e ainda sem página ──────────────────────");
  for (const i of faltando) console.log(`     ${i.nome.padEnd(48)} ${i.categoria}`);
}

console.log(
  `\n${aplicados} ${SIMULAR ? "seriam classificadas" : "classificadas"}, ${jaCertos} já corretas, ` +
    `${semCasar.length} fora da lista, ${faltando.length} por criar.\n`
);
