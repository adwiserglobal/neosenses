/**
 * Auditoria de conteúdo: procura o que passa despercebido numa revisão.
 *
 * Nasceu do item 6.1 do documento de reformulação — "no card do Egito,
 * trocar o texto que atualmente descreve o Peru". Esse erro existe porque
 * uma página herdou o texto de outra, e ninguém percebeu: o card fica
 * bonito, o build passa e o site publica um destino descrevendo outro.
 *
 * Em vez de corrigir aquele caso à mão, o script procura a CLASSE do erro,
 * e mais quatro que vieram junto na migração do site antigo:
 *
 *   1. destino trocado — o texto fala de um lugar que não é o cadastrado
 *   2. markdown cru — `**Dia 1 —**` e `## Seção` renderizam com os símbolos
 *   3. preço ou data dentro do texto — envelhece sem ninguém notar, e foi
 *      justamente o que a migração tirou dos campos próprios
 *   4. seção obrigatória vazia — das oito do esqueleto (documento, passo 5)
 *   5. publicada sem o essencial — sem capa, sem resumo, sem destino
 *
 * Só LÊ. Não corrige nada: texto de conteúdo é da equipe, e um robô
 * reescrevendo descrição é como o preço em dólar chegou ao ar.
 *
 * Uso:
 *   node scripts/conferir-conteudo.mjs --local
 *   node scripts/conferir-conteudo.mjs
 *
 * Sai com código 1 se achar algo grave, para poder entrar num check.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
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
  console.error(`Faltam as chaves em ${arquivo}.`);
  process.exit(1);
}
const cab = { apikey: S, Authorization: `Bearer ${S}` };
const q = async (c) => {
  const r = await fetch(`${U}/rest/v1/${c}`, { headers: cab });
  if (!r.ok) throw new Error(`${c} → ${r.status} ${await r.text()}`);
  return r.json();
};

/**
 * Palavras que denunciam um território, agrupadas por lugar.
 *
 * A lista é curta de propósito: só termos que praticamente não aparecem
 * fora do lugar deles. "Templo" está em toda parte, "Machu Picchu" não.
 */
const TERRITORIOS = {
  Peru: ["machu picchu", "cusco", "vale sagrado", "inca", "humantay", "titicaca", "andes", "aguas calientes"],
  Egito: ["pirâmide", "nilo", "luxor", "assuã", "faraó", "karnak", "gizé"],
  Índia: ["ganges", "rishikesh", "varanasi", "ashram", "himalaia"],
  Marrocos: ["marrakech", "saara", "medina", "fès", "berbere", "casablanca", "riad"],
  Tailândia: ["bangkok", "chiang mai", "krabi", "ayutthaya", "sukhothai"],
  Brasil: ["chapada", "veadeiros", "alter do chão", "amazônia", "rio negro", "tapajós"],
  França: ["provence", "marselha", "sainte-baume", "camargue"],
};

