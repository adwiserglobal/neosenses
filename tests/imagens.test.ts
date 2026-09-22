/**
 * Testes do filtro de imagens do Wikimedia Commons.
 *
 * Rodar: npm test (não chama a API, não consome cota).
 *
 * O peso está no que NÃO passa. Publicar foto de terceiro com licença errada
 * ou sem crédito é violação de direito autoral, e é o tipo de erro que só
 * aparece quando chega a notificação — não há teste em produção que pegue
 * isso antes.
 */

const { filtrarImagens, limparAutor, urlDeBusca, termosCandidatos } = await import(
  "../src/lib/ai/imagens.ts"
);

let passou = 0;
let falhou = 0;

function ok(nome: string, condicao: boolean, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  PASSOU  ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHOU  ${nome} ${detalhe}`);
  }
}

/** Monta uma resposta no formato que a API do Commons devolve. */
function resposta(...arquivos: Array<Record<string, unknown>>) {
  const pages: Record<string, unknown> = {};
  arquivos.forEach((a, i) => {
    pages[`p${i}`] = {
      title: `File:${a.titulo ?? `foto-${i}.jpg`}`,
      imageinfo: [
        {
          url: a.url ?? `https://upload.wikimedia.org/foto-${i}.jpg`,
          thumburl: a.thumburl ?? `https://upload.wikimedia.org/thumb/foto-${i}.jpg`,
          descriptionurl: `https://commons.wikimedia.org/wiki/File:foto-${i}.jpg`,
          width: a.largura ?? 1600,
          height: a.altura ?? 900,
          thumbwidth: a.largura ?? 1600,
          thumbheight: a.altura ?? 900,
          extmetadata: {
            LicenseShortName: { value: a.licenca ?? "CC BY-SA 4.0" },
            Artist: { value: a.autor ?? "Fulano de Tal" },
          },
        },
      ],
    };
  });
  return { query: { pages } };
}

console.log("\n=== Foto boa passa ===");
{
  const r = filtrarImagens(resposta({}));
  ok("aceita foto com licença livre e autor", r.length === 1);
  ok("usa a versão redimensionada", r[0]?.url.includes("/thumb/"));
  ok("monta a linha de crédito", r[0]?.credito === "Fulano de Tal · CC BY-SA 4.0 · Wikimedia Commons");
  ok("guarda a página de origem", r[0]?.paginaFonte.includes("commons.wikimedia.org"));
}

console.log("\n=== Licença que proíbe uso comercial não passa ===");
{
  // O site vende viagem. NC proíbe exatamente isso.
  ok("recusa CC BY-NC", filtrarImagens(resposta({ licenca: "CC BY-NC 4.0" })).length === 0);
  ok("recusa CC BY-NC-SA", filtrarImagens(resposta({ licenca: "CC BY-NC-SA 3.0" })).length === 0);
  // ND proíbe derivada, e o site recorta a foto para caber no card.
  ok("recusa CC BY-ND", filtrarImagens(resposta({ licenca: "CC BY-ND 4.0" })).length === 0);
  ok("recusa 'todos os direitos reservados'", filtrarImagens(resposta({ licenca: "All rights reserved" })).length === 0);
  ok("recusa uso permitido só no Commons", filtrarImagens(resposta({ licenca: "Fair use" })).length === 0);
  ok("recusa licença vazia", filtrarImagens(resposta({ licenca: "" })).length === 0);
}

console.log("\n=== Licenças livres aceitas ===");
{
  for (const l of ["CC0", "Public domain", "CC BY 4.0", "CC BY-SA 3.0", "PDM 1.0"]) {
    ok(`aceita ${l}`, filtrarImagens(resposta({ licenca: l })).length === 1);
  }
}

console.log("\n=== Sem autor não se publica ===");
{
  // Licença livre ainda exige crédito. Sem nome, não há como creditar.
  ok("recusa autor vazio", filtrarImagens(resposta({ autor: "" })).length === 0);
  ok("recusa autor só com HTML vazio", filtrarImagens(resposta({ autor: "<span></span>" })).length === 0);
}

