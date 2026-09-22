-- ============================================================
-- NeoSenses — 006: Conteúdo inicial
-- ============================================================
-- Categorias, configuração, catálogo de bagagem e os guias de viagem
-- em grupo — a base que o Concierge, o Packing Assistant e o Journey
-- Builder consultam.
--
-- Regra do conteúdo aqui: só afirmação verdadeira e genérica.
-- Nada de visto, vacina, preço ou data específicos — isso muda, depende
-- do país e da data, e o time confirma caso a caso. Onde o viajante
-- precisa confirmar, o texto diz isso com todas as letras.
--
-- Idempotente: pode rodar de novo sem duplicar.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Categorias
-- ─────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('{"pt":"Retiros","en":"Retreats","es":"Retiros"}',                          'retiros',       'lotus',     1),
  ('{"pt":"Jornadas Espirituais","en":"Spiritual Journeys","es":"Jornadas Espirituales"}', 'jornadas', 'compass', 2),
  ('{"pt":"Peregrinações","en":"Pilgrimages","es":"Peregrinaciones"}',         'peregrinacoes', 'footprints',3),
  ('{"pt":"Imersões","en":"Immersions","es":"Inmersiones"}',                   'imersoes',      'waves',     4),
  ('{"pt":"Workshops","en":"Workshops","es":"Talleres"}',                      'workshops',     'sparkles',  5),
  ('{"pt":"Jornadas Femininas","en":"Women''s Journeys","es":"Jornadas Femeninas"}', 'feminino', 'heart',    6),
  ('{"pt":"Festivais","en":"Festivals","es":"Festivales"}',                    'festivais',     'music',     7)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Configuração
