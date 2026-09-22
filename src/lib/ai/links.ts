/**
 * Transforma o texto da resposta do Concierge em trechos, marcando o que vira
 * link clicável.
 *
 * ── Por que existe ────────────────────────────────────────────────────────
 *
 * A resposta era renderizada como texto puro. Quando o Concierge terminava
 * com "fale com a equipe: https://wa.me/5511947188319", o endereço aparecia
 * como texto morto — a pessoa tinha que selecionar, copiar e colar. Num
 * celular, isso é o fim da conversa.
 *
 * ── Por que NEM TUDO vira link ────────────────────────────────────────────
 *
 * O texto vem de um modelo de linguagem. Linkar qualquer URL que ele escreva
 * é transformar alucinação em clique: bastaria ele inventar um endereço
 * parecido com o da casa para o site entregar o visitante em outro lugar,
 * com a credibilidade de quem foi encaminhado pela empresa.
 *
 * Então a regra é lista de permissão, não de bloqueio:
 *
 *   • wa.me, e SÓ com o número configurado em NEXT_PUBLIC_WHATSAPP_NUMBER
 *   • caminho interno do próprio site (/experiencias/…)
 *   • endereço do próprio domínio, convertido para caminho interno
 *   • e-mail do domínio da casa
 *
 * Qualquer outra coisa continua texto. Fica visível para quem lê — que é o
 * comportamento honesto — e não vira porta.
 */

export type Trecho =
  | { tipo: "texto"; valor: string }
  | { tipo: "link"; valor: string; href: string; externo: boolean };

const NUMERO_PADRAO = "5511947188319";
const DOMINIOS_DA_CASA = ["neosenses.com.br", "www.neosenses.com.br", "neosenses.vercel.app"];

/**
 * Casa URLs, caminhos internos e e-mails.
 *
 * A pontuação final fica de fora do link de propósito: "veja em
 * https://wa.me/551199." tem o ponto como fim de frase, não como parte do
 * endereço. Sem isso, o link quebra.
 */
const PADRAO =
  /(https?:\/\/[^\s<>"')\]]+|\/(?:experiencias|destinos|blog|planejar|contato|sobre|legal)(?:\/[^\s<>"')\]]*)?|[\w.+-]+@[\w-]+\.[\w.-]+)/gi;

function limparFim(bruto: string): { url: string; sobra: string } {
  const m = bruto.match(/[.,;:!?)\]]+$/);
  if (!m) return { url: bruto, sobra: "" };
  return { url: bruto.slice(0, -m[0].length), sobra: m[0] };
}

interface Opcoes {
  /** Número do WhatsApp aceito. Outro número não vira link. */
  numeroWhatsApp?: string;
}

export function partirEmLinks(texto: string, opcoes: Opcoes = {}): Trecho[] {
  if (!texto) return [];

  const numero = (opcoes.numeroWhatsApp || NUMERO_PADRAO).replace(/\D/g, "");
  const trechos: Trecho[] = [];
  let ultimo = 0;

  for (const achado of texto.matchAll(PADRAO)) {
    const bruto = achado[0];
    const inicio = achado.index!;
    const { url, sobra } = limparFim(bruto);

    const decidido = decidir(url, numero);

    // Não permitido: segue como texto, sem interromper o trecho.
    if (!decidido) continue;

    if (inicio > ultimo) {
      trechos.push({ tipo: "texto", valor: texto.slice(ultimo, inicio) });
    }
    trechos.push(decidido);
    if (sobra) trechos.push({ tipo: "texto", valor: sobra });
    ultimo = inicio + bruto.length;
  }

  if (ultimo < texto.length) {
    trechos.push({ tipo: "texto", valor: texto.slice(ultimo) });
  }

  return trechos.length ? trechos : [{ tipo: "texto", valor: texto }];
}

function decidir(url: string, numeroAceito: string): Trecho | null {
  // ── E-mail ───────────────────────────────────────────────────────────────
  if (!url.includes("/") && url.includes("@")) {
    const dominio = url.split("@")[1]?.toLowerCase() ?? "";
    if (!DOMINIOS_DA_CASA.some((d) => dominio === d || dominio === d.replace(/^www\./, ""))) {
      return null;
    }
    return { tipo: "link", valor: url, href: `mailto:${url}`, externo: false };
  }

  // ── Caminho interno ──────────────────────────────────────────────────────
  if (url.startsWith("/")) {
    return { tipo: "link", valor: url, href: url, externo: false };
  }

  let alvo: URL;
  try {
    alvo = new URL(url);
  } catch {
    return null;
  }

  // Só http(s). javascript: e data: nem chegam aqui pelo padrão, mas a
  // checagem fica porque o custo é uma linha e o erro seria grave.
  if (alvo.protocol !== "http:" && alvo.protocol !== "https:") return null;

  const host = alvo.hostname.toLowerCase();

  // ── WhatsApp ─────────────────────────────────────────────────────────────
  if (host === "wa.me" || host === "api.whatsapp.com") {
    const digitos = (alvo.pathname + alvo.search).replace(/\D/g, "");
    // Número diferente do da casa não vira link: a IA escrevendo outro
    // número é exatamente o que não pode virar clique.
    if (!digitos.startsWith(numeroAceito)) return null;
    return { tipo: "link", valor: url, href: url, externo: true };
  }

  // ── Domínio da casa ──────────────────────────────────────────────────────
  if (DOMINIOS_DA_CASA.includes(host)) {
    // Vira caminho interno: navegação sem recarregar, e continua funcionando
    // se o domínio mudar.
    return {
      tipo: "link",
      valor: url,
      href: `${alvo.pathname}${alvo.search}${alvo.hash}` || "/",
      externo: false,
    };
  }

  return null;
}
