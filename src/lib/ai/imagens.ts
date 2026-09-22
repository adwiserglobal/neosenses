/**
 * Busca imagens de destino no Wikimedia Commons.
 *
 * ── Por que Commons, e não um banco de imagens ────────────────────────────
 *
 * Não exige chave de API — uma configuração a menos para esquecer. E tem foto
 * do lugar específico: "Vale das Rosas, Marrocos" devolve o vale, não uma
 * duna genérica bonita que poderia ser de qualquer deserto do mundo. Num site
 * que vende a viagem para AQUELE lugar, foto genérica é quase propaganda
 * enganosa.
 *
 * ── Licença não é detalhe ─────────────────────────────────────────────────
 *
 * Nem tudo no Commons é livre para uso comercial, e quase tudo que é livre
 * exige atribuição. Publicar foto de terceiro sem crédito é violação de
 * direito autoral — e é o tipo de coisa que só aparece quando chega a
 * notificação.
 *
 * Então: só passam as licenças da lista abaixo, e a atribuição vem junto,
 * gravada com a imagem. Foto sem autor identificável é descartada, mesmo com
 * licença boa — sem o nome não há como creditar.
 *
 * A parte de rede fica em `buscarImagens`; o resto é puro e testado sem rede.
 */

export interface ImagemEncontrada {
  /** Endereço da versão redimensionada, que é a que vai para o site. */
  url: string;
  /** Página no Commons, para conferir a origem. */
  paginaFonte: string;
  titulo: string;
  largura: number;
  altura: number;
  autor: string;
  licenca: string;
  /** Linha de crédito pronta para o rodapé da imagem. */
  credito: string;
}

/**
 * Licenças aceitas.
 *
 * CC BY-NC e CC BY-ND ficam de fora de propósito: NC proíbe uso comercial, e
 * um site que vende viagem é uso comercial. ND proíbe recorte, e o site
 * recorta para caber no card.
 */
const LICENCAS_OK = [
  "cc0", "cc-zero", "public domain", "pd", "pdm",
  "cc by 1.0", "cc by 2.0", "cc by 2.5", "cc by 3.0", "cc by 4.0",
  "cc by-sa 1.0", "cc by-sa 2.0", "cc by-sa 2.5", "cc by-sa 3.0", "cc by-sa 4.0",
];

const LARGURA_MINIMA = 800;

/** Formatos que o navegador mostra. Commons também guarda tif, svg e pdf. */
const EXTENSOES_OK = /\.(jpe?g|png|webp)$/i;

/**
 * O campo Artist vem como HTML — às vezes com link, às vezes com tabela
 * inteira. Vira texto simples.
 */
export function limparAutor(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function licencaAceita(nome: string): boolean {
  const n = nome.toLowerCase().trim();
  return LICENCAS_OK.some((ok) => n === ok || n.startsWith(ok));
}

interface PaginaCommons {
  title?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    thumbwidth?: number;
    thumbheight?: number;
    extmetadata?: Record<string, { value?: string }>;
  }>;
}

/**
 * Filtra e ordena o que a API devolveu.
 *
 * Nunca lança: resposta estranha vira lista vazia, e o admin cadastra a foto
 * à mão como sempre fez.
 */