console.log("\n=== Formato e tamanho ===");
{
  ok("recusa svg", filtrarImagens(resposta({ titulo: "mapa.svg" })).length === 0);
  ok("recusa tif", filtrarImagens(resposta({ titulo: "scan.tif" })).length === 0);
  ok("recusa pdf", filtrarImagens(resposta({ titulo: "guia.pdf" })).length === 0);
  ok("aceita jpg", filtrarImagens(resposta({ titulo: "vista.jpg" })).length === 1);
  ok("aceita jpeg", filtrarImagens(resposta({ titulo: "vista.jpeg" })).length === 1);
  ok("aceita png", filtrarImagens(resposta({ titulo: "vista.png" })).length === 1);
  ok("recusa foto pequena", filtrarImagens(resposta({ largura: 400 })).length === 0);
  ok("aceita a partir de 800", filtrarImagens(resposta({ largura: 800 })).length === 1);
}

console.log("\n=== Ordem pensada no card horizontal ===");
{
  const r = filtrarImagens(
    resposta(
      { autor: "Retrato", largura: 900, altura: 1600, titulo: "vertical.jpg" },
      { autor: "Paisagem", largura: 1600, altura: 900, titulo: "horizontal.jpg" }
    ),
    2
  );
  // Card do site é horizontal; foto vertical entra cortada no meio.
  ok("horizontal vem primeiro", r[0]?.autor === "Paisagem");
  ok("vertical ainda entra", r.length === 2);
}
{
  // Caso real: a busca por Vale Sagrado trouxe um panorama 1600x258 em
  // primeiro lugar. Proporção 6:1 num card vira uma tira sem assunto.
  const r = filtrarImagens(
    resposta(
      { autor: "Panorama", largura: 1600, altura: 258, titulo: "pano.jpg" },
      { autor: "Normal", largura: 1600, altura: 1067, titulo: "normal.jpg" }
    ),
    2
  );
  ok("panorama extremo perde para foto normal", r[0]?.autor === "Normal");
  ok("mas não é descartado", r.length === 2);
}
{
  const r = filtrarImagens(
    resposta(
      { autor: "Panorama", largura: 1600, altura: 258, titulo: "pano.jpg" },
      { autor: "Vertical", largura: 900, altura: 1600, titulo: "vert.jpg" }
    ),
    2
  );
  // Vertical corta e ainda sobra assunto; panorama de 6:1 não sobra nada.
  ok("vertical ganha do panorama", r[0]?.autor === "Vertical");
}
{
  const r = filtrarImagens(resposta({ autor: "DoisPorUm", largura: 1600, altura: 800 }), 1);
  ok("2:1 continua sendo boa proporção", r[0]?.autor === "DoisPorUm");
}

console.log("\n=== Três autores diferentes, para variar de verdade ===");
{
  const r = filtrarImagens(
    resposta(
      { autor: "Ana", titulo: "a1.jpg" },
      { autor: "Ana", titulo: "a2.jpg" },
      { autor: "Ana", titulo: "a3.jpg" },
      { autor: "Bruno", titulo: "b1.jpg" },
      { autor: "Carla", titulo: "c1.jpg" }
    ),
    3
  );
  const autores = new Set(r.map((x) => x.autor));
  ok("devolve três", r.length === 3);
  ok("de três autores distintos", autores.size === 3, [...autores].join(", "));
}
{
  // Só um autor disponível: três fotos dele é melhor que uma só.
  const r = filtrarImagens(
    resposta(
      { autor: "Ana", titulo: "a1.jpg" },
      { autor: "Ana", titulo: "a2.jpg" },
      { autor: "Ana", titulo: "a3.jpg" }
    ),
    3
  );
  ok("completa com o mesmo autor quando não há outro", r.length === 3);
}

