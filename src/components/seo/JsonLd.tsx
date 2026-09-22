/**
 * Insere um bloco JSON-LD na página.
 *
 * `dangerouslySetInnerHTML` é o caminho normal para JSON-LD: renderizado como
 * texto, o React escaparia as aspas e o buscador receberia JSON quebrado.
 *
 * O conteúdo vem sempre de dados nossos, serializado por JSON.stringify. O
 * escape abaixo cobre o resto: um título contendo "</script>" fecharia a tag
 * mais cedo, e os separadores de linha U+2028/U+2029 quebram o parser de
 * alguns leitores.
 *
 * O padrão é montado por escape Unicode, e a substituição converte o próprio
 * código do caractere. Nenhum caractere invisível literal fica no arquivo —
 * eles somem numa cópia ou reformatação e o bug volta sem aparecer no diff.
 */

const PERIGOSOS = new RegExp("[<\\u2028\\u2029]", "g");

function escapar(caractere: string): string {
  return "\\u" + caractere.charCodeAt(0).toString(16).padStart(4, "0");
}

export function JsonLd({ dados }: { dados: unknown }) {
  if (!dados) return null;

  const json = JSON.stringify(dados).replace(PERIGOSOS, escapar);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
