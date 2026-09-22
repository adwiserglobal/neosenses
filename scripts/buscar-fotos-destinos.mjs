/**
 * Busca no Wikimedia Commons três fotos para cada destino sem galeria.
 *
 * Mesmo filtro do painel: só licença que permite uso comercial, e só foto com
 * autor identificável — sem nome não há como creditar, e sem crédito não se
 * publica.
 *
 * Idempotente: destino que já tem galeria é pulado, e foto já gravada é
 * reaproveitada pela URL em vez de duplicar a biblioteca de mídia.
 *
 * Uso:  node scripts/buscar-fotos-destinos.mjs [--dry] [--refazer]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIMULAR = process.argv.includes("--dry");
const REFAZER = process.argv.includes("--refazer");

const env = {};
for (const l of readFileSync(join(RAIZ, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const S = env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !S) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}
const cab = { apikey: S, Authorization: `Bearer ${S}`, "Content-Type": "application/json" };

const { buscarImagens } = await import(
  pathToFileURL(join(RAIZ, "src/lib/ai/imagens.ts")).href
);

async function req(caminho, opcoes = {}) {
  const r = await fetch(`${U}/rest/v1/${caminho}`, { headers: cab, ...opcoes });
  const corpo = await r.json().catch(() => null);
  if (r.status >= 400) throw new Error(`HTTP ${r.status} em ${caminho}: ${JSON.stringify(corpo)}`);
  return corpo;
}

const destinos = await req(
  "destinations?select=id,name,gallery,hero_image,country:countries(name)&order=sort_order"
);

console.log(`${destinos.length} destino(s) no banco.\n`);

for (const d of destinos) {
  const nome = d.name?.pt ?? "(sem nome)";
  const pais = d.country?.name?.pt ?? "";

  if (d.gallery?.length && !REFAZER) {
    console.log(`  pulado     ${nome} — já tem ${d.gallery.length} foto(s)`);
    continue;
  }

  // O país entra separado: buscarImagens tenta o nome completo primeiro e,
  // não achando, quebra em partes. Foi o que destravou quatro destinos cujo
  // nome em português não existe no catálogo do Commons.
  const fotos = await buscarImagens(nome, 3, 12_000, pais);

  if (!fotos.length) {
    console.log(`  SEM FOTO   ${nome} — nenhuma com licença livre`);
    continue;
  }

  if (SIMULAR) {
    console.log(`  acharia    ${nome} — ${fotos.length} foto(s)`);
    for (const f of fotos) console.log(`               ${f.credito}`);
    continue;
  }

  const ids = [];
  for (const f of fotos) {
    const existente = await req(`media?url=eq.${encodeURIComponent(f.url)}&select=id`);
    if (existente.length) {
      ids.push(existente[0].id);
      continue;
    }
    const criado = await req("media", {
      method: "POST",
      headers: { ...cab, Prefer: "return=representation" },
      body: JSON.stringify({
        filename: f.titulo.slice(0, 200),
        original_filename: f.titulo.slice(0, 200),
        mime_type: /\.png$/i.test(f.titulo) ? "image/png" : "image/jpeg",
        type: "image",
        url: f.url,
        width: f.largura,
        height: f.altura,
        alt_text: { pt: `${nome} — ${f.titulo.replace(/\.\w+$/, "")}`.slice(0, 300) },
        caption: { pt: f.credito.slice(0, 300) },
        folder: "/destinos",
        metadata: {
          fonte: "wikimedia-commons",
          autor: f.autor,
          licenca: f.licenca,
          pagina_fonte: f.paginaFonte,
        },
      }),
    });
    ids.push(criado[0].id);
  }

  await req(`destinations?id=eq.${d.id}`, {
    method: "PATCH",
    body: JSON.stringify({ gallery: ids }),
  });

  console.log(`  ${d.gallery?.length ? "refeito   " : "cadastrado"} ${nome} — ${ids.length} foto(s)`);
  for (const f of fotos) console.log(`               ${f.credito}`);
}

console.log("");
const depois = await req("destinations?select=name,gallery,hero_image&order=sort_order");
const semGaleria = depois.filter((x) => !x.gallery?.length);
console.log(`${depois.length - semGaleria.length} de ${depois.length} destino(s) com galeria.`);
if (semGaleria.length) {
  console.log("Sem galeria:");
  for (const x of semGaleria) console.log(`  ${x.name?.pt}`);
}
