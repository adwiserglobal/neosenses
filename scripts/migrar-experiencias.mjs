/**
 * Cria no banco as experiências extraídas do site antigo.
 *
 * A extração foi feita por dois workflows de agentes; os resultados estão nos
 * journals. Este script lê de lá, converte para o schema e grava.
 *
 * ── O que NÃO é migrado, e por quê ────────────────────────────────────────
 *
 * PREÇO. Todos os valores encontrados estão vencidos (2023/2024), e um deles
 * publica a mesma viagem em reais numa seção e em dólares noutra, para o
 * mesmo quarto duplo. A equipe decidiu: real apenas. Preço errado no ar é
 * pior que preço ausente — um perde a venda, o outro gera reclamação.
 *
 * DATA. Mesma coisa: "19 a 24 de Agosto 2024", "Inscrições até 30 de Outubro
 * 2023". Data vencida no site é sinal de abandono.
 *
 * MARROCOS. A página neosenses.com.br/marrocos-caminhos-rosas-e-aromas/ tem
 * conteúdo INTEIRO da Tailândia — só o título foi trocado. Está assim no ar
 * hoje. Não dá para criar uma experiência de Marrocos com roteiro tailandês.
 *
 * ── Tudo nasce como rascunho ──────────────────────────────────────────────
 *
 * status = draft. Nada aparece no site até alguém abrir, revisar e publicar.
 * Conteúdo migrado por robô que se publica sozinho é como o preço em dólar
 * chegou ao ar.
 *
 * Idempotente: casa por slug e atualiza.
 *
 * Uso:  node scripts/migrar-experiencias.mjs [--dry]
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIMULAR = process.argv.includes("--dry");

const JOURNALS = [
  join(RAIZ, "..", ".claude-journals", "wf1.jsonl"),
  join(RAIZ, "..", ".claude-journals", "wf2.jsonl"),
];

// Caminho real dos journals dos workflows desta sessão.
const PADRAO = [
  "C:/Users/Ale/.claude/projects/C--Users-Ale-Documents-Ale-Pessoal-novo-neosenses/d7fe23fa-d3d3-4d3c-9387-d31d94b71ca7/subagents/workflows/wf_48f22fa3-6ec/journal.jsonl",
  "C:/Users/Ale/.claude/projects/C--Users-Ale-Documents-Ale-Pessoal-novo-neosenses/d7fe23fa-d3d3-4d3c-9387-d31d94b71ca7/subagents/workflows/wf_8e5efe07-77a/journal.jsonl",
];

const env = {};
for (const l of readFileSync(join(RAIZ, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const S = env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !S) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const cab = { apikey: S, Authorization: `Bearer ${S}`, "Content-Type": "application/json" };

async function req(caminho, opcoes = {}) {
  const r = await fetch(`${U}/rest/v1/${caminho}`, { headers: cab, ...opcoes });
  const corpo = await r.json().catch(() => null);
  if (r.status >= 400) throw new Error(`HTTP ${r.status} em ${caminho}: ${JSON.stringify(corpo)}`);
  return corpo;
}

// ── Leitura dos journals ───────────────────────────────────────────────────
const fichas = [];
for (const caminho of [...JOURNALS, ...PADRAO]) {
  if (!existsSync(caminho)) continue;
  for (const linha of readFileSync(caminho, "utf8").split("\n")) {
    if (!linha.trim()) continue;
    let o;
    try { o = JSON.parse(linha); } catch { continue; }
    if (o.type !== "result") continue;
    let v = o.result;
    if (typeof v === "string") { try { v = JSON.parse(v); } catch { continue; } }
    if (v && typeof v === "object" && "ehExperiencia" in v) fichas.push(v);
  }
}

if (!fichas.length) {
  console.error("Nenhuma ficha encontrada nos journals. Os workflows rodaram nesta sessão?");
  process.exit(1);
}

// ── Filtro ─────────────────────────────────────────────────────────────────
const DESCARTAR_URL = [
  // Conteúdo da Tailândia sob título de Marrocos. Ver cabeçalho.
  "marrocos-caminhos-rosas-e-aromas",
];

const aproveitaveis = fichas.filter(
  (f) =>
    f.ehExperiencia &&
    !f.leituraFalhou &&
    f.titulo &&
    !DESCARTAR_URL.some((d) => (f.url || "").includes(d))
);

// Dedup por título: a mesma viagem aparece em mais de uma URL antiga.
const porTitulo = new Map();
for (const f of aproveitaveis) {
  const chave = f.titulo.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  const atual = porTitulo.get(chave);
  // Fica a ficha mais rica: mais roteiro, mais imagem.
  const nota = (x) => (x.roteiroDias?.length ?? 0) * 10 + (x.imagens?.length ?? 0);
  if (!atual || nota(f) > nota(atual)) porTitulo.set(chave, f);
}
const finais = [...porTitulo.values()];

function slugificar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Template pelo formato do conteúdo, não pelo gosto.
 *
 * Roteiro com muitos dias pede a página conduzida pelo dia a dia; sem
 * roteiro, o clássico. B2B fica de fora daqui: nenhuma destas páginas do
 * site antigo é B2B — elas vendem para o viajante final.
 */
