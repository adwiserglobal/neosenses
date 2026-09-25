import { lookup } from "node:dns/promises";
import net from "node:net";
import { generateAIResponse, type AIResponse } from "@/lib/ai/provider";

const MAX_HTML = 500_000;
const MAX_TEXTO = 55_000;
const MAX_IMAGENS = 40;

export interface PaginaExtraida {
  url: string;
  plataforma: string;
  titulo: string;
  descricao: string;
  imagemSocial: string | null;
  canonical: string | null;
  texto: string;
  imagens: string[];
  jsonLd: unknown[];
}

export interface ItinerarioImportado {
  dia: number;
  titulo: string;
  descricao?: string;
  local?: string;
  imagem?: string;
}

export interface DestaqueImportado {
  titulo: string;
  descricao?: string;
  grupo?: string;
  grupoTitulo?: string;
}

export interface InclusaoImportada {
  texto: string;
  incluido: boolean;
}

export interface FaqImportado {
  pergunta: string;
  resposta: string;
}

export interface DataImportada {
  inicio: string;
  fim: string;
  preco?: number | null;
  vagas?: number | null;
}

export interface ExperienciaEstruturada {
  titulo: string;
  slug: string;
  resumo: string;
  descricao: string;
  paraQuem: string;
  heroKicker: string;
  subtitulo: string;
  periodo: string;
  porQueCriamos: string;
  propostaDeValor: string;
  relaxText: string;
  closingTitle: string;
  closingText: string;
  audience: "viajante" | "facilitador";
  template: "classico" | "roteiro" | "territorio" | "convite";
  durationDays: number | null;
  groupMin: number | null;
  groupMax: number | null;
  difficulty: "beginner" | "intermediate" | "advanced" | "all_levels";
  physicalDemand: number | null;
  priceFrom: number | null;
  currency: string;
  intentions: string[];
  heroImage: string | null;
  categoryHint: string;
  itinerary: ItinerarioImportado[];
  highlights: DestaqueImportado[];
  inclusions: InclusaoImportada[];
  faqs: FaqImportado[];
  dates: DataImportada[];
  imagens: string[];
  avisoIA?: string;
  ai?: Pick<AIResponse, "provider" | "model">;
}

function ehIpPrivado(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }

  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    return x === "::1" || x === "::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb");
  }

  return true;
}

export async function validarUrlPublica(valor: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(valor.trim());
  } catch {
    throw new Error("Cole uma URL válida começando com http:// ou https://.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Só é possível importar páginas HTTP ou HTTPS.");
  }
  if (url.username || url.password) throw new Error("URLs com usuário ou senha não são aceitas.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("A URL usa uma porta não permitida.");

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Esse endereço não é público.");
  }

  if (net.isIP(host)) {
    if (ehIpPrivado(host)) throw new Error("Esse endereço aponta para uma rede privada.");
  } else {
    const enderecos = await lookup(host, { all: true, verbatim: true });
    if (!enderecos.length || enderecos.some((e) => ehIpPrivado(e.address))) {
      throw new Error("O domínio não resolve para um endereço público seguro.");
    }
  }

  return url;
}

async function fetchComRedirectSeguro(urlInicial: URL, timeoutMs = 15_000): Promise<Response> {
  let atual = urlInicial;

  for (let i = 0; i < 5; i++) {
    await validarUrlPublica(atual.href);
    const res = await fetch(atual, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": "NeoSensesImporter/1.0 (+https://neosenses.com.br)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.7",
      },
      cache: "no-store",
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) throw new Error("O site respondeu com redirecionamento inválido.");
      atual = new URL(location, atual);
      continue;
    }

    return res;
  }

  throw new Error("A página redirecionou vezes demais.");
}

function decodificarEntidades(texto: string): string {
  const mapa: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    hellip: "…",
  };

  return texto
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => mapa[String(n).toLowerCase()] ?? m);
}

