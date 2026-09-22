-- ============================================================
-- NeoSenses — Dados de EXEMPLO para desenvolvimento local
-- ============================================================
-- O Supabase CLI aplica este arquivo automaticamente em
-- `supabase start` e `supabase db reset`. Ele NÃO vai para produção.
--
-- ATENÇÃO: tudo aqui é fictício — títulos, preços, datas e pontos de
-- encontro. Serve para ver o site com conteúdo e testar o Concierge com
-- catálogo cheio. O conteúdo real entra pelo painel admin.
--
-- Os nomes seguem os destinos que o site já mencionava nas páginas
-- estáticas, para o visual bater com o que a equipe espera ver.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Países e destinos
-- ─────────────────────────────────────────────────────────────
INSERT INTO countries (name, slug, code, sort_order) VALUES
  ('{"pt":"Peru","en":"Peru","es":"Perú"}',           'peru',      'PE', 1),
  ('{"pt":"Índia","en":"India","es":"India"}',        'india',     'IN', 2),
  ('{"pt":"Marrocos","en":"Morocco","es":"Marruecos"}','marrocos', 'MA', 3),
  ('{"pt":"Egito","en":"Egypt","es":"Egipto"}',       'egito',     'EG', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO destinations (country_id, name, slug, description, altitude_m, climate, sort_order)
SELECT c.id, d.name, d.slug, d.descricao, d.altitude, d.clima, d.ordem
FROM (VALUES
  ('peru',    '{"pt":"Vale Sagrado e Machu Picchu","en":"Sacred Valley and Machu Picchu","es":"Valle Sagrado y Machu Picchu"}'::jsonb,
              '{"pt":"vale-sagrado","en":"sacred-valley","es":"valle-sagrado"}'::jsonb,
              '{"pt":"Vale dos Incas nos Andes peruanos, com sítios cerimoniais e comunidades quéchuas."}'::jsonb,
              2800, '{"tipo":"montanha","temp_min_c":4,"temp_max_c":22,"estacao_chuvosa":"dez-mar"}'::jsonb, 1),
  ('india',   '{"pt":"Rishikesh e Vale do Ganges","en":"Rishikesh and the Ganges Valley","es":"Rishikesh y el Valle del Ganges"}'::jsonb,
              '{"pt":"rishikesh","en":"rishikesh","es":"rishikesh"}'::jsonb,
              '{"pt":"Cidade do yoga aos pés do Himalaia, às margens do Ganges."}'::jsonb,
              360, '{"tipo":"subtropical","temp_min_c":12,"temp_max_c":38,"estacao_chuvosa":"jul-set"}'::jsonb, 2),
  ('marrocos','{"pt":"Vale das Rosas e Atlas","en":"Valley of Roses and Atlas","es":"Valle de las Rosas y Atlas"}'::jsonb,
              '{"pt":"vale-das-rosas","en":"valley-of-roses","es":"valle-de-las-rosas"}'::jsonb,
              '{"pt":"Vale de cultivo de rosas damascenas entre o Alto Atlas e o deserto."}'::jsonb,
              1450, '{"tipo":"desertico","temp_min_c":6,"temp_max_c":35,"estacao_chuvosa":"nov-fev"}'::jsonb, 3),
  ('egito',   '{"pt":"Luxor e Vale dos Reis","en":"Luxor and Valley of the Kings","es":"Luxor y Valle de los Reyes"}'::jsonb,
              '{"pt":"luxor","en":"luxor","es":"luxor"}'::jsonb,
              '{"pt":"Antiga Tebas, com templos de Karnak e Luxor às margens do Nilo."}'::jsonb,
              76, '{"tipo":"desertico","temp_min_c":8,"temp_max_c":41,"estacao_chuvosa":"nenhuma"}'::jsonb, 4)
) AS d(pais, name, slug, descricao, altitude, clima, ordem)
JOIN countries c ON c.slug = d.pais
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Facilitadores
-- ─────────────────────────────────────────────────────────────
INSERT INTO facilitators (name, slug, short_bio, specializations, sort_order) VALUES
  ('Marina Alves', 'marina-alves',
   '{"pt":"Facilitadora de meditação e práticas contemplativas há 12 anos."}',
   ARRAY['meditação','respiração'], 1),
  ('Rafael Duarte', 'rafael-duarte',
   '{"pt":"Guia de peregrinações e estudioso de tradições ancestrais."}',
   ARRAY['peregrinação','história'], 2)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Experiências
-- ─────────────────────────────────────────────────────────────
INSERT INTO experiences (
  title, slug, short_description, description, category_id, destination_id,
  duration_days, group_size_min, group_size_max, difficulty,
  price_from, intentions, physical_demand, status, is_featured, sort_order, published_at
)
SELECT
  e.title, e.slug, e.resumo, e.descricao,
  (SELECT id FROM categories WHERE slug = e.categoria),
  (SELECT d.id FROM destinations d JOIN countries c ON c.id = d.country_id WHERE c.slug = e.pais LIMIT 1),
  e.dias, e.min_pessoas, e.max_pessoas, e.dificuldade::difficulty_level,
  e.preco, e.intencoes, e.esforco, 'published'::experience_status, e.destaque, e.ordem, now()
FROM (VALUES
  ('{"pt":"Machu Picchu Xamânico","en":"Shamanic Machu Picchu","es":"Machu Picchu Chamánico"}'::jsonb,
   '{"pt":"machu-picchu-xamanico","en":"shamanic-machu-picchu","es":"machu-picchu-chamanico"}'::jsonb,
   '{"pt":"Doze dias pelo Vale Sagrado com cerimônias guiadas por mestres andinos, caminhadas em sítios cerimoniais e prática diária de meditação."}'::jsonb,
   '{"pt":"Uma jornada pelo coração dos Andes peruanos. Os dias combinam visitas a sítios incas, encontros com comunidades quéchuas e cerimônias conduzidas por paqos locais. Há tempo de silêncio todas as manhãs e caminhadas de dificuldade moderada em altitude."}'::jsonb,
   'jornadas', 'peru', 12, 8, 14, 'intermediate', 18900.00,
   ARRAY['meditacao','natureza','cultura_local','autoconhecimento'], 3, true, 1),

  ('{"pt":"Índia: Yoga às Margens do Ganges","en":"India: Yoga by the Ganges","es":"India: Yoga a orillas del Ganges"}'::jsonb,
   '{"pt":"india-yoga-ganges","en":"india-yoga-ganges","es":"india-yoga-ganges"}'::jsonb,
   '{"pt":"Quinze dias em Rishikesh com prática diária de yoga e meditação, estudo de filosofia e imersão na cultura local."}'::jsonb,
   '{"pt":"Duas semanas na cidade do yoga, aos pés do Himalaia. Prática pela manhã e ao fim da tarde, aulas de filosofia, participação no ritual do Ganga Aarti e tempo livre para caminhar pelas margens do rio. Aberto a iniciantes."}'::jsonb,
   'retiros', 'india', 15, 6, 16, 'all_levels', 16400.00,
   ARRAY['meditacao','yoga','cultura_local','descanso'], 2, true, 2),

  ('{"pt":"Marrocos: Rosas e Aromas","en":"Morocco: Roses and Aromas","es":"Marruecos: Rosas y Aromas"}'::jsonb,
   '{"pt":"marrocos-rosas-aromas","en":"morocco-roses-aromas","es":"marruecos-rosas-aromas"}'::jsonb,
   '{"pt":"Dez dias entre o Vale das Rosas e o deserto, com colheita artesanal, destilação de óleos e noites sob as estrelas."}'::jsonb,
   '{"pt":"Uma imersão sensorial no sul marroquino durante a temporada das rosas. Visita a cooperativas de mulheres, oficina de destilação, travessia até as dunas e duas noites em acampamento no deserto."}'::jsonb,
   'imersoes', 'marrocos', 10, 8, 12, 'beginner', 14200.00,
   ARRAY['natureza','cultura_local','descanso'], 2, false, 3),

  ('{"pt":"Egito: Jornada aos Templos","en":"Egypt: Journey to the Temples","es":"Egipto: Jornada a los Templos"}'::jsonb,
   '{"pt":"egito-jornada-templos","en":"egypt-journey-temples","es":"egipto-jornada-templos"}'::jsonb,
   '{"pt":"Onze dias entre Luxor e Assuã, com visitas guiadas aos templos e navegação pelo Nilo."}'::jsonb,
   '{"pt":"Percurso pelos principais templos do Alto Egito, com entradas em horários de menor movimento, meditações conduzidas em espaços cerimoniais e três noites de navegação pelo Nilo."}'::jsonb,
   'jornadas', 'egito', 11, 10, 18, 'beginner', 21500.00,
   ARRAY['cultura_local','meditacao','autoconhecimento'], 2, false, 4)
) AS e(title, slug, resumo, descricao, categoria, pais, dias, min_pessoas, max_pessoas, dificuldade, preco, intencoes, esforco, destaque, ordem)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Datas, com ponto de encontro preenchido
-- ─────────────────────────────────────────────────────────────
-- Datas relativas a hoje: o seed continua fazendo sentido meses depois,
-- sem virar um catálogo de viagens que já aconteceram.
INSERT INTO experience_dates (experience_id, start_date, end_date, price, spots_total, spots_taken, meeting_point, status)
SELECT
  e.id,
  (CURRENT_DATE + d.dias_ate_inicio),
  (CURRENT_DATE + d.dias_ate_inicio + (e.duration_days - 1)),
  e.price_from,
  d.vagas,
  d.ocupadas,
  d.encontro,
  'published'::experience_status
FROM experiences e
JOIN (VALUES
  ('machu-picchu-xamanico',  75,  14, 9,
   '{"local":"Aeroporto de Cusco (CUZ), saguão de desembarque","horario":"10h00 do dia 1","instrucoes":{"pt":"O grupo se encontra no saguão de desembarque, junto ao balcão de informações. Traga o casaco na bagagem de mão: Cusco fica a 3.400 m e a temperatura cai à noite."}}'::jsonb),
  ('machu-picchu-xamanico',  160, 14, 3,
   '{"local":"Aeroporto de Cusco (CUZ), saguão de desembarque","horario":"10h00 do dia 1","instrucoes":{"pt":"O grupo se encontra no saguão de desembarque, junto ao balcão de informações."}}'::jsonb),
  ('india-yoga-ganges',      95,  16, 11,
   '{"local":"Aeroporto de Dehradun (DED)","horario":"13h00 do dia 1","instrucoes":{"pt":"Traslado em grupo até Rishikesh, cerca de 1h de carro. Quem chegar antes aguarda no café do saguão."}}'::jsonb),
  ('marrocos-rosas-aromas',  130, 12, 12,
   '{"local":"Aeroporto de Marrakech (RAK), portão de saída do Terminal 1","horario":"15h30 do dia 1","instrucoes":{"pt":"Procure a placa NeoSenses na saída do Terminal 1."}}'::jsonb),
  ('egito-jornada-templos',  110, 18, 6,
   '{"local":"Aeroporto de Luxor (LXR)","horario":"09h00 do dia 1","instrucoes":{"pt":"Recepção com placa NeoSenses no desembarque. O visto egípcio costuma ser emitido na chegada — confirme as regras vigentes com a equipe antes de embarcar."}}'::jsonb)
) AS d(slug, dias_ate_inicio, vagas, ocupadas, encontro) ON e.slug->>'pt' = d.slug
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Dicas específicas de destino
-- ─────────────────────────────────────────────────────────────
INSERT INTO travel_guides (topic, scope, destination_id, title, summary, content, priority, for_beginners, sort_order)
SELECT g.topico::guide_topic, 'destination'::guide_scope, d.id, g.titulo, g.resumo, g.conteudo, g.prioridade, g.iniciante, g.ordem
FROM (VALUES
  ('vale-sagrado', 'saude',
   '{"pt":"Altitude no Vale Sagrado","en":"Altitude in the Sacred Valley","es":"Altitud en el Valle Sagrado"}'::jsonb,
   '{"pt":"Cusco fica a 3.400 m. Os primeiros dias pedem ritmo lento, muita água e nada de álcool."}'::jsonb,
   '{"pt":"O mal de altitude não tem relação com preparo físico: atinge atleta e sedentário igualmente.\n\nO que ajuda nos primeiros dias: subir devagar, beber bem mais água que o normal, comer leve, evitar álcool e aceitar o chá de coca oferecido localmente.\n\nSintomas comuns nas primeiras 48 horas são dor de cabeça leve, falta de ar ao subir escada e sono ruim. Avise o facilitador se aparecerem — há protocolo para isso.\n\nSe você tem condição cardíaca ou respiratória, converse com seu médico antes de reservar."}'::jsonb,
   1, true, 1),
  ('vale-sagrado', 'o_que_levar',
   '{"pt":"Bagagem para os Andes","en":"Packing for the Andes","es":"Equipaje para los Andes"}'::jsonb,
   '{"pt":"Camadas, protetor solar forte e calçado amaciado. O dia é quente e a noite chega perto de zero."}'::jsonb,
   '{"pt":"A amplitude térmica é o que mais surpreende: 22 °C ao meio-dia e perto de 0 °C à noite, no mesmo dia.\n\nLeve camadas em vez de uma peça grossa, casaco corta-vento, gorro e luva fina para as manhãs, protetor solar alto (o sol de altitude queima rápido mesmo com nuvem) e tênis de caminhada já amaciado.\n\nUma garrafa térmica rende muito: água quente é oferecida nas hospedagens."}'::jsonb,
   2, true, 2),
  ('rishikesh', 'cultura_local',
   '{"pt":"Etiqueta em Rishikesh","en":"Etiquette in Rishikesh","es":"Etiqueta en Rishikesh"}'::jsonb,
   '{"pt":"Cidade sagrada: ombros e joelhos cobertos, e é vegetariana e sem álcool por lei."}'::jsonb,
   '{"pt":"Rishikesh é cidade sagrada. Por lei, não se vende carne nem álcool.\n\nUse roupas que cubram ombros e joelhos, inclusive os homens. Um lenço grande resolve na maioria das situações e serve também para sentar durante a prática.\n\nEntra-se descalço em templos e em muitas salas de yoga. Ao participar do Ganga Aarti, siga o facilitador: há momentos em que fotografar não é bem-vindo."}'::jsonb,
   2, true, 3),
  ('luxor', 'clima',
   '{"pt":"Calor em Luxor","en":"Heat in Luxor","es":"Calor en Luxor"}'::jsonb,
   '{"pt":"Verão passa de 40 °C. As visitas começam cedo e o meio do dia é de descanso."}'::jsonb,
   '{"pt":"Entre junho e setembro a temperatura passa de 40 °C com facilidade. Por isso o roteiro começa ao amanhecer e reserva o meio do dia para descanso.\n\nLeve chapéu de aba larga, roupa clara de tecido leve e de manga comprida (protege mais do sol que a camiseta), e garrafa de água sempre cheia. Beba antes de sentir sede."}'::jsonb,
   2, false, 4)
) AS g(destino, topico, titulo, resumo, conteudo, prioridade, iniciante, ordem)
JOIN destinations d ON d.slug->>'pt' = g.destino
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- FAQs
-- ─────────────────────────────────────────────────────────────
INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('{"pt":"Preciso ter experiência com meditação?","en":"Do I need meditation experience?","es":"¿Necesito experiencia en meditación?"}',
   '{"pt":"Não. As práticas são conduzidas passo a passo e recebem tanto quem nunca meditou quanto quem já pratica há anos."}',
   'praticas', 1),
  ('{"pt":"Posso viajar sozinho?","en":"Can I travel alone?","es":"¿Puedo viajar solo?"}',
   '{"pt":"Sim, e boa parte do grupo costuma vir assim. Quem viaja sozinho divide quarto duplo com outra pessoa do mesmo gênero, ou pode solicitar quarto individual com suplemento."}',
   'grupo', 2),
  ('{"pt":"Qual o tamanho dos grupos?","en":"How big are the groups?","es":"¿De qué tamaño son los grupos?"}',
   '{"pt":"Grupos pequenos, entre 6 e 18 pessoas conforme a experiência. O número exato de cada saída está na página da experiência."}',
   'grupo', 3)
ON CONFLICT DO NOTHING;