function escolherTemplate(f) {
  return (f.roteiroDias?.length ?? 0) >= 5 ? "roteiro" : "classico";
}

console.log(`${fichas.length} fichas lidas · ${aproveitaveis.length} aproveitáveis · ${finais.length} após dedup\n`);

let criadas = 0;
let atualizadas = 0;

for (const f of finais) {
  const slug = slugificar(f.titulo);
  const template = escolherTemplate(f);

  // Roteiro e "o que está incluso" viram texto dentro da descrição: as
  // tabelas próprias (itinerary, inclusions) exigem revisão item a item, e
  // despejar dado de robô nelas cria trabalho de limpeza em vez de poupar.
  const partes = [f.descricaoCompleta || ""];
  if (f.roteiroDias?.length) {
    partes.push(
      "\n\n## Roteiro\n\n" +
        f.roteiroDias
          .map((d) => `**Dia ${d.dia ?? "?"} — ${d.titulo ?? ""}**\n${d.descricao ?? ""}`)
          .join("\n\n")
    );
  }
  if (f.incluso?.length) partes.push("\n\n## Incluso\n\n" + f.incluso.map((i) => `- ${i}`).join("\n"));
  if (f.naoIncluso?.length) partes.push("\n\n## Não incluso\n\n" + f.naoIncluso.map((i) => `- ${i}`).join("\n"));

  const registro = {
    title: { pt: f.titulo.slice(0, 200) },
    slug: { pt: slug },
    short_description: { pt: (f.resumo || "").slice(0, 600) },
    description: { pt: partes.join("").slice(0, 20000) },
    duration_days: f.duracaoDias > 0 ? f.duracaoDias : null,
    // price_from e as datas ficam de fora. Ver cabeçalho.
    price_currency: "BRL",
    status: "draft",
    metadata: {
      migrado_de: f.url,
      migrado_em: "2026-08-12",
      template_sugerido: template,
      facilitadores: f.facilitadores ?? [],
      // Preço e datas do site antigo ficam registrados AQUI, fora dos campos
      // que o site exibe: quem for revisar precisa saber o que existia, sem
      // que isso apareça para o visitante.
      preco_antigo: f.preco || null,
      datas_antigas: f.datas ?? [],
      imagens_originais: (f.imagens ?? []).map((i) => i.url).filter(Boolean),
      observacoes_da_extracao: f.observacoes || null,
    },
  };

  if (SIMULAR) {
    console.log(
      `  ${(f.titulo || "").slice(0, 44).padEnd(46)} ${template.padEnd(9)} ${String(f.roteiroDias?.length ?? 0).padStart(2)}et ${String(f.imagens?.length ?? 0).padStart(2)}img`
    );
    continue;
  }

  const existente = await req(`experiences?slug->>pt=eq.${encodeURIComponent(slug)}&select=id`);
  if (existente.length) {
    await req(`experiences?id=eq.${existente[0].id}`, { method: "PATCH", body: JSON.stringify(registro) });
    atualizadas++;
    console.log(`  atualizada  ${f.titulo.slice(0, 50)}`);
  } else {
    await req("experiences", { method: "POST", body: JSON.stringify(registro) });
    criadas++;
    console.log(`  criada      ${f.titulo.slice(0, 50)}  [${template}]`);
  }
}

if (!SIMULAR) {
  console.log(`\n${criadas} criada(s), ${atualizadas} atualizada(s).`);
  const todas = await req("experiences?select=status");
  const rascunhos = todas.filter((e) => e.status === "draft").length;
  console.log(`${todas.length} experiência(s) no banco, ${rascunhos} em rascunho.`);
  console.log("\nNenhuma aparece no site até ser publicada em /admin/experiencias.");
  console.log("Preço, data e fotos originais ficaram em metadata, para quem revisar.");
}
