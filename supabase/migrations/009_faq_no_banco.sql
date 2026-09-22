-- ============================================================
-- NeoSenses — 009: perguntas frequentes saem do código
-- ============================================================
-- As doze perguntas viviam num array dentro de src/app/contato/faq/page.tsx.
-- Consequência: o Concierge não podia citá-las, e a resposta que mais destrava
-- venda — a política de cancelamento — só existia para quem achasse a página
-- de FAQ e rolasse até o fim.
--
-- Agora estão em `faqs`, que o Concierge já lê. Editar no admin reflete nos
-- dois lugares.
--
-- O texto é o mesmo que já estava no ar, sem invenção. Onde havia promessa
-- vaga ("geralmente incluímos"), o texto passa a mandar confirmar — o que
-- está incluído varia por experiência e é campo do cadastro.
--
-- ============================================================

-- Chave natural, sem a qual o ON CONFLICT abaixo não faz nada e cada execução
-- duplica as doze perguntas. Já aconteceu duas vezes nesta base
-- (travel_guides e packing_catalog_items) — ON CONFLICT DO NOTHING sem
-- constraint única para conflitar é uma instrução silenciosamente inútil.
--
-- O seed de desenvolvimento também insere perguntas; o índice faz as duas
-- fontes convergirem em vez de somarem.
CREATE UNIQUE INDEX IF NOT EXISTS uq_faqs_pergunta
  ON faqs (lower(question->>'pt'));

INSERT INTO faqs (question, answer, category, sort_order) VALUES

-- ── Geral ────────────────────────────────────────────────────
(
  '{"pt":"O que é a NeoSenses?"}',
  '{"pt":"A NeoSenses organiza viagens transformadoras que combinam espiritualidade, autoconhecimento e vivências em destinos sagrados. Cada roteiro é desenhado para crescimento pessoal e conexão, em grupos pequenos com facilitadores especializados."}',
  'geral', 10
),
(
  '{"pt":"Para quem são as experiências?"}',
  '{"pt":"Para quem busca autoconhecimento e viagem com propósito. Não é preciso ter experiência anterior em práticas espirituais — boa parte do grupo está indo pela primeira vez."}',
  'geral', 11
),
(
  '{"pt":"Preciso ser espiritualizado para participar?"}',
  '{"pt":"Não. As práticas são conduzidas passo a passo e recebem tanto quem nunca meditou quanto quem pratica há anos. No mesmo grupo costuma haver pessoas de tradições diferentes e pessoas sem nenhuma. O combinado é respeito mútuo."}',
  'geral', 12
),

-- ── Viagem ───────────────────────────────────────────────────
(
  '{"pt":"Qual o tamanho dos grupos?"}',
  '{"pt":"Grupos pequenos, em geral entre 8 e 16 pessoas. O número exato de cada saída está na página da experiência."}',
  'viagem', 20
),
(
  '{"pt":"O que está incluído no valor?"}',
  '{"pt":"Varia por experiência, e a página de cada jornada traz a lista do que está e do que não está incluído. Como regra, passagem aérea internacional não entra. Confirme os detalhes da sua data com a equipe antes de fechar."}',
  'viagem', 21
),
(
  '{"pt":"Posso viajar sozinho?"}',
  '{"pt":"Sim, e a maior parte do grupo costuma vir assim. Quem viaja sozinho divide quarto duplo com outra pessoa do mesmo gênero, ou pode pedir quarto individual com suplemento — desde que solicitado na reserva, porque o número de quartos é limitado."}',
  'viagem', 22
),

-- ── Cancelamento ─────────────────────────────────────────────
-- É a resposta que mais destrava a decisão: a pessoa está prestes a
-- comprometer vinte mil reais numa viagem daqui a meses.
(
  '{"pt":"Qual a política de cancelamento?"}',
  '{"pt":"Reembolso integral até 60 dias antes da saída. Entre 60 e 30 dias, reembolso de 50%. A partir de 30 dias, o valor pode ser convertido em crédito para outra experiência. Cada caso é confirmado por escrito com a equipe no momento da reserva."}',
  'cancelamento', 30
),
(
  '{"pt":"E se eu precisar remarcar?"}',
  '{"pt":"Fale com a equipe assim que souber. Remarcação depende de vaga na outra saída e do prazo em relação à data original — quanto antes avisar, mais opções existem."}',
  'cancelamento', 31
),

-- ── Práticas ─────────────────────────────────────────────────
(
  '{"pt":"Quais práticas são oferecidas?"}',
  '{"pt":"Depende do roteiro: meditação guiada, yoga, respiração consciente, partilhas em grupo, caminhadas contemplativas e cerimônias conduzidas por facilitadores locais. A página de cada experiência descreve o que está previsto."}',
  'praticas', 40
),
(
  '{"pt":"Preciso ter experiência em meditação ou yoga?"}',
  '{"pt":"Não. As práticas são adaptadas para quem está começando e para quem já pratica. Desconforto no início é normal e passa — e ninguém espera que você faça certo."}',
  'praticas', 41
),

-- ── Primeira viagem em grupo ─────────────────────────────────
(
  '{"pt":"Nunca viajei em grupo. Como funciona?"}',
  '{"pt":"Os horários são combinados e o grupo depende de cada pessoa para cumprir o roteiro — pontualidade é o que mantém tudo de pé. Em troca, você não precisa resolver nenhuma logística. Há tempo livre previsto, momentos de silêncio e um facilitador disponível para qualquer desconforto. Restrição alimentar ou de saúde deve ser informada na reserva, porque no destino nem sempre há alternativa."}',
  'grupo', 50
),
(
  '{"pt":"Como vou saber onde encontrar o grupo?"}',
  '{"pt":"O ponto de encontro e o horário são confirmados pela equipe antes do embarque, e variam por experiência e por data — não confie em informação de outra turma. Salve o telefone do facilitador assim que receber e chegue com folga."}',
  'grupo', 51
)

ON CONFLICT DO NOTHING;
