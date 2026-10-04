/**
 * Markdown editorial deliberadamente limitado. Sem HTML nem scripts.
 * O mesmo formato é usado no editor, na prévia e nas páginas públicas.
 */
export type BlocoBlog =
  | { tipo: "subtitulo"; texto: string; nivel: 2 | 3 }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "citacao"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "imagem"; url: string; alt: string };

export function urlSeguraDeImagem(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return true;
  try {
    const destino = new URL(url);
    return destino.protocol === "https:" || destino.protocol === "http:";
  } catch {
    return false;
  }
}

export function blocosDoArtigo(conteudo: string): BlocoBlog[] {
  const blocos: BlocoBlog[] = [];
  const linhas = conteudo.replace(/\r\n/g, "\n").split("\n");
  let paragrafo: string[] = [];
  let itens: string[] = [];

  const guardarParagrafo = () => {
    if (paragrafo.length) {
      blocos.push({ tipo: "paragrafo", texto: paragrafo.join("\n").trim() });
      paragrafo = [];
    }
  };
  const guardarLista = () => {
    if (itens.length) {
      blocos.push({ tipo: "lista", itens: [...itens] });
      itens = [];
    }
  };

  for (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha) { guardarParagrafo(); guardarLista(); continue; }

    const imagem = linha.match(/^!\[([^\]]{0,180})\]\(([^\s)]+)\)$/);
    const titulo = linha.match(/^(#{2,3})\s+(.+)$/);
    const lista = linha.match(/^[-*]\s+(.+)$/);
    const citacao = linha.match(/^>\s+(.+)$/);
    if (imagem && urlSeguraDeImagem(imagem[2])) {
      guardarParagrafo(); guardarLista();
      blocos.push({ tipo: "imagem", alt: imagem[1], url: imagem[2] });
    } else if (titulo) {
      guardarParagrafo(); guardarLista();
      blocos.push({ tipo: "subtitulo", nivel: titulo[1].length as 2 | 3, texto: titulo[2] });
    } else if (lista) {
      guardarParagrafo();
      itens.push(lista[1]);
    } else if (citacao) {
      guardarParagrafo(); guardarLista();
      blocos.push({ tipo: "citacao", texto: citacao[1] });
    } else {
      guardarLista();
      paragrafo.push(linha);
    }
  }
  guardarParagrafo(); guardarLista();
  return blocos;
}
