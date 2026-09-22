-- ============================================================
-- NeoSenses — 011: o que dizer sobre pagamento
-- ============================================================
-- Separada da 010 porque o valor 'pagamento' do enum só pode ser usado a
-- partir da transação seguinte à que o criou.
--
-- ATENÇÃO: os textos abaixo são ESQUELETO, marcados com [CONFIRMAR].
-- Ninguém aqui sabe em quantas vezes a NeoSenses parcela nem qual sinal ela
-- cobra. Inventar isso seria pior que o silêncio de hoje: o Concierge passaria
-- a afirmar condição comercial errada, e o visitante cobraria depois.
--
-- Enquanto tiver [CONFIRMAR], o guia fica com is_active = false: não aparece
-- no site nem no Concierge. Editar em /admin e ativar quando o texto estiver
-- certo.
--
-- Idempotente.
-- ============================================================

INSERT INTO travel_guides (topic, scope, title, summary, content, priority, for_beginners, is_active, sort_order) VALUES

(
  'pagamento', 'global',
  '{"pt":"Como funciona o pagamento","en":"How payment works","es":"Cómo funciona el pago"}',
  '{"pt":"[CONFIRMAR] Sinal na reserva e o restante parcelado até a data da saída.","en":"[CONFIRM] Deposit at booking and the balance in instalments.","es":"[CONFIRMAR] Señal en la reserva y el resto en cuotas."}',
  '{"pt":"[CONFIRMAR TODO O TEXTO ABAIXO ANTES DE ATIVAR]\n\nA reserva é confirmada com um sinal, e o valor restante pode ser parcelado até a data da saída.\n\nFormas aceitas: [CONFIRMAR — cartão de crédito, PIX, transferência?]\nParcelamento: [CONFIRMAR — em quantas vezes, com ou sem juros?]\nSinal: [CONFIRMAR — valor ou percentual]\n\nO que está incluído em cada jornada aparece na página da experiência. Passagem aérea internacional, em regra, não entra.\n\nA equipe confirma as condições da sua data por escrito antes de qualquer pagamento."}',
  1, false, false, 1
),

(
  'pagamento', 'global',
  '{"pt":"Posso parcelar?","en":"Can I pay in instalments?","es":"¿Puedo pagar en cuotas?"}',
  '{"pt":"[CONFIRMAR] Sim, até a data da saída.","en":"[CONFIRM] Yes, until the departure date.","es":"[CONFIRMAR] Sí, hasta la fecha de salida."}',
  '{"pt":"[CONFIRMAR ANTES DE ATIVAR]\n\nSim. O parcelamento vai até a data da saída, então quanto mais cedo você reserva, mais parcelas cabem.\n\nNúmero de parcelas e condições: [CONFIRMAR]\n\nFale com a equipe para simular o parcelamento da sua data."}',
  1, false, false, 2
),

(
  'pagamento', 'global',
  '{"pt":"Quando preciso pagar?","en":"When do I pay?","es":"¿Cuándo debo pagar?"}',
  '{"pt":"[CONFIRMAR] O sinal garante a vaga; o restante segue o combinado até a saída.","en":"[CONFIRM] The deposit secures your place.","es":"[CONFIRMAR] La señal asegura tu plaza."}',
  '{"pt":"[CONFIRMAR ANTES DE ATIVAR]\n\nO sinal é o que garante a sua vaga na turma — as saídas têm grupo pequeno e a vaga só fica reservada depois dele.\n\nPrazo do sinal: [CONFIRMAR]\nRestante: [CONFIRMAR]\n\nSe precisar de um arranjo diferente, converse com a equipe antes de reservar."}',
  2, false, false, 3
)

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Aviso na aplicação
-- ─────────────────────────────────────────────────────────────
-- O painel destaca guias com [CONFIRMAR] pendente, para o texto provisório
-- não ser publicado por engano.
COMMENT ON TABLE travel_guides IS
  'Conteúdo consultado pelo Concierge e pelas páginas. Guia com "[CONFIRMAR]" no texto é esqueleto aguardando a informação real — mantenha is_active = false até revisar.';
