/**
 * Testes da linkificação da resposta do Concierge.
 *
 * Rodar: npm test (não chama a API, não consome cota).
 *
 * O texto vem de um modelo de linguagem, então metade destes casos existe
 * para provar que endereço que NÃO é da casa continua texto. Linkar tudo que
 * a IA escreve é transformar alucinação em clique — e um clique que sai do
 * site com a credibilidade de quem foi encaminhado pela empresa.
 *
 * A outra metade prova que o que é legítimo vira link, porque uma lista de
 * permissão que não permite nada é igual a não ter link nenhum.
 */

const { partirEmLinks } = await import("../src/lib/ai/links.ts");

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

type Trecho = { tipo: string; valor: string; href?: string; externo?: boolean };

const links = (t: string): Trecho[] =>
  (partirEmLinks(t) as Trecho[]).filter((x) => x.tipo === "link");
const virouTexto = (t: string) => links(t).length === 0;
const juntar = (t: string) => (partirEmLinks(t) as Trecho[]).map((x) => x.valor).join("");

console.log("\n=== WhatsApp da casa vira link ===");
{
  const t = "Fale com a equipe: https://wa.me/5511947188319";
  const l = links(t);
  ok("reconhece o wa.me", l.length === 1);
  ok("aponta para o mesmo endereço", l[0]?.href === "https://wa.me/5511947188319");
  ok("marca como externo — abre em nova aba", l[0]?.externo === true);
  ok("não perde texto nenhum", juntar(t) === t);
}
{
  const l = links("Chame em https://wa.me/5511947188319?text=Ol%C3%A1");
  ok("aceita com mensagem pré-preenchida", l.length === 1);
}
{
  const l = links("https://api.whatsapp.com/send?phone=5511947188319");
  ok("aceita a forma api.whatsapp.com", l.length === 1);
}

console.log("\n=== WhatsApp de OUTRO número não vira link ===");
{
  // O caso que motivou a lista de permissão: a IA escrevendo um número que
  // não é da empresa, e o site entregando o clique.
  ok("outro número fica texto", virouTexto("Chame no https://wa.me/5599999999999"));
  ok("número parcial não passa", virouTexto("https://wa.me/55119"));
}

console.log("\n=== Caminho interno vira link ===");
{
  const l = links("Veja em /experiencias/machu-picchu-xamanico");
  ok("reconhece o caminho", l.length === 1);
  ok("mantém o caminho", l[0]?.href === "/experiencias/machu-picchu-xamanico");
  ok("marca como interno — mesma aba", l[0]?.externo === false);
}
{
  ok("aceita /destinos", links("Nossos /destinos").length === 1);
  ok("aceita /planejar", links("Monte em /planejar").length === 1);
  // Caminho que não é do site não entra na lista.
  ok("recusa caminho desconhecido", virouTexto("veja em /admin/leads"));
  ok("recusa caminho inventado", virouTexto("veja em /promocoes/black-friday"));
}

console.log("\n=== Endereço do próprio domínio vira caminho interno ===");
{
  const l = links("https://www.neosenses.com.br/experiencias");
  ok("reconhece o domínio da casa", l.length === 1);
  ok("converte para caminho", l[0]?.href === "/experiencias");
  ok("navega na mesma aba", l[0]?.externo === false);
}
{
  const l = links("https://neosenses.vercel.app/destinos");
  ok("aceita o endereço da Vercel", l.length === 1);
  ok("também vira caminho", l[0]?.href === "/destinos");
}

console.log("\n=== Domínio de fora continua texto ===");
{
  ok("site qualquer", virouTexto("Compare em https://www.booking.com/hotel"));
  // Domínio parecido é o ataque clássico. Tem que continuar texto.
  ok("domínio parecido não engana", virouTexto("https://neosenses.com.br.golpe.io/pagar"));
  ok("subdomínio de terceiro", virouTexto("https://neosenses.com.br.evil.co/x"));
  ok("encurtador", virouTexto("https://bit.ly/3xYz"));
}

console.log("\n=== Protocolo perigoso nunca vira link ===");
{
  ok("javascript:", virouTexto("clique javascript:alert(1)"));
  ok("data:", virouTexto("veja data:text/html;base64,PHNjcmlwdD4="));
  ok("file:", virouTexto("abra file:///C:/Windows/System32"));
}

console.log("\n=== E-mail só do domínio da casa ===");
{
  const l = links("Escreva para contato@neosenses.com.br");
  ok("reconhece o e-mail da casa", l.length === 1);
  ok("vira mailto", l[0]?.href === "mailto:contato@neosenses.com.br");
  ok("e-mail de fora fica texto", virouTexto("escreva para alguem@gmail.com"));
}

console.log("\n=== Pontuação não entra no link ===");
{
  const t = "Fale no https://wa.me/5511947188319.";
  const l = links(t);
  ok("o ponto final fica fora do endereço", l[0]?.href === "https://wa.me/5511947188319");
  ok("mas continua na tela", juntar(t) === t);
}
{
  const t = "Veja (/experiencias), é lá.";
  ok("parêntese não entra no caminho", links(t)[0]?.href === "/experiencias");
  ok("texto preservado", juntar(t) === t);
}

console.log("\n=== Texto sem link e casos de borda ===");
{
  ok("texto comum não vira nada", virouTexto("Temos saídas em outubro e novembro."));
  ok("string vazia não quebra", partirEmLinks("").length === 0);
  const t = "Veja /destinos e depois /planejar, ou chame https://wa.me/5511947188319";
  ok("acha os três", links(t).length === 3);
  ok("sem perder texto", juntar(t) === t);
}

console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
if (falhou > 0) process.exit(1);

// Marca o arquivo como módulo: sem isto os testes compartilham escopo
// global e o TypeScript acusa redeclaração entre eles.
export {};
