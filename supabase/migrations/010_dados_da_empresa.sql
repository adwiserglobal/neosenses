-- ============================================================
-- NeoSenses — 010: dados cadastrais e o tópico de pagamento
-- ============================================================
-- Três buracos que a auditoria apontou e que dependem de informação que só a
-- empresa tem. Aqui se cria o lugar onde ela mora; o preenchimento acontece
-- no painel, em /admin/configuracoes.
--
--   1. A página de Termos exibe "CNPJ: XX.XXX.XXX/0001-XX". Documento de
--      placeholder num contrato de adesão é pior que documento ausente:
--      passa a impressão de contrato real onde não há parte identificada.
--
--   2. Não há registro Cadastur em lugar nenhum. Prestador de serviço
--      turístico se cadastra no Ministério do Turismo, e exibir o número é
--      sinal de legitimidade que o público desse ticket procura.
--
--   3. Não existe uma linha sobre pagamento no site inteiro, e o Concierge é
--      instruído a desviar da pergunta. Quem vai comprometer vinte mil reais
--      quer saber em quantas vezes antes de falar com alguém.
--
-- O conteúdo de pagamento entra na migration 011, e não aqui: um valor novo
-- de enum não pode ser usado na mesma transação em que é criado.
--
-- Idempotente.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Dados cadastrais
-- ─────────────────────────────────────────────────────────────
-- Nascem vazios de propósito. As páginas omitem a linha quando o valor está
-- em branco — melhor um campo ausente que um número inventado exibido como
-- verdadeiro.
INSERT INTO settings (key, value, description, is_public) VALUES
  ('empresa.razao_social', '""', 'Razão social, como no cartão CNPJ', true),
  ('empresa.cnpj',         '""', 'CNPJ. Enquanto vazio, os Termos omitem a linha', true),
  ('empresa.cadastur',     '""', 'Registro no Cadastur (Ministério do Turismo)', true),
  ('empresa.endereco',     '"Rua Alegre, 928 – Santa Paula, São Caetano do Sul – SP, 09550-250"',
                                 'Endereço exibido no rodapé e nos Termos', true),
  ('empresa.fundacao',     '""', 'Ano de fundação. Aparece na página Sobre', true)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Tópico de pagamento
-- ─────────────────────────────────────────────────────────────
-- Fora de bloco DO e sozinho na migration: `ALTER TYPE ... ADD VALUE` não
-- roda dentro de bloco de função, e o valor novo só pode ser usado a partir
-- da próxima transação.
--
-- O tópico entra em `guide_topic` — o mesmo enum que o Concierge já consulta —
-- em vez de virar tabela nova. Assim a resposta sobre parcelamento aparece no
-- chat, no momento da dúvida, e não só para quem achar a página certa.
ALTER TYPE guide_topic ADD VALUE IF NOT EXISTS 'pagamento';
