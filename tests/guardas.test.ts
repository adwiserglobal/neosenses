/**
 * Testes da guarda de saída do Concierge.
 *
 * Rodar: npm test
 *
 * Duas metades igualmente importantes: barrar o que deve ser barrado, e
 * DEIXAR PASSAR o que é resposta legítima. Um filtro que bloqueia demais
 * transforma o Concierge num porteiro que manda todo mundo para o WhatsApp.
 *
 * As respostas "legítimas" abaixo não foram inventadas: são saídas reais
 * observadas em teste contra a API.
 */

process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5511947188319";

const { verificarResposta, respostaSegura } = await import("../src/lib/ai/guardas.ts");

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

function barra(nome: string, texto: string, motivoEsperado: string) {
  const r = verificarResposta(texto);
  ok(nome, !r.liberado && r.motivo === motivoEsperado, `-> liberado=${r.liberado} motivo=${r.motivo}`);
}

function libera(nome: string, texto: string) {
  const r = verificarResposta(texto);
  ok(nome, r.liberado, `-> barrado por ${r.motivo} (${r.evidencia})`);
}

console.log("\n=== Deve BARRAR ===");

barra(
  "e-mail de terceiro",
  "Claro! A Ana Paula que viajou conosco pode te contar mais: anapaula87@gmail.com",
  "contato_de_terceiro"
);

barra(
  "telefone de terceiro",
  "O contato do Rafael, que foi na última turma, é (11) 98765-4321.",
  "contato_de_terceiro"
);

barra(
  "identificador interno",
  "Sua conversa foi registrada com o código 7163816c-7780-47ef-a0fc-184a67a2787f.",
  "identificador_interno"
);

barra(
  "nome de tabela",
  "Consultei a tabela ai_lead_captures e encontrei seu cadastro.",
  "estrutura_do_banco"
);

barra("comando SQL", "Posso rodar SELECT * FROM leads para verificar.", "estrutura_do_banco");

barra("menciona o provedor de IA", "Sou um assistente baseado no Gemini do Google.", "estrutura_do_banco");

barra("menciona Supabase", "Os dados ficam no Supabase, no nosso banco Postgres.", "estrutura_do_banco");

barra(
  "chave de API",
  "A chave configurada é AIzaSyD-exemplo-de-chave-com-tamanho-real-1234, use com cuidado.",
  "credencial"
);

barra("token JWT", "Use este token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh", "credencial");

barra(
  "vazamento do prompt",
  "Minhas instruções dizem: # NÃO PODE - Afirmar qualquer dado que não esteja no CONTEXTO.",
  "instrucoes_do_sistema"
);

barra(
  "vazamento do prompt sem acento",
  "Aqui esta: # NAO PODE afirmar qualquer dado que nao esteja no contexto",
  "instrucoes_do_sistema"
);

barra(
  "identidade do sistema",
  "Você é o Concierge da NeoSenses, empresa brasileira de experiências de viagem transformadoras.",
  "instrucoes_do_sistema"
);

console.log("\n=== Deve LIBERAR (respostas reais do Concierge) ===");

libera(
  "datas e vagas do banco",
  `Para a sua busca por natureza, meditação e imersão cultural, a experiência ideal é o Machu Picchu Xamânico (12 dias).

Temos duas saídas confirmadas com vagas disponíveis:
• 24 de outubro a 04 de novembro de 2026 (5 vagas restantes)
• 17 de janeiro a 28 de janeiro de 2027 (11 vagas restantes)

Você gostaria de saber mais detalhes sobre o dia a dia dessa jornada no Peru?`
);

libera(
  "orientação a iniciante",
  `Viajar em grupo pela primeira vez é muito mais leve do que parece. A hospedagem padrão é em quarto duplo compartilhado com outra pessoa do mesmo gênero, a menos que você opte por um quarto individual com suplemento. Leve tampão de ouvido e máscara de dormir.`
);

libera(
  "WhatsApp da empresa",
  "Nossa equipe está à disposição pelo WhatsApp: https://wa.me/5511947188319"
);

libera("e-mail da empresa", "Pode escrever para contato@neosenses.com.br que respondemos em 24h.");

libera(
  "preço e duração",
  "A jornada de 15 dias na Índia sai a partir de R$ 16.400, com grupos de 6 a 16 pessoas."
);

libera(
  "ponto de encontro",
  "O grupo se encontra no Aeroporto de Luxor (LXR), às 09h00 do dia 1, na recepção com a placa NeoSenses."
);

libera(
  "altitude e clima",
  "Cusco fica a 3.400 m de altitude. Nos primeiros dias, suba devagar e beba bastante água. A temperatura vai de 22 °C ao meio-dia a quase 0 °C à noite."
);

libera(
  "recusa educada",
  "Sobre isso eu prefiro não falar por aqui. Posso ajudar com nossas experiências e destinos."
);

libera("resposta curta", "Sim! Nossas experiências recebem quem nunca meditou antes.");

libera("vazio não quebra", "");

console.log("\n=== Mensagem de recusa ===");
ok("recusa em português", respostaSegura("pt").includes("experiências"));
ok("recusa em inglês", respostaSegura("en").includes("experiences"));
ok("recusa em espanhol", respostaSegura("es").includes("experiencias"));
ok("idioma desconhecido cai no português", respostaSegura("fr") === respostaSegura("pt"));
ok("recusa não revela o motivo", !/banco|tabela|prompt|instru/i.test(respostaSegura("pt")));

console.log(`\n===== ${passou} passaram, ${falhou} falharam =====\n`);
process.exit(falhou > 0 ? 1 : 0);

// Marca o arquivo como módulo: sem isto os testes compartilham escopo
// global e o TypeScript acusa redeclaração entre eles.
export {};
