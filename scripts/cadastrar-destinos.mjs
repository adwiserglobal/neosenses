/**
 * Cadastra países e destinos reais da NeoSenses no Supabase.
 *
 * ── Por que script, e não migration ───────────────────────────────────────
 *
 * Isto é CONTEÚDO, não schema. Uma migration que insere conteúdo briga com o
 * painel: a equipe edita o texto de um destino, alguém reaplica as migrations
 * num ambiente novo, e a edição volta ao que estava. Schema vai em migration;
 * catálogo entra por aqui ou pelo admin.
 *
 * ── O que é verdade aqui ──────────────────────────────────────────────────
 *
 * Os destinos vêm das viagens que a NeoSenses de fato oferece, conferidas em
 * neosenses.com.br. Altitude, clima e coordenadas são dados geográficos
 * factuais — não são estimativa nem enfeite.
 *
 * O que NÃO está aqui, de propósito: preço, data, vaga e roteiro. Esses são
 * de cada saída, mudam por turma, e inventá-los é pior que deixar vazio.
 *
 * Onde a informação real não é pública, o campo fica de fora em vez de
 * receber um chute. `Despertar na Floresta` não diz publicamente qual
 * floresta, então o destino do Brasil não recebe coordenada nem altitude.
 *
 * ── Idempotente ───────────────────────────────────────────────────────────
 *
 * Roda de novo sem duplicar: casa pelo slug e atualiza. Não apaga nada que
 * não esteja nesta lista — destino cadastrado pelo painel sobrevive.
 *
 * Uso:  node scripts/cadastrar-destinos.mjs [--dry]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIMULAR = process.argv.includes("--dry");

const env = {};
for (const l of readFileSync(join(RAIZ, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !CHAVE) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}
const cab = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  "Content-Type": "application/json",
};

// ── Países ─────────────────────────────────────────────────────────────────
const PAISES = [
  { slug: "peru",      code: "PE", pt: "Peru",      en: "Peru",     es: "Perú" },
  { slug: "india",     code: "IN", pt: "Índia",     en: "India",    es: "India" },
  { slug: "marrocos",  code: "MA", pt: "Marrocos",  en: "Morocco",  es: "Marruecos" },
  { slug: "egito",     code: "EG", pt: "Egito",     en: "Egypt",    es: "Egipto" },
  { slug: "franca",    code: "FR", pt: "França",    en: "France",   es: "Francia" },
  { slug: "tailandia", code: "TH", pt: "Tailândia", en: "Thailand", es: "Tailandia" },
  { slug: "brasil",    code: "BR", pt: "Brasil",    en: "Brazil",   es: "Brasil" },
];

// ── Destinos ───────────────────────────────────────────────────────────────
// `hero_image` aponta para public/images/destinations/. Cinco existem; Egito e
// Brasil ficam sem, e a página lida com isso — melhor buraco visível que
// imagem de outro lugar fazendo as vezes.
const DESTINOS = [
  {
    pais: "peru",
    slug: { pt: "vale-sagrado", en: "sacred-valley", es: "valle-sagrado" },
    name: {
      pt: "Vale Sagrado e Machu Picchu",
      en: "Sacred Valley and Machu Picchu",
      es: "Valle Sagrado y Machu Picchu",
    },
    description: {
      pt: "Vale dos Incas nos Andes peruanos, entre Cusco e Machu Picchu, com sítios cerimoniais e comunidades quéchuas vivas.",
    },
    hero_image: "/images/destinations/peru.png",
    latitude: -13.3236, longitude: -72.0907,
    altitude_m: 2800,
    timezone: "America/Lima",
    // Altitude é o dado que mais muda a preparação da viagem: acima de 2500 m
    // o corpo sente, e o Packing Assistant e o Concierge usam isto.
    climate: { tipo: "montanha", temp_min_c: 4, temp_max_c: 22, estacao_chuvosa: "dez-mar" },
    sort_order: 1,
  },
  {
    pais: "india",
    slug: { pt: "rishikesh", en: "rishikesh", es: "rishikesh" },
    name: {
      pt: "Rishikesh e o Vale do Ganges",
      en: "Rishikesh and the Ganges Valley",
      es: "Rishikesh y el Valle del Ganges",
    },
    description: {
      pt: "Cidade do yoga aos pés do Himalaia, às margens do Ganges, com ashrams e templos milenares.",
    },
    hero_image: "/images/destinations/india.png",
    latitude: 30.0869, longitude: 78.2676,
    altitude_m: 360,
    timezone: "Asia/Kolkata",
    climate: { tipo: "subtropical", temp_min_c: 12, temp_max_c: 38, estacao_chuvosa: "jul-set" },
    sort_order: 2,
  },
  {
    pais: "marrocos",
    slug: { pt: "vale-das-rosas", en: "valley-of-roses", es: "valle-de-las-rosas" },
    name: {
      pt: "Vale das Rosas e Alto Atlas",
      en: "Valley of Roses and High Atlas",
      es: "Valle de las Rosas y Alto Atlas",
    },
    description: {
      pt: "Vale de cultivo de rosas damascenas entre o Alto Atlas e as portas do deserto, na região de Kelaat M'Gouna.",
    },
    hero_image: "/images/destinations/morocco.png",
    latitude: 31.2394, longitude: -6.1361,
    altitude_m: 1450,
    timezone: "Africa/Casablanca",
    climate: { tipo: "desertico", temp_min_c: 6, temp_max_c: 35, estacao_chuvosa: "nov-fev" },
    sort_order: 3,
  },
  {
    pais: "egito",
    slug: { pt: "luxor", en: "luxor", es: "luxor" },
    name: {
      pt: "Luxor e o Vale dos Reis",
      en: "Luxor and the Valley of the Kings",
      es: "Luxor y el Valle de los Reyes",
    },
    description: {
      pt: "Antiga Tebas, com os templos de Karnak e Luxor às margens do Nilo e as tumbas do Vale dos Reis.",
    },
    hero_image: "/images/destinations/egito.jpg",
    latitude: 25.6872, longitude: 32.6396,
    altitude_m: 76,
    timezone: "Africa/Cairo",
    climate: { tipo: "desertico", temp_min_c: 8, temp_max_c: 41, estacao_chuvosa: "nenhuma" },
    sort_order: 4,
  },
  {
    pais: "franca",
    slug: { pt: "sainte-baume", en: "sainte-baume", es: "sainte-baume" },
    name: {
      pt: "Provence e Sainte-Baume",
      en: "Provence and Sainte-Baume",
      es: "Provenza y Sainte-Baume",
    },
    description: {
      pt: "Sul da França, entre a gruta de Sainte-Baume e as vilas da Provence, no caminho ligado a Maria Madalena.",
    },
    hero_image: "/images/destinations/france.png",
    latitude: 43.3286, longitude: 5.7533,
    altitude_m: 950,
    timezone: "Europe/Paris",
    climate: { tipo: "mediterraneo", temp_min_c: 3, temp_max_c: 30, estacao_chuvosa: "out-abr" },
    sort_order: 5,
  },
  {
    pais: "tailandia",
    slug: { pt: "chiang-mai", en: "chiang-mai", es: "chiang-mai" },
    name: {
      pt: "Chiang Mai e o Norte",
      en: "Chiang Mai and the North",
      es: "Chiang Mai y el Norte",
    },
    description: {
      pt: "Norte da Tailândia, com templos budistas nas montanhas e mosteiros que recebem praticantes.",
    },
    hero_image: "/images/destinations/thailand.png",
    latitude: 18.7883, longitude: 98.9853,
    altitude_m: 310,
    timezone: "Asia/Bangkok",
    climate: { tipo: "tropical", temp_min_c: 15, temp_max_c: 36, estacao_chuvosa: "mai-out" },
    sort_order: 6,
  },
  {
    pais: "brasil",
    slug: { pt: "alter-do-chao", en: "alter-do-chao", es: "alter-do-chao" },
    name: {
      pt: "Alter do Chão e Floresta do Tapajós",
      en: "Alter do Chão and the Tapajós Forest",
      es: "Alter do Chão y la Selva del Tapajós",
    },
    // A região estava vazia por falta de informação pública. A página da
    // viagem no site diz: vilarejo a 38 km de Santarém, oeste do Pará, com a
    // Floresta Nacional do Tapajós ao lado. O campo em branco pediu
    // confirmação e recebeu — que é para isso que ele serve.
    description: {
      pt: "Vilarejo às margens do rio Tapajós, a 38 km de Santarém, no oeste do Pará. Praias de água doce na seca, floresta alagada na cheia, e a Floresta Nacional do Tapajós ao lado.",
    },
    hero_image: "/images/destinations/brasil.jpg",
    latitude: -2.5117, longitude: -54.9494,
    // Quase ao nível do rio. O que muda a mala aqui não é altitude, é a
    // combinação de calor, umidade alta e chuva de fim de tarde.
    altitude_m: 20,
    timezone: "America/Santarem",
    climate: { tipo: "equatorial", temp_min_c: 23, temp_max_c: 33, estacao_chuvosa: "dez-mai" },
    sort_order: 7,
  },
];

async function req(caminho, opcoes = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, { headers: cab, ...opcoes });
  const corpo = await r.json().catch(() => null);
  if (r.status >= 400) throw new Error(`HTTP ${r.status} em ${caminho}: ${JSON.stringify(corpo)}`);
  return corpo;
}

// ── Países ─────────────────────────────────────────────────────────────────
console.log("── Países ──");
const idPorSlug = new Map();

for (const p of PAISES) {
  const existentes = await req(`countries?slug=eq.${p.slug}&select=id,slug`);
  const registro = {
    name: { pt: p.pt, en: p.en, es: p.es },
    slug: p.slug,
    code: p.code,
    sort_order: PAISES.indexOf(p) + 1,
  };

  if (existentes.length) {
    idPorSlug.set(p.slug, existentes[0].id);
    if (!SIMULAR) {
      await req(`countries?id=eq.${existentes[0].id}`, {
        method: "PATCH",
        body: JSON.stringify(registro),
      });
    }
    console.log(`  atualizado  ${p.pt}`);
  } else {
    if (SIMULAR) {
      console.log(`  criaria     ${p.pt}`);
      continue;
    }
    const criado = await req("countries", {
      method: "POST",
      headers: { ...cab, Prefer: "return=representation" },
      body: JSON.stringify(registro),
    });
    idPorSlug.set(p.slug, criado[0].id);
    console.log(`  criado      ${p.pt}`);
  }
}

// ── Destinos ───────────────────────────────────────────────────────────────
console.log("");
console.log("── Destinos ──");

for (const d of DESTINOS) {
  const paisId = idPorSlug.get(d.pais);
  if (!paisId) {
    if (SIMULAR) { console.log(`  (simulação) pularia ${d.name.pt}`); continue; }
    throw new Error(`País ${d.pais} não encontrado para ${d.name.pt}`);
  }

  // `pais` é o slug que resolveu o country_id acima; não é coluna da tabela
  // e por isso sai do objeto antes de virar registro.
  const { pais: _slugDoPais, ...campos } = d;
  void _slugDoPais;
  const registro = { ...campos, country_id: paisId, is_active: true };

  // O slug é JSONB; casar por ele exige comparar o campo pt.
  const existentes = await req(
    `destinations?slug->>pt=eq.${encodeURIComponent(d.slug.pt)}&select=id`
  );

  if (SIMULAR) {
    console.log(`  ${existentes.length ? "atualizaria" : "criaria    "} ${d.name.pt}`);
    continue;
  }

  if (existentes.length) {
    await req(`destinations?id=eq.${existentes[0].id}`, {
      method: "PATCH",
      body: JSON.stringify(registro),
    });
    console.log(`  atualizado  ${d.name.pt}`);
  } else {
    await req("destinations", { method: "POST", body: JSON.stringify(registro) });
    console.log(`  criado      ${d.name.pt}`);
  }
}

// ── Conferência ────────────────────────────────────────────────────────────
console.log("");
const paises = await req("countries?select=slug&order=sort_order");
const destinos = await req("destinations?select=name,hero_image,altitude_m&order=sort_order");
console.log(`${paises.length} país(es), ${destinos.length} destino(s) no banco.`);

const semImagem = destinos.filter((d) => !d.hero_image);
if (semImagem.length) {
  console.log("");
  console.log("Sem imagem (a página mostra o card sem foto):");
  for (const d of semImagem) console.log(`  ${d.name.pt}`);
  console.log("  → coloque o arquivo em public/images/destinations/ e rode de novo");
}
