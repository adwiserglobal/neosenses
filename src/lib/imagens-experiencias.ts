/**
 * Resolução de capa para experiências sem hero_image cadastrada.
 * Não altera o banco nem substitui imagens escolhidas pela equipe.
 * Os fallbacks usam somente fotografias já pertencentes ao projeto.
 */
const IMAGENS_POR_DESTINO: Array<[RegExp, string]> = [
  // O retiro com Monja Ani precisa de uma fotografia real, não do bloco roxo de fallback.
  [/monja ani|imersao entre o som|som e o silencio/, "/images/home/circulo-de-vivencia.webp"],
  [/peru|machu picchu|cusco|cuzco|inka sol|vale sagrado/, "/images/destinations/peru.png"],
  [/marrocos|marrakech|deserto do saara/, "/images/destinations/morocco.png"],
  [/tailandia|thailand|chiang mai|bangkok/, "/images/destinations/thailand.png"],
  [/india|himalaias|varanasi|rishikesh/, "/images/destinations/india.png"],
  [/egito|cairo|luxor|gize/, "/images/destinations/egito.jpg"],
  [/franca|provence|maria madalena/, "/images/destinations/france.png"],
  [/brasil|chapada|veadeiros|amazonia|amazonas/, "/images/destinations/brasil.jpg"],
];

export function imagemDaExperiencia(
  imagem: string | null | undefined,
  ...referencias: Array<string | null | undefined>
): string | null {
  const texto = referencias
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Correções editoriais do DOCX: prevalecem sobre capas antigas cadastradas.
  if (/monja ani|imersao.*som|som e silencio/.test(texto)) {
    return "/images/home/entre-som-e-silencio-monja-ani.webp";
  }
  if (/no coracao do egito|egito 2027/.test(texto)) {
    return "/images/home/no-coracao-do-egito-2027.webp";
  }

  if (imagem?.trim()) return imagem.trim();
  return IMAGENS_POR_DESTINO.find(([termo]) => termo.test(texto))?.[1] ?? null;
}
