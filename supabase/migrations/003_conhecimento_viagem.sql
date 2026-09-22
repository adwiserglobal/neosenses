-- ============================================================
-- NeoSenses — 003: Conhecimento de viagem
-- ============================================================
-- Responde a: "o que levar, o que fazer, o que NÃO fazer, pontos de
-- encontro, e o que quem nunca viajou em grupo precisa saber".
--
-- Por que estruturado e não texto solto:
--   • O Concierge cita a fonte certa em vez de inventar.
--   • O Packing Assistant monta lista por regra (clima, altitude, dias).
--   • O Journey Builder sabe o que é viável em cada destino.
-- Uma edição no admin reflete nos três.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Tipos
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  CREATE TYPE guide_topic AS ENUM (
    'o_que_levar',        -- bagagem, roupas, equipamentos
    'o_que_fazer',        -- recomendações no destino
    'o_que_nao_fazer',    -- erros comuns, tabus culturais, riscos
    'ponto_de_encontro',  -- onde e quando o grupo se encontra
    'documentos',         -- passaporte, visto, seguro
    'saude',              -- vacinas, altitude, remédios, água
    'clima',              -- quando ir, o que esperar
    'dinheiro',           -- moeda, câmbio, gorjeta, cartão
    'conectividade',      -- chip, wi-fi, tomada
    'cultura_local',      -- etiqueta, vestimenta, costumes
    'alimentacao',        -- restrições, comida local, água
    'seguranca',          -- cuidados práticos
    'viagem_em_grupo',    -- para quem nunca viajou em grupo
    'pratica_espiritual', -- meditação, silêncio, cerimônias
    'acessibilidade'      -- mobilidade, necessidades específicas
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE guide_scope AS ENUM ('global', 'country', 'destination', 'experience', 'category');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- Guias de viagem
-- ─────────────────────────────────────────────────────────────
-- Escopo em cascata: uma dica 'global' vale para todos; uma de
-- 'destination' se soma às globais e as sobrepõe quando conflitam.
CREATE TABLE IF NOT EXISTS travel_guides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic         guide_topic NOT NULL,
  scope         guide_scope NOT NULL DEFAULT 'global',
  -- Alvo do escopo. Exatamente um deve estar preenchido (ou nenhum, se global).
  country_id    UUID REFERENCES countries(id)     ON DELETE CASCADE,
  destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id)   ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id)    ON DELETE CASCADE,

  title         JSONB NOT NULL,   -- {"pt":"...","en":"...","es":"..."}
  content       JSONB NOT NULL,   -- corpo em markdown simples, por idioma
  -- Resumo de uma linha: é isto que entra no prompt do Concierge quando
  -- o contexto é curto. Sem isso, o prompt estoura e a IA perde o essencial.
  summary       JSONB,

  -- Prioridade na resposta. 1 = crítico ("não beba água da torneira"),
  -- 5 = curiosidade. O Concierge corta pelas de menor prioridade.
  priority      SMALLINT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  -- Marca dica que só faz sentido para quem viaja em grupo pela 1ª vez.
  for_beginners BOOLEAN NOT NULL DEFAULT false,
  -- Condições de aplicabilidade — ver documentação no README de migrations.
  -- Ex.: {"meses":[12,1,2],"altitude_min_m":2500,"duracao_min_dias":7}
  conditions    JSONB NOT NULL DEFAULT '{}',

  source_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- O escopo tem que bater com o alvo preenchido. Sem isso entra lixo
  -- do tipo scope='destination' sem destino, que some das buscas.
  CONSTRAINT escopo_bate_com_alvo CHECK (
    (scope = 'global'      AND country_id IS NULL AND destination_id IS NULL AND experience_id IS NULL AND category_id IS NULL) OR
    (scope = 'country'     AND country_id IS NOT NULL) OR
    (scope = 'destination' AND destination_id IS NOT NULL) OR
    (scope = 'experience'  AND experience_id IS NOT NULL) OR
    (scope = 'category'    AND category_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_guides_topic       ON travel_guides(topic, is_active);
CREATE INDEX IF NOT EXISTS idx_guides_destination ON travel_guides(destination_id) WHERE destination_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guides_experience  ON travel_guides(experience_id)  WHERE experience_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guides_country     ON travel_guides(country_id)     WHERE country_id     IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guides_beginners   ON travel_guides(for_beginners)  WHERE for_beginners = true;

-- Chave natural: a mesma dica, no mesmo tópico e no mesmo alvo, é a mesma
-- dica. Sem isto, tanto o seed rodado duas vezes quanto o cadastro repetido
-- pelo admin criam duplicata silenciosa — e o Concierge passa a citar a
-- mesma orientação duas vezes na resposta.
CREATE UNIQUE INDEX IF NOT EXISTS uq_travel_guides_natural ON travel_guides (
  topic,
  scope,
  COALESCE(country_id, destination_id, experience_id, category_id,
           '00000000-0000-0000-0000-000000000000'::uuid),
  lower(title->>'pt')
);

SELECT public.attach_updated_at('travel_guides');

-- ─────────────────────────────────────────────────────────────
-- Catálogo de itens de bagagem
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  CREATE TYPE packing_category AS ENUM (
    'documento',    -- passaporte, visto, seguro, cópias
    'roupa',
    'calcado',
    'higiene',
    'saude',        -- remédios, repelente, protetor
    'equipamento',  -- mochila, bastão, lanterna
    'eletronico',   -- adaptador, powerbank, câmera
    'pratica',      -- almofada de meditação, mala, caderno
    'dinheiro',
    'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Itens reutilizáveis com regra de quando entram na lista.
-- A IA usa este catálogo como base e só acrescenta o que for específico —
-- assim a lista não muda a cada geração nem inventa item.
CREATE TABLE IF NOT EXISTS packing_catalog_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         JSONB NOT NULL,
  description  JSONB,
  category     packing_category NOT NULL DEFAULT 'outro',
  -- Item essencial nunca é cortado da lista, mesmo em viagem curta.
  is_essential BOOLEAN NOT NULL DEFAULT false,
  default_quantity SMALLINT,
  -- Quando este item entra. Vazio = sempre.
  -- {"climate":["frio","chuva"], "altitude_min_m":2500, "activities":["trilha"],
  --  "min_days":7, "countries":["IN","PE"], "months":[12,1,2]}
  conditions   JSONB NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packing_catalog_cat ON packing_catalog_items(category, is_active);

-- Item repetido no catálogo vira item repetido na lista do viajante.
CREATE UNIQUE INDEX IF NOT EXISTS uq_packing_catalog_nome
  ON packing_catalog_items (lower(name->>'pt'));

SELECT public.attach_updated_at('packing_catalog_items');

-- Itens obrigatórios de uma experiência específica, definidos pela equipe.
-- Ex.: "roupa branca para a cerimônia de abertura".
CREATE TABLE IF NOT EXISTS experience_packing_items (
  experience_id   UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES packing_catalog_items(id) ON DELETE CASCADE,
  is_required     BOOLEAN NOT NULL DEFAULT true,
  note            JSONB,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (experience_id, catalog_item_id)
);
