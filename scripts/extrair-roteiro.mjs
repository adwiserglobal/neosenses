/**
 * Tira o roteiro e as inclusões de dentro do texto e põe nas tabelas.
 *
 * A migração do site antigo (`migrar-experiencias.mjs`) despejou tudo na
 * coluna `description`, com este comentário: "as tabelas próprias exigem
 * revisão item a item, e despejar dado de robô nelas cria trabalho de
 * limpeza em vez de poupar". Estava certo para aquele momento.
 *
 * O que mudou: existem quatro experiências marcadas como `roteiro`, e o
 * layout `roteiro` organiza a página inteira em torno do dia a dia. Com o
 * roteiro preso dentro de um bloco de texto, ele renderiza uma parede de
 * markdown cru — os `**Dia 1 —**` aparecem com os asteriscos — e a seção
 * que justifica o template fica vazia.
 *
 * O formato é previsível porque foi um script que o escreveu:
 *
 *     ## Roteiro
 *     **Dia 1 — Título**
 *     corpo até o próximo Dia ou até a próxima seção ##
 *
 * ── O que este script NÃO faz ─────────────────────────────────────────────
 *
 * Não inventa nada e não reescreve texto. Quando um bloco não casa com o
 * formato, ele é deixado onde está e reportado — melhor uma experiência de
 * fora do que um dia com título errado.
 *
 * Não mexe em experiência que já tenha etapas cadastradas: ali alguém já
 * revisou à mão, e sobrescrever apagaria essa revisão.
 *
 * Idempotente: a segunda passagem não acha mais `## Roteiro` na descrição
 * (ela é removida junto) e não faz nada.
 *
 * Uso:
 *   node scripts/extrair-roteiro.mjs --dry      mostra o que faria
 *   node scripts/extrair-roteiro.mjs --local    banco de desenvolvimento
 *   node scripts/extrair-roteiro.mjs            projeto da nuvem
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

/** Corta uma seção `## Nome` do texto e devolve o conteúdo dela. */
function recortarSecao(texto, nome) {
  const inicio = texto.indexOf(`## ${nome}`);
  if (inicio < 0) return { conteudo: null, resto: texto };

  const depois = texto.slice(inicio + `## ${nome}`.length);
  const fim = depois.search(/\n##\s/);
  const conteudo = fim < 0 ? depois : depois.slice(0, fim);
  const resto = texto.slice(0, inicio) + (fim < 0 ? "" : depois.slice(fim));
  return { conteudo: conteudo.trim(), resto: resto.trim() };
}

/**
 * Quebra o bloco do roteiro em dias.
 *
 * O número vem do rótulo `**Dia N —**` e não da posição na lista: um
 * roteiro que pula do dia 3 para o 5 tem que continuar dizendo 5, porque é
 * o que o cliente vai comparar com a passagem aérea.
 *
 * Dia repetido não entra: `itinerary_days` tem chave única em (experiência,
 * dia). Acontece de verdade — a página da Tailândia do site antigo tem
 * DOIS "Dia 11", um do roteiro Norte e outro do Sul, com a numeração
 * sobreposta. Nesse caso o bloco volta para a descrição em vez de sumir:
 * o defeito é do conteúdo, e quem for revisar precisa vê-lo.
 */
function lerDias(bloco) {
  const partes = bloco.split(/\n(?=\*\*Dia\s)/);
  const dias = [];
  const devolvidos = [];
  const vistos = new Set();

  for (const parte of partes) {
    const m = parte.match(/^\*\*Dia\s+(\d+)\s*[—–-]\s*([^*]+)\*\*\s*([\s\S]*)$/);
    if (!m) {
      if (parte.trim()) devolvidos.push(parte.trim());
      continue;
    }
    const numero = Number(m[1]);
    if (!Number.isFinite(numero) || numero < 1 || vistos.has(numero)) {
      devolvidos.push(parte.trim());
      continue;
    }
    vistos.add(numero);
    dias.push({
      numero,
      titulo: m[2].trim().replace(/\s+/g, " ").slice(0, 200),
      descricao: m[3].trim().slice(0, 4000) || null,
    });
  }
  return { dias, devolvidos };
}

/** Itens de uma lista `- texto`. */
function lerItens(bloco) {
  if (!bloco) return [];
  return bloco
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter((l) => l.length > 1 && !l.startsWith("#"))
    .slice(0, 40);
}

const pt = (texto) => ({ pt: texto });

console.log(`\nBanco: ${LOCAL ? "LOCAL" : "NUVEM"} — ${U}\n`);

const experiencias = await req(
  "experiences?select=id,slug,description,template&order=created_at"
);

let tratadas = 0;
let puladas = 0;

for (const e of experiencias) {
  const slug = e.slug?.pt ?? "?";
  const texto = e.description?.pt ?? "";
  if (!texto.includes("## Roteiro") && !texto.includes("## Incluso")) continue;

  const jaTem = await req(`itinerary_days?experience_id=eq.${e.id}&select=id&limit=1`);
  if (jaTem.length) {
    console.log(`  pulada      ${slug}  (já tem roteiro cadastrado — revisão à mão não se sobrescreve)`);
    puladas++;
    continue;
  }

  let restante = texto;
  const roteiro = recortarSecao(restante, "Roteiro");
  restante = roteiro.resto;
  const incluso = recortarSecao(restante, "Incluso");
  restante = incluso.resto;
  const naoIncluso = recortarSecao(restante, "Não incluso");
  restante = naoIncluso.resto;

  const { dias, devolvidos } = roteiro.conteudo
    ? lerDias(roteiro.conteudo)
    : { dias: [], devolvidos: [] };
  const itensIncluso = lerItens(incluso.conteudo);
  const itensNaoIncluso = lerItens(naoIncluso.conteudo);

  // O que não virou tabela volta para o texto, sob um título que diz o que
  // é. Sem isso o trecho desapareceria do site e do banco de uma vez.
  if (devolvidos.length) {
    restante = `${restante}\n\n## Roteiro — trechos a revisar\n\n${devolvidos.join("\n\n")}`.trim();
  }

  // Nada reconhecido: deixa como está. Recortar a seção do texto sem
  // conseguir preencher a tabela perderia o conteúdo dos dois lados.
  if (dias.length === 0 && itensIncluso.length === 0 && itensNaoIncluso.length === 0) {
    console.log(`  sem formato ${slug}  (nada casou com o padrão — texto intacto)`);
    puladas++;
    continue;
  }

  console.log(
    `  ${SIMULAR ? "faria     " : "extraída  "}  ${slug.slice(0, 44).padEnd(46)} ` +
      `${String(dias.length).padStart(2)} dias · ${String(itensIncluso.length).padStart(2)} inclusos · ` +
      `${String(itensNaoIncluso.length).padStart(2)} não · texto ${texto.length}→${restante.length}` +
      (devolvidos.length
        ? `  [${devolvidos.length} bloco(s) fora do padrão devolvido(s) ao texto — REVISAR]`
        : "")
  );

  if (SIMULAR) {
    tratadas++;
    continue;
  }

  if (dias.length) {
    await req("itinerary_days", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify(
        dias.map((d, i) => ({
          experience_id: e.id,
          day_number: d.numero,
          title: pt(d.titulo),
          description: d.descricao ? pt(d.descricao) : null,
          sort_order: i,
        }))
      ),
    });
  }

  const inclusoes = [
    ...itensIncluso.map((t, i) => ({
      experience_id: e.id,
      text: pt(t),
      is_included: true,
      sort_order: i,
    })),
    ...itensNaoIncluso.map((t, i) => ({
      experience_id: e.id,
      text: pt(t),
      is_included: false,
      sort_order: 100 + i,
    })),
  ];
  if (inclusoes.length) {
    // Substitui o que houver: sem chave natural, um segundo POST duplicaria.
    await req(`experience_inclusions?experience_id=eq.${e.id}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
    await req("experience_inclusions", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify(inclusoes),
    });
  }

  // A descrição perde só o que virou tabela. O resto do texto continua.
  await req(`experiences?id=eq.${e.id}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ description: pt(restante) }),
  });

  tratadas++;
}

console.log(
  `\n${tratadas} experiência(s) ${SIMULAR ? "seriam tratadas" : "tratadas"}, ${puladas} pulada(s).\n`
);