export function filtrarImagens(bruto: unknown, quantidade = 3): ImagemEncontrada[] {
  const paginas = (bruto as { query?: { pages?: Record<string, PaginaCommons> } })?.query?.pages;
  if (!paginas || typeof paginas !== "object") return [];

  const candidatas: ImagemEncontrada[] = [];

  for (const pagina of Object.values(paginas)) {
    const info = pagina?.imageinfo?.[0];
    if (!info) continue;

    const titulo = (pagina.title ?? "").replace(/^File:/i, "").trim();
    if (!EXTENSOES_OK.test(titulo)) continue;

    const meta = info.extmetadata ?? {};
    const licenca = (meta.LicenseShortName?.value ?? "").trim();
    if (!licencaAceita(licenca)) continue;

    const autor = limparAutor(meta.Artist?.value ?? "");
    // Sem autor não há como creditar, e sem crédito não se publica.
    if (!autor) continue;

    const largura = info.width ?? 0;
    if (largura < LARGURA_MINIMA) continue;

    const url = info.thumburl || info.url;
    if (!url || !/^https:\/\//.test(url)) continue;

    candidatas.push({
      url,
      paginaFonte: info.descriptionurl ?? "",
      titulo,
      largura: info.thumbwidth ?? largura,
      altura: info.thumbheight ?? info.height ?? 0,
      autor,
      licenca,
      credito: `${autor} · ${licenca} · Wikimedia Commons`,
    });
  }

  // Ordena pelo que cabe num card horizontal.
  //
  // Não basta "paisagem antes de retrato": a busca real por Vale Sagrado
  // trouxe um "Sacred Valley Panorama.jpg" de 1600×258 em primeiro lugar —
  // proporção 6:1, que num card vira uma tira fininha sem assunto. Panorama
  // é foto de parede, não de card.
  //
  // A faixa boa é de 1.2 a 2.2 (do 4:3 ao 2:1). Fora dela ainda entra, mas
  // por último.
  const nota = (im: ImagemEncontrada): number => {
    const prop = im.largura / (im.altura || 1);
    if (prop >= 1.2 && prop <= 2.2) return 2; // horizontal utilizável
    if (prop > 2.2) return 0;                 // panorama
    return 1;                                 // quadrada ou vertical
  };

  candidatas.sort((a, b) => {
    const d = nota(b) - nota(a);
    if (d !== 0) return d;
    return b.largura - a.largura;
  });

  // Uma foto por autor: três fotos do mesmo fotógrafo, tiradas na mesma
  // tarde, não variam nada — que é justamente o ponto de ter três.
  const vistos = new Set<string>();
  const escolhidas: ImagemEncontrada[] = [];
  for (const c of candidatas) {
    const chave = c.autor.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    escolhidas.push(c);
    if (escolhidas.length >= quantidade) break;
  }

  // Se não deu para variar de autor, completa com o que sobrou — três fotos
  // do mesmo autor ainda é melhor que uma só.
  if (escolhidas.length < quantidade) {
    for (const c of candidatas) {
      if (escolhidas.includes(c)) continue;
      escolhidas.push(c);
      if (escolhidas.length >= quantidade) break;
    }
  }

  return escolhidas;
}

/** Monta o endereço da consulta. Separado para poder ser conferido no teste. */
export function urlDeBusca(termo: string, limite = 20): string {
  const p = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${termo} filetype:bitmap`,
    gsrnamespace: "6", // arquivos
    gsrlimit: String(limite),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*",
  });
  return `https://commons.wikimedia.org/w/api.php?${p}`;
}

/**
 * Quebra o nome do destino em termos de busca, do mais específico ao mais
 * amplo.
 *
 * Existe porque a primeira rodada real falhou em quatro de oito destinos: o
 * Commons é catalogado majoritariamente em inglês, e "Vale Sagrado e Machu
 * Picchu Peru" não casa com nada — enquanto "Machu Picchu" tem centenas de
 * fotos. O nome que a equipe usa no site é feito para o visitante brasileiro,
 * não para casar com catálogo de acervo.
 *
 * A ordem importa: a primeira tentativa que trouxer foto encerra a busca, e a
 * mais específica é a que traz a foto do lugar certo.
 */
export function termosCandidatos(nome: string, pais = ""): string[] {
  const limpo = nome.trim();
  if (!limpo) return [];

  const termos: string[] = [];
  const add = (t: string) => {
    const v = t.trim().replace(/\s+/g, " ");
    if (v.length >= 3 && !termos.includes(v)) termos.push(v);
  };

  add(pais ? `${limpo} ${pais}` : limpo);

  // "Vale Sagrado e Machu Picchu" vira "Vale Sagrado" e "Machu Picchu". O
  // nome próprio costuma estar num dos lados, e sozinho ele acha.
  const partes = limpo.split(/\s+e\s+(?:o\s+|a\s+|os\s+|as\s+)?/i);
  if (partes.length > 1) {
    // Do fim para o começo: em "Luxor e o Vale dos Reis", o segundo nome
    // costuma ser o mais reconhecível internacionalmente.
    for (const p of [...partes].reverse()) {
      add(pais ? `${p} ${pais}` : p);
      add(p);
    }
  }

  add(limpo);
  if (pais) add(pais);

  return termos.slice(0, 5);
}

async function consultar(termo: string, quantidade: number, timeoutMs: number) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), timeoutMs);
  try {
    const r = await fetch(urlDeBusca(termo), {
      signal: controle.signal,
      headers: {
        // O Commons pede identificação de quem consulta e responde 403 a
        // agente genérico.
        "User-Agent": "NeoSenses/1.0 (https://neosenses.com.br; contato@neosenses.com.br)",
        Accept: "application/json",
      },
    });
    if (!r.ok) {
      console.warn(`[imagens] Commons respondeu HTTP ${r.status} para "${termo}"`);
      return [];
    }
    return filtrarImagens(await r.json(), quantidade);
  } catch (err) {
    console.warn("[imagens] busca falhou:", err instanceof Error ? err.message : err);
    return [];
  } finally {
    clearTimeout(relogio);
  }
}

/**
 * Busca no Commons, tentando os termos em ordem até achar.
 *
 * Devolve lista vazia em qualquer falha — imagem é conveniência, e o cadastro
 * precisa continuar funcionando sem ela.
 */
export async function buscarImagens(
  termo: string,
  quantidade = 3,
  timeoutMs = 12_000,
  pais = ""
): Promise<ImagemEncontrada[]> {
  for (const t of termosCandidatos(termo.slice(0, 120), pais)) {
    const achadas = await consultar(t, quantidade, timeoutMs);
    // Uma foto só não justifica seguir tentando: já dá para publicar, e a
    // próxima tentativa é mais genérica — traria foto de outro lugar.
    if (achadas.length) return achadas;
  }
  return [];
}