function limparTextoHtml(html: string): string {
  return decodificarEntidades(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
      .replace(/<(br|\/p|\/div|\/section|\/article|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function atributos(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[m[1].toLowerCase()] = decodificarEntidades(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

function meta(html: string, nomes: string[]): string {
  const procurados = new Set(nomes.map((n) => n.toLowerCase()));
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = atributos(m[0]);
    const chave = (a.property || a.name || a.itemprop || "").toLowerCase();
    if (procurados.has(chave) && a.content?.trim()) return a.content.trim();
  }
  return "";
}

function absoluto(valor: string, base: URL): string | null {
  if (!valor || valor.startsWith("data:") || valor.startsWith("blob:")) return null;
  try {
    const u = new URL(valor, base);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function extrairImagens(html: string, base: URL, social?: string): string[] {
  const candidatas: string[] = [];
  if (social) candidatas.push(social);

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const a = atributos(m[0]);
    const src = a.src || a["data-src"] || a["data-lazy-src"] || a["data-original"];
    if (src) candidatas.push(src);
    if (a.srcset) {
      const maior = a.srcset.split(",").map((x) => x.trim().split(/\s+/)[0]).filter(Boolean).pop();
      if (maior) candidatas.push(maior);
    }
  }

  const vistas = new Set<string>();
  const saida: string[] = [];
  for (const c of candidatas) {
    const u = absoluto(c, base);
    if (!u || vistas.has(u)) continue;
    if (/\.(svg|ico)(?:\?|$)/i.test(u)) continue;
    vistas.add(u);
    saida.push(u);
    if (saida.length >= MAX_IMAGENS) break;
  }
  return saida;
}

function extrairJsonLd(html: string): unknown[] {
  const saida: unknown[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const valor = JSON.parse(decodificarEntidades(m[1].trim()));
      if (Array.isArray(valor)) saida.push(...valor);
      else saida.push(valor);
    } catch {
      // JSON-LD malformado não impede a importação do resto da página.
    }
    if (saida.length >= 20) break;
  }
  return saida;
}

function plataformaDe(html: string): string {
  const h = html.toLowerCase();
  if (h.includes("wixstatic.com") || h.includes("wix.com")) return "Wix";
  if (h.includes("webflow") || h.includes("website-files.com")) return "Webflow";
  if (h.includes("framerusercontent.com") || h.includes("data-framer")) return "Framer";
  if (h.includes("wp-content") || h.includes("wordpress")) return "WordPress";
  if (h.includes("squarespace")) return "Squarespace";
  if (h.includes("shopify")) return "Shopify";
  return "Site externo";
}

async function tentarLeitor(url: URL): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url.href}`, {
      signal: AbortSignal.timeout(18_000),
      headers: { Accept: "text/plain" },
      cache: "no-store",
    });
    if (!res.ok) return "";
    return (await res.text()).slice(0, MAX_TEXTO).trim();
  } catch {
    return "";
  }
}

export async function extrairPagina(valor: string): Promise<PaginaExtraida> {
  const inicial = await validarUrlPublica(valor);
  const res = await fetchComRedirectSeguro(inicial);
  if (!res.ok) throw new Error(`O site respondeu HTTP ${res.status}.`);

  const tipo = res.headers.get("content-type") ?? "";
  if (tipo && !/text\/html|application\/xhtml\+xml/i.test(tipo)) {
    throw new Error("A URL não aponta para uma página HTML.");
  }

  const html = (await res.text()).slice(0, MAX_HTML);
  const base = new URL(res.url || inicial.href);
  const tituloTag = decodificarEntidades(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const titulo = meta(html, ["og:title", "twitter:title"]) || tituloTag;
  const descricao = meta(html, ["og:description", "description", "twitter:description"]);
  const socialBruta = meta(html, ["og:image", "twitter:image", "twitter:image:src"]);
  const imagemSocial = socialBruta ? absoluto(socialBruta, base) : null;
  const canonicalBruta = html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i)?.[0];
  const canonicalAttr = canonicalBruta ? atributos(canonicalBruta).href : "";
  const canonical = canonicalAttr ? absoluto(canonicalAttr, base) : null;
  const textoHtml = limparTextoHtml(html).slice(0, MAX_TEXTO);
  const textoReader = textoHtml.length < 12_000 ? await tentarLeitor(base) : "";
  const texto = textoReader.length > textoHtml.length ? textoReader : textoHtml;

  if (texto.length < 100 && !titulo) {
    throw new Error("Não consegui ler conteúdo útil dessa página. Ela pode bloquear robôs ou exigir login.");
  }

  return {
    url: base.href,
    plataforma: plataformaDe(html),
    titulo,
    descricao,
    imagemSocial,
    canonical,
    texto,
    imagens: extrairImagens(html, base, socialBruta),
    jsonLd: extrairJsonLd(html),
  };
}

function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function texto(v: unknown, max = 8000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function listaTexto(v: unknown, limite = 20): string[] {
  return Array.isArray(v) ? v.map((x) => texto(x, 120)).filter(Boolean).slice(0, limite) : [];
}
function urlOuNulo(v: unknown): string | null {
  const s = texto(v, 1200);
  try {
    const u = new URL(s);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function jsonDaResposta(conteudo: string): Record<string, unknown> {
  const limpo = conteudo.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(limpo) as Record<string, unknown>;
  } catch {
    const inicio = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    if (inicio >= 0 && fim > inicio) return JSON.parse(limpo.slice(inicio, fim + 1)) as Record<string, unknown>;
    throw new Error("A IA não devolveu JSON válido.");
  }
}

function normalizarEstrutura(raw: Record<string, unknown>, pagina: PaginaExtraida): ExperienciaEstruturada {
  const titulo = texto(raw.titulo, 160) || pagina.titulo || "Experiência importada";
  const audience = raw.audience === "facilitador" ? "facilitador" : "viajante";
  const templatePermitido = ["classico", "roteiro", "territorio", "convite"].includes(String(raw.template))
    ? (raw.template as ExperienciaEstruturada["template"])
    : audience === "facilitador" ? "territorio" : "classico";
  const difficulty = ["beginner", "intermediate", "advanced", "all_levels"].includes(String(raw.difficulty))
    ? (raw.difficulty as ExperienciaEstruturada["difficulty"])
    : "all_levels";

  const itinerary = Array.isArray(raw.itinerary)
    ? raw.itinerary
        .map((x, i) => {
          const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return {
            dia: num(o.dia, 1, 90) ?? i + 1,
            titulo: texto(o.titulo, 220),
            descricao: texto(o.descricao, 5000),
            local: texto(o.local, 220),
            imagem: urlOuNulo(o.imagem) ?? undefined,
          };
        })
        .filter((x) => x.titulo)
        .slice(0, 45)
    : [];

  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights
        .map((x) => {
          const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return { titulo: texto(o.titulo, 220), descricao: texto(o.descricao, 1200), grupo: texto(o.grupo, 80), grupoTitulo: texto(o.grupoTitulo, 180) };
        })
        .filter((x) => x.titulo)
        .slice(0, 36)
    : [];

  const inclusions = Array.isArray(raw.inclusions)
    ? raw.inclusions
        .map((x) => {
          const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return { texto: texto(o.texto, 500), incluido: o.incluido !== false };
        })
        .filter((x) => x.texto)
        .slice(0, 40)
    : [];

  const faqs = Array.isArray(raw.faqs)
    ? raw.faqs
        .map((x) => {
          const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return { pergunta: texto(o.pergunta, 500), resposta: texto(o.resposta, 3000) };
        })
        .filter((x) => x.pergunta && x.resposta)
        .slice(0, 30)
    : [];

  const dates = Array.isArray(raw.dates)
    ? raw.dates
        .map((x) => {
          const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return {
            inicio: texto(o.inicio, 10),
            fim: texto(o.fim, 10),
            preco: num(o.preco, 0, 10_000_000),
            vagas: num(o.vagas, 1, 10_000),
          };
        })
        .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.inicio) && /^\d{4}-\d{2}-\d{2}$/.test(x.fim) && x.fim >= x.inicio)
        .slice(0, 20)
    : [];

  const imagensIA = listaTexto(raw.imagens, MAX_IMAGENS).map(urlOuNulo).filter((x): x is string => Boolean(x));
  const imagens = Array.from(new Set([...(pagina.imagemSocial ? [pagina.imagemSocial] : []), ...imagensIA, ...pagina.imagens])).slice(0, MAX_IMAGENS);

  return {
    titulo,
    slug: slugificar(texto(raw.slug, 90) || titulo),
    resumo: texto(raw.resumo, 500) || pagina.descricao.slice(0, 500),
    descricao: texto(raw.descricao, 8000) || pagina.texto.slice(0, 8000),
    paraQuem: texto(raw.paraQuem, 2000),
    heroKicker: texto(raw.heroKicker, 120),
    subtitulo: texto(raw.subtitulo, 200),
    periodo: texto(raw.periodo, 120),
    porQueCriamos: texto(raw.porQueCriamos, 4000),
    propostaDeValor: texto(raw.propostaDeValor, 2000),
    relaxText: texto(raw.relaxText, 4000),
    closingTitle: texto(raw.closingTitle, 200),
    closingText: texto(raw.closingText, 2000),
    audience,
    template: templatePermitido,
    durationDays: num(raw.durationDays, 1, 365),
    groupMin: num(raw.groupMin, 1, 10000),
    groupMax: num(raw.groupMax, 1, 10000),
    difficulty,
    physicalDemand: num(raw.physicalDemand, 1, 5),
    priceFrom: num(raw.priceFrom, 0, 10_000_000),
    currency: /^[A-Z]{3}$/.test(texto(raw.currency, 3).toUpperCase()) ? texto(raw.currency, 3).toUpperCase() : "BRL",
    intentions: listaTexto(raw.intentions, 12).map(slugificar).filter(Boolean),
    heroImage: urlOuNulo(raw.heroImage) || pagina.imagemSocial || imagens[0] || null,
    categoryHint: texto(raw.categoryHint, 100),
    itinerary,
    highlights,
    inclusions,
    faqs,
    dates,
    imagens,
  };
}

function fallback(pagina: PaginaExtraida, motivo: string): ExperienciaEstruturada {
  const titulo = pagina.titulo || "Experiência importada";
  return {
    titulo,
    slug: slugificar(titulo),
    resumo: pagina.descricao.slice(0, 500),
    descricao: pagina.texto.slice(0, 8000),
    paraQuem: "",
    heroKicker: "",
    subtitulo: "",
    periodo: "",
    porQueCriamos: "",
    propostaDeValor: "",
    relaxText: "",
    closingTitle: "",
    closingText: "",
    audience: "viajante",
    template: "classico",
    durationDays: null,
    groupMin: null,
    groupMax: null,
    difficulty: "all_levels",
    physicalDemand: null,
    priceFrom: null,
    currency: "BRL",
    intentions: [],
    heroImage: pagina.imagemSocial || pagina.imagens[0] || null,
    categoryHint: "",
    itinerary: [],
    highlights: [],
    inclusions: [],
    faqs: [],
    dates: [],
    imagens: pagina.imagens,
    avisoIA: motivo,
  };
}

export async function estruturarExperiencia(pagina: PaginaExtraida): Promise<ExperienciaEstruturada> {
  const hoje = new Date().toISOString().slice(0, 10);
  const jsonLd = JSON.stringify(pagina.jsonLd).slice(0, 18_000);
  const imagens = pagina.imagens.slice(0, 25).join("\n");

  const sistema = `Você converte páginas de viagens, retiros e experiências para o CMS NeoSenses.\nNão invente fatos. Preserve o conteúdo, tom e informações comerciais da página de origem.\nSe algo não estiver claramente presente, use string vazia, null ou array vazio.\nDatas só podem ser YYYY-MM-DD quando o ano estiver claro. Hoje é ${hoje}.\nEscolha audience=facilitador somente se a página vender uma parceria para terapeutas/facilitadores levarem o próprio grupo. Caso contrário use viajante.\nEscolha template: roteiro quando houver dia a dia substancial; territorio/convite apenas para audience facilitador; senão classico.\nRetorne SOMENTE JSON válido.`;

  const usuario = `URL: ${pagina.url}\nPlataforma: ${pagina.plataforma}\nTítulo meta: ${pagina.titulo}\nDescrição meta: ${pagina.descricao}\nImagem social: ${pagina.imagemSocial ?? ""}\nCanonical: ${pagina.canonical ?? ""}\n\nIMAGENS ENCONTRADAS:\n${imagens}\n\nJSON-LD:\n${jsonLd}\n\nCONTEÚDO DA PÁGINA:\n${pagina.texto.slice(0, MAX_TEXTO)}\n\nTransforme para este formato exato:\n{
  "titulo":"",
  "slug":"",
  "resumo":"",
  "descricao":"",
  "paraQuem":"",
  "heroKicker":"",
  "subtitulo":"",
  "periodo":"",
  "porQueCriamos":"",
  "propostaDeValor":"",
  "relaxText":"",
  "closingTitle":"",
  "closingText":"",
  "audience":"viajante|facilitador",
  "template":"classico|roteiro|territorio|convite",
  "durationDays":null,
  "groupMin":null,
  "groupMax":null,
  "difficulty":"beginner|intermediate|advanced|all_levels",
  "physicalDemand":null,
  "priceFrom":null,
  "currency":"BRL",
  "intentions":[],
  "heroImage":null,
  "categoryHint":"",
  "imagens":[],
  "itinerary":[{"dia":1,"titulo":"","descricao":"","local":"","imagem":""}],
  "highlights":[{"titulo":"","descricao":"","grupo":"","grupoTitulo":""}],
  "inclusions":[{"texto":"","incluido":true}],
  "faqs":[{"pergunta":"","resposta":""}],
  "dates":[{"inicio":"YYYY-MM-DD","fim":"YYYY-MM-DD","preco":null,"vagas":null}]
}`;

  try {
    const resposta = await generateAIResponse(
      [
        { role: "system", content: sistema },
        { role: "user", content: usuario },
      ],
      null,
      { json: true, temperature: 0.1, maxTokens: 6500, timeoutMs: 40_000 }
    );
    const estrutura = normalizarEstrutura(jsonDaResposta(resposta.content), pagina);
    estrutura.ai = { provider: resposta.provider, model: resposta.model };
    return estrutura;
  } catch (err) {
    const motivo = err instanceof Error ? err.message : "Falha desconhecida da IA";
    return fallback(pagina, `A IA não conseguiu estruturar tudo; foi criado um rascunho básico. ${motivo}`);
  }
}

export async function baixarImagemPublica(valor: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const url = await validarUrlPublica(valor);
    const res = await fetchComRedirectSeguro(url, 9_000);
    if (!res.ok) return null;
    const tipo = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(tipo)) return null;
    const tamanho = Number(res.headers.get("content-length") || 0);
    if (tamanho > 8_388_608) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 8_388_608) return null;
    return { bytes: new Uint8Array(buffer), contentType: tipo };
  } catch {
    return null;
  }
}