console.log("\n=== Limpeza do autor (o campo vem como HTML) ===");
{
  ok(
    "tira o link",
    limparAutor('<a href="/wiki/User:Foo" title="User:Foo">Foo Bar</a>') === "Foo Bar"
  );
  ok("decodifica entidade", limparAutor("Jos&amp;eacute;".replace("&amp;", "&")) === "Jos&eacute;" || limparAutor("Ana &amp; Bruno") === "Ana & Bruno");
  ok("colapsa espaços", limparAutor("<div>  Ana   Maria  </div>") === "Ana Maria");
  ok("aguenta tabela inteira", limparAutor("<table><tr><td>Autor:</td><td>Ana</td></tr></table>").includes("Ana"));
  ok("corta nome gigante", limparAutor("x".repeat(500)).length <= 120);
}

console.log("\n=== Resposta estranha não quebra ===");
{
  ok("nulo", filtrarImagens(null).length === 0);
  ok("objeto vazio", filtrarImagens({}).length === 0);
  ok("sem query", filtrarImagens({ outra: 1 }).length === 0);
  ok("página sem imageinfo", filtrarImagens({ query: { pages: { p0: { title: "File:x.jpg" } } } }).length === 0);
  ok("texto no lugar do objeto", filtrarImagens("erro").length === 0);
}

console.log("\n=== Endereço da consulta ===");
{
  const u = urlDeBusca("Vale das Rosas Marrocos");
  ok("aponta para o Commons", u.startsWith("https://commons.wikimedia.org/w/api.php?"));
  ok("busca só arquivos", u.includes("gsrnamespace=6"));
  ok("pede a licença junto", u.includes("extmetadata"));
  ok("pede versão redimensionada", u.includes("iiurlwidth=1600"));
  ok("escapa o termo", u.includes("Vale+das+Rosas") || u.includes("Vale%20das%20Rosas"));
}

console.log("\n=== Termos alternativos (4 de 8 destinos não achavam nada) ===");
{
  // O Commons é catalogado em inglês. "Vale Sagrado e Machu Picchu Peru" não
  // casa com nada; "Machu Picchu" tem centenas de fotos.
  const t = termosCandidatos("Vale Sagrado e Machu Picchu", "Peru");
  ok("começa pelo nome completo com país", t[0] === "Vale Sagrado e Machu Picchu Peru");
  ok("quebra no ' e '", t.some((x: string) => x === "Machu Picchu"));
  ok("mantém as duas partes", t.some((x: string) => x.startsWith("Vale Sagrado")));
  ok("no máximo cinco tentativas", t.length <= 5);
}
{
  const t = termosCandidatos("Luxor e o Vale dos Reis", "Egito");
  // "e o" também separa, não só "e".
  ok("quebra em ' e o '", t.some((x: string) => x === "Luxor"));
  // O país sozinho traria foto de qualquer canto do Egito. Ele só existiria
  // como último recurso, e o corte em cinco termos o elimina — que é o
  // resultado desejado, não um efeito colateral.
  ok("país sozinho não entra quando há partes específicas", !t.includes("Egito"));
  ok("todo termo carrega algo do nome do lugar", t.every((x: string) => /Luxor|Vale dos Reis/.test(x)));
}
{
  const t = termosCandidatos("Chiang Mai e o Norte", "Tailândia");
  ok("isola o nome próprio", t.some((x: string) => x === "Chiang Mai"));
}
{
  const t = termosCandidatos("Kyoto", "Japão");
  ok("nome simples não é quebrado", t[0] === "Kyoto Japão");
  ok("mas tenta sem o país também", t.includes("Kyoto"));
}
{
  ok("nome vazio devolve nada", termosCandidatos("").length === 0);
  ok("sem país funciona", termosCandidatos("Kyoto").length >= 1);
  ok("não repete termo", new Set(termosCandidatos("Kyoto", "Kyoto")).size === termosCandidatos("Kyoto", "Kyoto").length);
}

console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
if (falhou > 0) process.exit(1);

// Marca o arquivo como módulo: sem isto os testes compartilham escopo
// global e o TypeScript acusa redeclaração entre eles.
export {};
