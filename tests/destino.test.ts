/**
 * Testes da conferência do assistente de destino.
 *
 * Rodar: npm test (não chama a API, não consome cota).
 *
 * O que se verifica aqui é o que o prompt pede mas não garante. Um modelo
 * devolve coordenada errada com a mesma confiança com que devolve a certa, e
 * o dado alimenta o que o site diz sobre preparação de viagem — altitude,
 * chuva, o que levar. Erro aqui se propaga para o Concierge.
 *
 * Metade dos casos existe para provar que ficha legítima passa inteira. Uma
 * conferência que rejeita tudo é tão inútil quanto uma que aceita tudo.
 */

const { conferirSugestao } = await import("../src/lib/ai/destino.ts");

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

const temRessalva = (r: { ressalvas: { campo: string }[] } | null, campo: string) =>
  !!r?.ressalvas.some((x) => x.campo === campo);

// Ficha correta, do tipo que o modelo devolve quando acerta.
const VALIDA = {
  nome: "Vale Sagrado e Machu Picchu",
  nomeEn: "Sacred Valley and Machu Picchu",
  pais: "Peru",
  paisCodigo: "pe",
  descricao: "Vale dos Incas nos Andes peruanos, entre Cusco e Machu Picchu.",
  copy: "O vale se abre entre montanhas que os incas trataram como parentes.",
  latitude: -13.3236,
  longitude: -72.0907,
  altitudeM: 2800,
  timezone: "America/Lima",
  climaTipo: "montanha",
  tempMinC: 4,
  tempMaxC: 22,
  estacaoChuvosa: "dez-mar",
  fotoSugerida: "terraços agrícolas incas com montanhas ao fundo",
  fotoBusca: ["vale sagrado peru", "machu picchu terraços"],
  avisos: ["Acima de 2500 m, reserve dois dias de aclimatação em Cusco."],
};

console.log("\n=== Ficha correta passa inteira ===");
{
  const r = conferirSugestao(VALIDA);
  ok("aceita a ficha", r !== null);
  ok("sem ressalva nenhuma", r?.ressalvas.length === 0, JSON.stringify(r?.ressalvas));
  ok("preserva a latitude", r?.sugestao.latitude === -13.3236);
  ok("preserva a altitude", r?.sugestao.altitudeM === 2800);
  ok("normaliza o código do país para maiúsculas", r?.sugestao.paisCodigo === "PE");
  ok("mantém os avisos", r?.sugestao.avisos?.length === 1);
}

console.log("\n=== Sem nome ou sem país não é destino ===");
{
  ok("recusa objeto vazio", conferirSugestao({}) === null);
  ok("recusa sem país", conferirSugestao({ nome: "Kyoto" }) === null);
  ok("recusa nulo", conferirSugestao(null) === null);
  ok("recusa texto solto", conferirSugestao("Kyoto, Japão") === null);
}

console.log("\n=== Coordenada impossível é rebaixada, não aceita ===");
{
  const r = conferirSugestao({ ...VALIDA, latitude: 133.2, longitude: -72 });
  ok("marca a latitude fora de faixa", temRessalva(r, "latitude"));
  ok("zera a latitude inválida", r?.sugestao.latitude === null);
  ok("zera a longitude junto — meia coordenada não localiza", r?.sugestao.longitude === null);
  ok("o resto da ficha sobrevive", r?.sugestao.altitudeM === 2800);
}
{
  const r = conferirSugestao({ ...VALIDA, longitude: 200 });
  ok("marca a longitude fora de faixa", temRessalva(r, "longitude"));
}
{
  // Campo não preenchido que virou zero é o erro mais comum, e o mais
  // difícil de notar: (0,0) parece um número legítimo.
  const r = conferirSugestao({ ...VALIDA, latitude: 0, longitude: 0 });
  ok("marca (0,0) como campo vazio disfarçado", temRessalva(r, "coordenadas"));
  ok("descarta o par", r?.sugestao.latitude === null && r?.sugestao.longitude === null);
}
{
  const r = conferirSugestao({ ...VALIDA, longitude: null });
  ok("coordenada pela metade é descartada", r?.sugestao.latitude === null);
  ok("e fica registrada", temRessalva(r, "coordenadas"));
}