-- ─────────────────────────────────────────────────────────────
-- is_public = true só onde o valor pode aparecer no site.
INSERT INTO settings (key, value, description, is_public) VALUES
  ('site.name',         '"NeoSenses"',                                                          'Nome do site',    true),
  ('site.tagline',      '{"pt":"Um Novo Sentir","en":"A New Feeling","es":"Un Nuevo Sentir"}',   'Tagline',         true),
  ('site.email',        '"contato@neosenses.com.br"',                                           'E-mail público',  true),
  ('site.whatsapp',     '"5511947188319"',                                                      'WhatsApp',        true),
  ('concierge.enabled', 'true',                                                                 'Concierge ligado',true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (key, enabled, description) VALUES
  ('concierge',         true,  'AI Concierge'),
  ('journey_builder',   false, 'AI Journey Builder — ligar quando houver experiências publicadas'),
  ('packing_assistant', false, 'AI Packing Assistant — ligar quando houver reservas'),
  ('community_matching',false, 'AI Community Matching — ligar quando houver grupo formado'),
  ('booking',           false, 'Reserva on-line'),
  ('newsletter',        true,  'Newsletter'),
  ('blog',              true,  'Blog')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Catálogo de bagagem
-- ─────────────────────────────────────────────────────────────
-- conditions vazio = entra em toda lista.
-- Com condição = o Packing Assistant só inclui quando ela bate.
INSERT INTO packing_catalog_items (name, description, category, is_essential, default_quantity, conditions, sort_order) VALUES

-- Documentos — sempre
('{"pt":"Passaporte","en":"Passport","es":"Pasaporte"}',
 '{"pt":"Confira a validade com antecedência: muitos países exigem pelo menos 6 meses de validade a partir da data de entrada. Renovação demora — não deixe para a última semana."}',
 'documento', true, 1, '{}', 1),

('{"pt":"Cópia digital e física dos documentos","en":"Digital and paper copies of documents","es":"Copias digitales y físicas de los documentos"}',
 '{"pt":"Fotografe passaporte, seguro e passagens e guarde no celular e na nuvem. Leve também uma cópia em papel, separada do original — se a bolsa sumir, você ainda tem como se identificar."}',
 'documento', true, 1, '{}', 2),

('{"pt":"Seguro viagem","en":"Travel insurance","es":"Seguro de viaje"}',
 '{"pt":"Leve o número da apólice e o telefone de emergência anotados fora do celular. Confirme com a equipe NeoSenses se a sua experiência exige cobertura mínima."}',
 'documento', true, 1, '{}', 3),

('{"pt":"Cartão de vacinação","en":"Vaccination card","es":"Cartilla de vacunación"}',
 '{"pt":"Alguns destinos pedem comprovação. Quais vacinas se aplicam à sua viagem deve ser confirmado com a equipe NeoSenses e com um serviço de saúde do viajante — a exigência muda por país e por data."}',
 'documento', false, 1, '{}', 4),

-- Saúde — sempre
('{"pt":"Remédios de uso contínuo + receita","en":"Ongoing medication + prescription","es":"Medicamentos de uso continuo + receta"}',
 '{"pt":"Leve na bagagem de mão, na embalagem original, em quantidade para toda a viagem mais alguns dias extras. A receita evita problema na alfândega e ajuda se você precisar repor no destino."}',
 'saude', true, 1, '{}', 10),

('{"pt":"Kit básico de primeiros socorros","en":"Basic first-aid kit","es":"Botiquín básico"}',
 '{"pt":"Analgésico, antitérmico, antialérgico, curativo e o que você costuma usar. Marca conhecida no seu país pode não existir no destino."}',
 'saude', false, 1, '{}', 11),

('{"pt":"Protetor solar","en":"Sunscreen","es":"Protector solar"}',
 '{"pt":"Sol de altitude e de deserto queima mais rápido do que parece, mesmo com tempo nublado."}',
 'saude', false, 1, '{}', 12),

('{"pt":"Repelente","en":"Insect repellent","es":"Repelente"}',
 '{"pt":"Essencial em destino tropical e de mata."}',
 'saude', false, 1, '{"climate":["tropical","umido"]}', 13),

-- Roupa
('{"pt":"Roupas em camadas","en":"Layered clothing","es":"Ropa por capas"}',
 '{"pt":"Camadas finas funcionam melhor que uma peça grossa: dá para ajustar ao longo do dia. Em montanha e deserto a diferença entre o sol do meio-dia e a noite passa de 20 °C."}',
 'roupa', true, NULL, '{}', 20),

('{"pt":"Roupa que cobre ombros e joelhos","en":"Clothing covering shoulders and knees","es":"Ropa que cubra hombros y rodillas"}',
 '{"pt":"Exigida para entrar em templos, mesquitas e muitos espaços sagrados. Um lenço grande resolve na maioria dos casos e ocupa quase nada."}',
 'roupa', true, NULL, '{}', 21),

('{"pt":"Roupa branca ou clara para cerimônia","en":"White or light clothing for ceremony","es":"Ropa blanca o clara para ceremonia"}',
 '{"pt":"Várias vivências pedem branco em momentos específicos. Confirme com a equipe se a sua experiência tem essa orientação."}',
 'roupa', false, 1, '{}', 22),

('{"pt":"Casaco térmico","en":"Warm jacket","es":"Abrigo térmico"}',
 '{"pt":"Necessário em altitude e em destino frio, inclusive quando o dia é quente — a temperatura despenca depois do pôr do sol."}',
 'roupa', false, 1, '{"climate":["frio"],"altitude_min_m":2000}', 23),

('{"pt":"Capa de chuva ou corta-vento","en":"Rain jacket","es":"Impermeable"}',
 '{"pt":"Mais prático que guarda-chuva em trilha e em vento forte."}',
 'roupa', false, 1, '{"climate":["chuva","tropical"]}', 24),

-- Calçado
('{"pt":"Tênis de caminhada já amaciado","en":"Broken-in walking shoes","es":"Zapatillas ya amoldadas"}',
 '{"pt":"Nunca estreie calçado na viagem. Use por pelo menos duas semanas antes — bolha no segundo dia estraga a experiência inteira."}',
 'calcado', true, 1, '{}', 30),

('{"pt":"Sandália ou chinelo","en":"Sandals or flip-flops","es":"Sandalias o chanclas"}',
 '{"pt":"Para banho compartilhado, descanso e locais onde se entra descalço."}',
 'calcado', false, 1, '{}', 31),

-- Equipamento
('{"pt":"Mochila de uso diário","en":"Day pack","es":"Mochila de uso diario"}',
 '{"pt":"Para o passeio do dia: água, casaco, câmera e documento. A mala grande fica no hotel."}',
 'equipamento', true, 1, '{}', 40),

('{"pt":"Garrafa de água reutilizável","en":"Reusable water bottle","es":"Botella reutilizable"}',
 '{"pt":"Reduz plástico e garante água sempre à mão. Em destino onde não se bebe água da torneira, use a garrafa para reabastecer de fonte segura."}',
 'equipamento', true, 1, '{}', 41),

('{"pt":"Lanterna de cabeça","en":"Headlamp","es":"Linterna frontal"}',
 '{"pt":"Útil em amanhecer, caverna, sítio arqueológico e lugar sem iluminação. Deixa as mãos livres."}',
 'equipamento', false, 1, '{"activities":["trilha","caminhada"]}', 42),

('{"pt":"Bastão de caminhada","en":"Trekking pole","es":"Bastón de trekking"}',
 '{"pt":"Poupa o joelho na descida. Verifique se pode ir na bagagem de mão — em geral não pode."}',
 'equipamento', false, 1, '{"activities":["trilha"]}', 43),

-- Eletrônicos
('{"pt":"Adaptador de tomada universal","en":"Universal power adapter","es":"Adaptador de enchufe universal"}',
 '{"pt":"O padrão de tomada muda de país para país. Confirme o do seu destino antes de comprar."}',
 'eletronico', true, 1, '{}', 50),

('{"pt":"Power bank","en":"Power bank","es":"Batería portátil"}',
 '{"pt":"Dia inteiro fora com GPS e fotos esgota o celular. Deve ir na bagagem de mão — companhia aérea não aceita despachada."}',
 'eletronico', false, 1, '{}', 51),

-- Prática
('{"pt":"Caderno ou diário de viagem","en":"Journal","es":"Diario de viaje"}',
 '{"pt":"Boa parte do que se transforma numa jornada aparece quando você escreve. Muitas vivências reservam um tempo para isso."}',
 'pratica', false, 1, '{}', 60),

('{"pt":"Xale ou pano para meditação","en":"Shawl or meditation cloth","es":"Chal o tela para meditación"}',
 '{"pt":"Serve para sentar, cobrir os ombros em templo e aquecer em prática longa. Peça de três usos — vale o espaço na mala."}',
 'pratica', false, 1, '{}', 61),

-- Dinheiro
('{"pt":"Dinheiro local em espécie","en":"Local currency in cash","es":"Efectivo en moneda local"}',
 '{"pt":"Feira, gorjeta, transporte pequeno e comunidade rural muitas vezes não aceitam cartão. Leve notas pequenas."}',
 'dinheiro', true, NULL, '{}', 70),

('{"pt":"Cartão avisado ao banco","en":"Card with travel notice","es":"Tarjeta avisada al banco"}',
 '{"pt":"Avise a viagem ao banco antes de embarcar. Compra internacional inesperada é bloqueada por segurança — e resolver isso de fora do país é demorado."}',
 'dinheiro', false, NULL, '{}', 71)

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Guias: primeira viagem em grupo
-- ─────────────────────────────────────────────────────────────
-- for_beginners = true → o Concierge prioriza quando a pessoa diz que é
-- a primeira vez, e o Journey Builder acrescenta ao roteiro.
INSERT INTO travel_guides (topic, scope, title, summary, content, priority, for_beginners, sort_order) VALUES

('viagem_em_grupo', 'global',
 '{"pt":"O ritmo é do grupo, não seu","en":"The group sets the pace","es":"El ritmo es del grupo"}',
 '{"pt":"Em viagem em grupo os horários são combinados e a pontualidade é o que mantém o roteiro de pé.","en":"In group travel, schedules are shared and punctuality keeps the itinerary standing.","es":"En viaje en grupo los horarios son acordados y la puntualidad sostiene el itinerario."}',
 '{"pt":"Esta é a maior diferença para quem só viajou sozinho ou em casal. Os horários são combinados com antecedência e o grupo depende de cada pessoa para cumprir o roteiro.\n\nNa prática:\n\n• Chegue cinco minutos antes do combinado, não em cima da hora.\n• Se for atrasar, avise o facilitador — não deixe o grupo adivinhando.\n• O ônibus que espera dez minutos por uma pessoa perde o horário do sítio seguinte e às vezes a visita inteira.\n\nEm troca do ritmo combinado você ganha uma coisa que viagem solo não dá: não precisa decidir nada de logística. Onde comer, como chegar, que horas sair — está resolvido."}',
 1, true, 1),

('viagem_em_grupo', 'global',
 '{"pt":"Quarto compartilhado: como funciona","en":"Shared rooms: how it works","es":"Habitación compartida: cómo funciona"}',
 '{"pt":"O padrão é quarto duplo com outra pessoa do grupo. Quarto individual costuma ter suplemento e precisa ser pedido antes.","en":"The default is a double room shared with someone from the group. A single room usually carries a supplement and must be requested in advance.","es":"El estándar es habitación doble compartida. La individual suele tener suplemento y debe pedirse antes."}',
 '{"pt":"Na maioria das experiências o padrão é quarto duplo dividido com outra pessoa do grupo, do mesmo gênero, quando você viaja sozinho.\n\nSe prefere ficar sozinho, peça o quarto individual na hora da reserva — há suplemento e o número de quartos é limitado. Pedir na véspera raramente dá certo.\n\nDuas coisas que resolvem 90% do desconforto: tampão de ouvido e máscara de dormir. Levam espaço zero.\n\nSe tiver alguma necessidade específica — sono leve, ronco, questão de saúde, mobilidade —, diga à equipe antes da viagem. Dá para acomodar quando se sabe com antecedência; no dia, não."}',
 2, true, 2),

('viagem_em_grupo', 'global',
 '{"pt":"Avise restrição alimentar antes, não no dia","en":"Report dietary restrictions in advance","es":"Avise restricciones alimentarias con antelación"}',
 '{"pt":"Restrição alimentar, alergia e necessidade de saúde precisam ser informadas na reserva — no destino nem sempre há alternativa.","en":"Dietary restrictions, allergies and health needs must be reported at booking — alternatives may not exist on site.","es":"Restricciones, alergias y necesidades de salud deben informarse en la reserva."}',
 '{"pt":"Vegetariano, vegano, sem glúten, alergia a frutos do mar, intolerância a lactose: informe na reserva.\n\nAs refeições de grupo são encomendadas com antecedência. Em pousada de comunidade rural ou refeitório de retiro, não existe cardápio alternativo para pedir na hora — o que foi combinado é o que tem.\n\nAlergia grave merece atenção redobrada: leve seu medicamento de emergência e conte a pelo menos uma pessoa do grupo onde ele está e como usar."}',
 1, true, 3),

('viagem_em_grupo', 'global',
 '{"pt":"Leve menos do que você acha que precisa","en":"Pack less than you think you need","es":"Lleve menos de lo que cree necesitar"}',
 '{"pt":"Mala pesada atrapalha em escada, van e piso irregular. Camadas leves rendem mais que muitas peças.","en":"A heavy bag gets in the way on stairs, vans and uneven ground. Light layers go further than many garments.","es":"La maleta pesada estorba en escaleras, furgonetas y suelo irregular."}',
 '{"pt":"Quase todo mundo leva demais na primeira viagem em grupo e volta dizendo que usou metade.\n\nO que ajuda:\n\n• Monte a mala, tire um terço, feche.\n• Escolha peças que combinem entre si e sequem rápido.\n• Deixe espaço para a volta — sempre volta mais coisa do que foi.\n• Você vai carregar a própria mala em escada, van, calçada irregular e às vezes trilha curta até a hospedagem.\n\nRoupa é o item que mais sobra. Documento, remédio e calçado confortável são os que fazem falta de verdade."}',
 2, true, 4),

('viagem_em_grupo', 'global',
 '{"pt":"Momentos de silêncio fazem parte","en":"Silence is part of it","es":"El silencio es parte"}',
 '{"pt":"Várias experiências têm períodos de silêncio e prática. Não é formalidade — é o que sustenta a vivência.","en":"Many experiences include periods of silence and practice. It is not a formality.","es":"Muchas experiencias incluyen períodos de silencio y práctica."}',
 '{"pt":"Meditação, cerimônia, caminhada em silêncio e amanhecer sem conversa aparecem em boa parte das jornadas.\n\nSe é novidade para você, duas coisas ajudam: ninguém espera que você faça certo, e desconforto no começo é normal e passa.\n\nO que se pede é respeitar quem está em prática — inclusive não puxar conversa, não usar o celular no ambiente e não fotografar."}',
 2, true, 5),

('viagem_em_grupo', 'global',
 '{"pt":"Tempo livre também é parte do roteiro","en":"Free time is part of the itinerary too","es":"El tiempo libre también es parte"}',
 '{"pt":"Nem tudo é atividade em conjunto. Recolher-se um pouco é normal e não é desfeita com o grupo.","en":"Not everything is a group activity. Taking time alone is normal.","es":"No todo es actividad en grupo. Retirarse un poco es normal."}',
 '{"pt":"Conviver 24 horas com um grupo cansa, mesmo quando o grupo é ótimo. Está previsto: quase todo roteiro tem tempo livre.\n\nUsar esse tempo para dormir, caminhar sozinho ou não fazer nada é legítimo e ninguém leva a mal. Só avise alguém para onde vai — é segurança, não controle.\n\nO contrário também vale: se está se sentindo isolado, diga. Muita gente no grupo está tímida pelos mesmos motivos que você."}',
 3, true, 6),

('viagem_em_grupo', 'global',
 '{"pt":"Desconforto: fale com o facilitador","en":"Discomfort: talk to the facilitator","es":"Incomodidad: hable con el facilitador"}',
 '{"pt":"Qualquer questão — saúde, convivência, expectativa — se resolve melhor cedo e diretamente com quem conduz o grupo.","en":"Any issue is best resolved early and directly with the person leading the group.","es":"Cualquier tema se resuelve mejor temprano y directamente con quien conduce el grupo."}',
 '{"pt":"O facilitador está ali para isso. Passar mal, não dormir, se incomodar com alguém, sentir que a experiência não é o que você imaginava — tudo isso é assunto dele, e quase sempre tem solução quando aparece cedo.\n\nO que costuma dar errado é engolir por dias e explodir no fim, quando já não dá para remanejar quarto, ritmo ou atividade."}',
 2, true, 7),

('viagem_em_grupo', 'global',
 '{"pt":"Não é turismo de lista","en":"This is not checklist tourism","es":"No es turismo de lista"}',
 '{"pt":"O ritmo é mais lento e mais profundo que o de um pacote turístico convencional. Menos pontos, mais permanência.","en":"The pace is slower and deeper than a conventional tour. Fewer sights, more presence.","es":"El ritmo es más lento y profundo que un paquete turístico."}',
 '{"pt":"Quem vem de pacote turístico convencional às vezes estranha: são menos pontos por dia e mais tempo em cada um.\n\nA proposta é permanecer, não colecionar. Um sítio sagrado visitado com calma às cinco da manhã rende mais que quatro visitados às pressas.\n\nSe o seu desejo principal é ver o máximo de lugares no menor tempo, vale conversar com a equipe antes de reservar — talvez outra experiência sirva melhor."}',
 3, true, 8),

-- ─────────────────────────────────────────────────────────────
-- Ponto de encontro
-- ─────────────────────────────────────────────────────────────
('ponto_de_encontro', 'global',
 '{"pt":"Como funciona o ponto de encontro","en":"How the meeting point works","es":"Cómo funciona el punto de encuentro"}',
 '{"pt":"Local, horário e contato do responsável são enviados antes do embarque. O ponto exato varia por experiência e por data.","en":"Place, time and the leader''s contact are sent before departure. The exact point varies by experience and date.","es":"Lugar, horario y contacto se envían antes del embarque."}',
 '{"pt":"O ponto de encontro exato depende da experiência e da data, e é confirmado pela equipe antes do embarque — não confie em informação de outra turma.\n\nO que vale para todas:\n\n• Salve o telefone do facilitador no celular assim que receber, e anote também no papel.\n• Chegue com folga. Em aeroporto e rodoviária, trinta minutos antes do combinado.\n• Se você se atrasar ou se perder no caminho, ligue — não tente adivinhar o próximo passo sozinho.\n• Confirme se o encontro é no destino ou no aeroporto de origem: muda de experiência para experiência.\n\nPara confirmar o ponto e o horário da sua data, fale com a equipe NeoSenses."}',
 1, true, 10),

-- ─────────────────────────────────────────────────────────────
-- O que não fazer
-- ─────────────────────────────────────────────────────────────
('o_que_nao_fazer', 'global',
 '{"pt":"Não fotografe pessoas e cerimônias sem permissão","en":"Do not photograph people or ceremonies without permission","es":"No fotografíe personas ni ceremonias sin permiso"}',
 '{"pt":"Peça autorização antes de fotografar pessoas, rituais e espaços sagrados. Em muitos lugares é proibido.","en":"Ask before photographing people, rituals and sacred spaces. In many places it is forbidden.","es":"Pida permiso antes de fotografiar personas, rituales y espacios sagrados."}',
 '{"pt":"Vale para moradores, crianças, celebrantes e para o próprio grupo em momento de prática.\n\nEm muitos templos e sítios sagrados a fotografia é proibida, e em alguns há multa. Onde é permitida, pagar pela foto de uma pessoa é costume em certas regiões — pergunte ao facilitador qual é a prática local.\n\nA regra simples: se você não pediria para fotografar dentro de uma igreja durante uma missa no Brasil, não faça ali."}',
 1, true, 20),

('o_que_nao_fazer', 'global',
 '{"pt":"Não estreie calçado nem equipamento na viagem","en":"Do not use brand-new shoes or gear on the trip","es":"No estrene calzado ni equipo en el viaje"}',
 '{"pt":"Tênis novo causa bolha no segundo dia. Teste tudo em casa antes.","en":"New shoes cause blisters by day two. Test everything at home first.","es":"El calzado nuevo causa ampollas al segundo día."}',
 '{"pt":"Tênis, mochila, bastão e até meia: use antes, por pelo menos duas semanas.\n\nBolha no pé no segundo dia de uma jornada de dez dias compromete todo o resto, e nem sempre há farmácia por perto."}',
 2, true, 21),

('o_que_nao_fazer', 'global',
 '{"pt":"Não conte com sinal de celular o tempo todo","en":"Do not count on constant mobile signal","es":"No cuente con señal móvil todo el tiempo"}',
 '{"pt":"Montanha, deserto, mata e retiro costumam ter sinal fraco ou nenhum. Combine antes com a família.","en":"Mountains, deserts, forests and retreats often have weak or no signal. Arrange with family beforehand.","es":"Montaña, desierto, selva y retiro suelen no tener señal."}',
 '{"pt":"Combine com a família uma janela de contato — por exemplo, ‘falo todo dia à noite, e se eu não falar não é motivo de alarme’.\n\nBaixe antes o que vai precisar: mapa off-line, documentos, cartão de embarque, contatos. E anote no papel o telefone do facilitador e do hotel; celular sem bateria acontece.\n\nEm várias vivências ficar off-line é parte da proposta, não uma falha."}',
 2, true, 22),

('o_que_nao_fazer', 'global',
 '{"pt":"Não assuma que todo mundo tem a mesma prática","en":"Do not assume everyone shares the same practice","es":"No asuma que todos comparten la misma práctica"}',
 '{"pt":"O grupo reúne pessoas de crenças e trajetórias diferentes. Respeito mútuo é o combinado.","en":"The group brings together people of different beliefs and paths.","es":"El grupo reúne personas de creencias y trayectorias distintas."}',
 '{"pt":"No mesmo grupo costuma haver quem medita há vinte anos e quem nunca meditou, pessoas de tradições religiosas diferentes e pessoas sem nenhuma.\n\nIsso é parte da riqueza. O combinado é não catequizar, não corrigir a prática alheia e não tratar experiência pessoal como verdade para todos."}',
 2, true, 23),

-- ─────────────────────────────────────────────────────────────
-- Documentos, saúde e dinheiro
-- ─────────────────────────────────────────────────────────────
('documentos', 'global',
 '{"pt":"Documentos: o que confirmar antes de embarcar","en":"Documents: what to confirm before departure","es":"Documentos: qué confirmar antes de viajar"}',
 '{"pt":"Passaporte com validade suficiente, visto quando exigido e seguro viagem. As exigências mudam por país e por data — confirme sempre na fonte oficial.","en":"Valid passport, visa where required and travel insurance. Requirements change — always confirm officially.","es":"Pasaporte válido, visado cuando corresponda y seguro de viaje."}',
 '{"pt":"O que verificar com antecedência:\n\n• Validade do passaporte. Vários países exigem no mínimo seis meses a contar da entrada.\n• Visto. Depende do país, da nacionalidade e do motivo da viagem, e pode levar semanas.\n• Seguro viagem. Alguns destinos exigem por lei; leve a apólice à mão.\n• Comprovantes de vacinação, quando aplicável.\n\nEstas informações mudam com frequência. Confirme sempre no consulado ou no órgão oficial do país de destino e com a equipe NeoSenses. Nem a NeoSenses nem o Concierge substituem a fonte oficial."}',
 1, false, 30),

('saude', 'global',
 '{"pt":"Saúde na viagem: o básico que evita problema","en":"Health: the basics that prevent trouble","es":"Salud: lo básico que evita problemas"}',
 '{"pt":"Remédio de uso contínuo na bagagem de mão, hidratação e cuidado com água e comida. Questões específicas: procure um serviço de saúde do viajante.","en":"Ongoing medication in carry-on, hydration and care with water and food.","es":"Medicación continua en el equipaje de mano, hidratación y cuidado con agua y comida."}',
 '{"pt":"Antes de viajar, procure um serviço de saúde do viajante com pelo menos um mês de antecedência — algumas vacinas precisam de tempo para fazer efeito.\n\nDurante:\n\n• Remédio de uso contínuo vai na bagagem de mão, na embalagem original, com receita.\n• Beba água de fonte segura. Em muitos destinos, água da torneira não serve nem para escovar os dentes — pergunte ao facilitador.\n• Coma no ritmo do seu estômago nos primeiros dias.\n• Durma. Fuso e altitude cobram caro de quem não descansa.\n\nEm destino de altitude, suba devagar, beba mais água que o normal e evite álcool nos primeiros dias. Se tiver condição cardíaca ou respiratória, converse com seu médico antes de reservar.\n\nNada aqui substitui orientação médica."}',
 1, true, 31),

('dinheiro', 'global',
 '{"pt":"Dinheiro: espécie, cartão e gorjeta","en":"Money: cash, cards and tipping","es":"Dinero: efectivo, tarjeta y propina"}',
 '{"pt":"Leve alguma quantia em espécie na moeda local, avise o banco antes e pergunte ao facilitador qual é o costume de gorjeta no destino.","en":"Carry some local cash, notify your bank, and ask about local tipping customs.","es":"Lleve algo de efectivo local, avise al banco y pregunte por la costumbre de propina."}',
 '{"pt":"Cartão não é aceito em toda parte. Feira, transporte local, artesanato de comunidade e gorjeta quase sempre pedem dinheiro vivo — e em notas pequenas, porque troco costuma faltar.\n\nAvise a viagem ao banco antes de embarcar, sob risco de bloqueio na primeira compra.\n\nGorjeta varia muito: em alguns países é obrigatória na prática, em outros chega a ser malvista. Pergunte ao facilitador no primeiro dia.\n\nDivida o dinheiro em dois lugares diferentes e não carregue tudo junto."}',
 2, true, 32),

('conectividade', 'global',
 '{"pt":"Chip, wi-fi e tomada","en":"SIM, Wi-Fi and power outlets","es":"Chip, wi-fi y enchufes"}',
 '{"pt":"Resolva o acesso à internet antes de embarcar e confirme o padrão de tomada do destino.","en":"Sort out internet access before departure and check the destination''s plug type.","es":"Resuelva el acceso a internet antes y confirme el tipo de enchufe."}',
 '{"pt":"Opções: chip internacional comprado no Brasil, eSIM ativado antes do embarque, ou chip local comprado no destino. O eSIM costuma ser o mais prático quando o aparelho aceita.\n\nWi-fi de hotel em região remota é lento e instável — conte com isso, não com ele.\n\nO padrão de tomada muda de país para país; um adaptador universal resolve. Leve também uma extensão pequena ou um carregador de várias saídas: quarto compartilhado costuma ter menos tomadas do que gente."}',
 3, true, 33),

('cultura_local', 'global',
 '{"pt":"Etiqueta: você é visitante","en":"Etiquette: you are a guest","es":"Etiqueta: usted es visitante"}',
 '{"pt":"Vestimenta, gesto e comportamento adequados variam muito. Observe primeiro, pergunte ao facilitador, aja depois.","en":"Appropriate dress and behaviour vary widely. Observe first, ask, then act.","es":"La vestimenta y el comportamiento apropiados varían mucho."}',
 '{"pt":"Alguns pontos que se repetem em quase todo destino:\n\n• Vestimenta: ombros e joelhos cobertos em espaço religioso. Em alguns lugares, cabelo coberto.\n• Calçado: em muitos templos e casas se entra descalço. Meia limpa ajuda.\n• Mão e pé: em várias culturas, apontar o pé para uma pessoa ou imagem sagrada é ofensa, e come-se com a mão direita.\n• Cumprimento: nem todo lugar cumprimenta com beijo, abraço ou aperto de mão.\n• Barganha: em alguns mercados é esperada; em outros, ofensiva.\n\nA regra que funciona sempre: observe o que os locais fazem e pergunte ao facilitador antes, não depois."}',
 2, true, 34)

ON CONFLICT DO NOTHING;