const semAcento = (t) =>
  (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function territoriosCitados(texto) {
  const alvo = semAcento(texto);
  const achados = [];
  for (const [lugar, termos] of Object.entries(TERRITORIOS)) {
    const quantos = termos.filter((t) => alvo.includes(semAcento(t))).length;
    if (quantos > 0) achados.push({ lugar, quantos });
  }
  return achados.sort((a, b) => b.quantos - a.quantos);
}

const pt = (campo) => (campo && typeof campo === "object" ? campo.pt ?? "" : "");

console.log(`\nBanco: ${LOCAL ? "LOCAL" : "NUVEM"} — ${U}\n`);

const experiencias = await q(
  "experiences?select=*,destination:destinations(name,country:countries(name))&order=created_at"
);

const graves = [];
const avisos = [];

for (const e of experiencias) {
  const slug = pt(e.slug) || e.id.slice(0, 8);
  const titulo = pt(e.title);
  const textoTodo = [
    pt(e.short_description),
    pt(e.description),
    pt(e.who_is_this_for),
    pt(e.why_created),
  ].join("\n");

  // 1. Destino trocado
  const destinoCadastrado = e.destination ? pt(e.destination.name) : "";
  const paisCadastrado = e.destination?.country ? pt(e.destination.country.name) : "";
  const citados = territoriosCitados(`${titulo}\n${textoTodo}`);
  if (citados.length > 0 && (destinoCadastrado || paisCadastrado || titulo)) {
    const contexto = semAcento(`${titulo} ${destinoCadastrado} ${paisCadastrado}`);
    const dominante = citados[0];
    const bateComOCadastro =
      contexto.includes(semAcento(dominante.lugar)) ||
      TERRITORIOS[dominante.lugar].some((t) => contexto.includes(semAcento(t)));

    // Dois territórios fortes e nenhum deles é o da página: é o caso do
    // Egito com texto do Peru.
    if (!bateComOCadastro && dominante.quantos >= 2) {
      graves.push({
        slug,
        problema: `texto fala de ${dominante.lugar} (${dominante.quantos} termos), mas a página é "${titulo}"${
          destinoCadastrado ? ` / destino ${destinoCadastrado}` : ""
        }`,
      });
    }
  }

  // 2. Markdown cru
  if (/\*\*|^##\s|\n##\s/m.test(textoTodo)) {
    const amostra = textoTodo.match(/(\*\*[^*\n]{0,40}\*\*|##[^\n]{0,40})/)?.[0] ?? "";
    graves.push({ slug, problema: `markdown cru no texto — aparece com os símbolos na tela: "${amostra.trim()}"` });
  }

  // 3. Preço ou data dentro do texto
  const preco = textoTodo.match(/R\$\s?[\d.]{3,}|US\$\s?[\d.]{3,}/);
  if (preco) {
    avisos.push({ slug, problema: `valor no meio do texto ("${preco[0]}") — envelhece sem ninguém notar` });
  }
  const dataVencida = textoTodo.match(/\b(20(1\d|2[0-5]))\b/);
  if (dataVencida) {
    avisos.push({ slug, problema: `ano de ${dataVencida[0]} no texto — conferir se ainda faz sentido` });
  }

  if (e.status !== "published") continue;

  // 4. Seções obrigatórias vazias (só nas de viajante: o esqueleto é delas)
  if (e.audience === "viajante") {
    const faltando = [
      ["2. introdução", pt(e.short_description)],
      ["3. por que criamos", pt(e.why_created)],
      ["4. o que é", pt(e.description)],
      ["5. por que participar", pt(e.value_proposition)],
      ["7. apenas relaxe", pt(e.relax_text)],
    ]
      .filter(([, v]) => !v)
      .map(([nome]) => nome);
    if (faltando.length) {
      avisos.push({ slug, problema: `seções do padrão sem texto: ${faltando.join(", ")}` });
    }
  }

  // 5. Publicada sem o essencial
  if (!e.hero_image) graves.push({ slug, problema: "publicada SEM imagem de capa" });
  if (!pt(e.short_description)) graves.push({ slug, problema: "publicada SEM resumo" });
  if (e.audience === "viajante" && !e.destination_id) {
    avisos.push({ slug, problema: "publicada sem destino — some do filtro por destino" });
  }
}

if (graves.length) {
  console.log("── GRAVES — corrigir antes de divulgar ────────────────────────");
  for (const g of graves) console.log(`  ${g.slug.slice(0, 40).padEnd(42)} ${g.problema}`);
  console.log("");
}

if (avisos.length) {
  console.log("── Avisos — conferir quando der ───────────────────────────────");
  for (const a of avisos) console.log(`  ${a.slug.slice(0, 40).padEnd(42)} ${a.problema}`);
  console.log("");
}

console.log(
  `${experiencias.length} experiência(s) conferida(s): ${graves.length} grave(s), ${avisos.length} aviso(s).\n`
);
// `process.exitCode` e não `process.exit()`: sair com requisição ainda
// pendente faz o Node no Windows abortar com "Assertion failed" sobre um
// handle do libuv, e o código de saída se perde no meio.
process.exitCode = graves.length ? 1 : 0;