console.log("\n=== Altitude e temperatura fora do possível ===");
{
  const r = conferirSugestao({ ...VALIDA, altitudeM: 12000 });
  ok("recusa altitude acima do Everest", temRessalva(r, "altitude"));
  ok("e a descarta", r?.sugestao.altitudeM === null);
}
{
  const r = conferirSugestao({ ...VALIDA, altitudeM: -430 });
  ok("aceita depressão real (mar Morto)", !temRessalva(r, "altitude"));
}
{
  const r = conferirSugestao({ ...VALIDA, tempMinC: 30, tempMaxC: 10 });
  ok("recusa mínima maior que a máxima", temRessalva(r, "temperatura"));
  ok("descarta as duas", r?.sugestao.tempMinC === null && r?.sugestao.tempMaxC === null);
}
{
  const r = conferirSugestao({ ...VALIDA, tempMaxC: 90 });
  ok("recusa temperatura que não existe em terra", temRessalva(r, "tempMaxC"));
}

console.log("\n=== Clima e fuso inventados ===");
{
  const r = conferirSugestao({ ...VALIDA, climaTipo: "místico" });
  ok("recusa clima fora da lista do site", temRessalva(r, "climaTipo"));
  ok("e o descarta", r?.sugestao.climaTipo === null);
}
{
  const r = conferirSugestao({ ...VALIDA, climaTipo: "TROPICAL" });
  ok("aceita clima válido em maiúsculas", !temRessalva(r, "climaTipo"));
  ok("e normaliza", r?.sugestao.climaTipo === "tropical");
}
{
  const r = conferirSugestao({ ...VALIDA, timezone: "America/Machu_Picchu" });
  ok("recusa fuso que o Node não conhece", temRessalva(r, "timezone"));
  ok("e o descarta", r?.sugestao.timezone === null);
}
{
  const r = conferirSugestao({ ...VALIDA, timezone: "Asia/Kolkata" });
  ok("aceita fuso IANA real", !temRessalva(r, "timezone"));
}

console.log("\n=== A copy não promete o que a equipe não prometeu ===");
{
  const r = conferirSugestao({
    ...VALIDA,
    copy: "Uma experiência imperdível que vai transformar sua vida para sempre.",
  });
  ok("marca promessa e superlativo", temRessalva(r, "copy"));
  // Marcado, não apagado: o admin lê e decide. Apagar em silêncio esconde
  // que a IA tentou.
  ok("mas entrega o texto para o admin ver", (r?.sugestao.copy?.length ?? 0) > 0);
}
{
  const r = conferirSugestao({
    ...VALIDA,
    copy: "O vale se abre entre montanhas, e o silêncio ali tem textura própria.",
  });
  ok("copy sóbria passa", !temRessalva(r, "copy"));
}

console.log("\n=== Campos ausentes não quebram ===");
{
  const r = conferirSugestao({ nome: "Kyoto", pais: "Japão" });
  ok("aceita o mínimo", r !== null);
  ok("marca a descrição vazia", temRessalva(r, "descricao"));
  ok("listas ausentes viram vazias", Array.isArray(r?.sugestao.avisos));
}
{
  const r = conferirSugestao({ ...VALIDA, avisos: "não é lista", fotoBusca: 42 });
  ok("tipo errado em lista não quebra", r !== null);
  ok("vira lista vazia", r?.sugestao.avisos?.length === 0);
}
{
  const r = conferirSugestao({ ...VALIDA, latitude: "-13.3236", longitude: "-72.0907" });
  ok("número em texto é aceito", r?.sugestao.latitude === -13.3236);
}

console.log("\n=== Limite de tamanho ===");
{
  const r = conferirSugestao({ ...VALIDA, descricao: "x".repeat(5000), copy: "y".repeat(5000) });
  ok("corta a descrição", (r?.sugestao.descricao.length ?? 0) <= 600);
  ok("corta a copy", (r?.sugestao.copy?.length ?? 0) <= 900);
}
{
  const r = conferirSugestao({ ...VALIDA, avisos: Array(50).fill("aviso") });
  ok("limita a quantidade de avisos", (r?.sugestao.avisos?.length ?? 0) <= 6);
}

console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
if (falhou > 0) process.exit(1);

// Marca o arquivo como módulo: sem isto os testes compartilham escopo
// global e o TypeScript acusa redeclaração entre eles.
export {};
