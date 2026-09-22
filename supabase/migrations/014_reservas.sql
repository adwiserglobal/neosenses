-- ============================================================
-- NeoSenses — 014: endereço do sistema de reservas
-- ============================================================
-- O site tinha dois caminhos para quem quer ir: registrar interesse (o
-- formulário) e WhatsApp. Faltava o terceiro, que é o único que fecha —
-- a plataforma de reserva onde a pessoa escolhe a data e paga.
--
-- Entra como configuração, e não como endereço fixo no código, porque muda
-- de dono: hoje é suareservaonline, amanhã pode ser outra. Endereço de
-- fechamento de venda enterrado em JSX é o que ninguém encontra no dia da
-- troca.
--
-- `is_public` porque o site público precisa ler para montar o botão.
--
-- Idempotente.
-- ============================================================

INSERT INTO public.settings (key, value, description, is_public)
VALUES
  (
    'site.reservas_url',
    '"https://neosenses.suareservaonline.com.br/"'::jsonb,
    'Plataforma de reservas. Vazio esconde o botão Reservar em vez de deixar um link morto na página.',
    true
  ),
  (
    'site.reservas_rotulo',
    '"Reservar agora"'::jsonb,
    'Texto do botão de reserva.',
    true
  )
ON CONFLICT (key) DO UPDATE
  SET value       = EXCLUDED.value,
      description = EXCLUDED.description,
      is_public   = EXCLUDED.is_public;

DO $$
DECLARE
  destino TEXT;
BEGIN
  SELECT value #>> '{}' INTO destino FROM public.settings WHERE key = 'site.reservas_url';
  RAISE NOTICE 'Migration 014: reservas apontam para %', coalesce(destino, '(vazio)');
END;
$$;
