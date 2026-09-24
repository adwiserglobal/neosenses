export interface MigratedHighlight {
  title: string;
  description: string;
}

export interface MigratedStep {
  day: number;
  title: string;
  description: string;
  location?: string;
  image?: string;
}

export interface MigratedFacilitator {
  name: string;
  role: string;
  bio: string;
}

export interface MigratedExperience {
  slug: string;
  title: string;
  kicker: string;
  subtitle: string;
  destination: string;
  country: string;
  period: string;
  summary: string;
  description: string;
  why: string;
  value: string;
  forWhom: string;
  hero: string;
  photos: string[];
  highlights: MigratedHighlight[];
  itinerary: MigratedStep[];
  facilitators: MigratedFacilitator[];
  notes?: string[];
  sourceUrl: string;
}

export const migratedExperiences: MigratedExperience[] = [
  {
    slug: "tailandia-iluminada",
    title: "Tailândia Iluminada",
    kicker: "Jornada espiritual · Tailândia",
    subtitle: "Roteiro espiritual pelo norte e sul da Tailândia",
    destination: "Tailândia",
    country: "Tailândia",
    period: "Próximas saídas sob consulta",
    summary:
      "Uma travessia por templos budistas, centros de meditação, paisagens do norte e ilhas do sul, combinando cultura, contemplação e autoconhecimento.",
    description:
      "A Tailândia Iluminada nasceu como uma jornada de autoconhecimento conduzida em grupo, atravessando lugares de forte significado espiritual e cultural. O roteiro conecta Bangkok, antigas capitais, Chiang Rai e Chiang Mai, com possibilidade de extensão ao sul do país.\n\nA proposta não é apenas visitar monumentos. É criar espaço para observar, meditar, conviver com tradições locais e experimentar a Tailândia a partir de uma presença mais consciente.",
    why:
      "Templos, encontros com a tradição budista, meditação e celebrações culturais formam o fio desta jornada. O percurso foi desenhado para alternar descoberta, silêncio, natureza e convivência, sem transformar a viagem em uma sequência de pontos turísticos.",
    value:
      "Uma experiência que aproxima espiritualidade e viagem: do Buda de Esmeralda em Bangkok à atmosfera de Chiang Mai, do centro de meditação Wat Suan Dok às paisagens tropicais do sul.",
    forWhom:
      "Para quem deseja conhecer a Tailândia com profundidade, interesse por espiritualidade e cultura, abertura para práticas contemplativas e vontade de viver uma viagem em grupo com propósito.",
    hero: "/images/destinations/thailand.png",
    photos: ["/images/destinations/thailand.png"],
    highlights: [
      {
        title: "Templos de Bangkok",
        description:
          "Wat Pho, o complexo do Grande Palácio e o Templo do Buda de Esmeralda fazem parte do mergulho inicial na tradição budista tailandesa.",
      },
      {
        title: "Wat Suan Dok",
        description:
          "Experiência em centro de meditação em Chiang Mai, com espaço para prática contemplativa e contato com a tradição monástica.",
      },
      {
        title: "Festival das Lanternas",
        description:
          "A celebração de Chiang Mai reúne lanternas, rituais e luzes em uma das imagens mais marcantes da cultura do norte da Tailândia.",
      },
      {
        title: "Chiang Rai e Triângulo Dourado",
        description:
          "Uma etapa de paisagens, história e arquitetura singular, incluindo o Wat Rong Khun e a região do Triângulo Dourado.",
      },
      {
        title: "Natureza e cultura local",
        description:
          "O roteiro inclui experiências em áreas rurais, mercados, artesanato e contato com diferentes paisagens do país.",
      },
      {
        title: "Extensão ao sul",
        description:
          "Para quem deseja prolongar a jornada, a proposta original contempla Krabi, Phi Phi e as águas do sul tailandês.",
      },
    ],
    itinerary: [
      {
        day: 1,
        title: "Chegada a Bangkok",
        location: "Bangkok",
        description: "Recepção e chegada à capital tailandesa, com tempo para acomodação e início da jornada em grupo.",
      },
      {
        day: 2,
        title: "Templos e canais de Bangkok",
        location: "Bangkok",
        description:
          "Dia dedicado a Wat Pho, mercado de flores, Grande Palácio e Buda de Esmeralda, além de navegação pelos canais e visita a Wat Arun, encerrando com prática contemplativa.",
      },
      {
        day: 3,
        title: "Mercados tradicionais",
        location: "Bangkok e arredores",
        description:
          "Visita ao mercado sobre os trilhos e ao mercado flutuante de Damnoen Saduak, aproximando o grupo do cotidiano e dos ritmos locais.",
      },
      {
        day: 4,
        title: "Ayutthaya",
        location: "Ayutthaya",
        description: "Travessia pela antiga capital siamesa e seus complexos históricos e espirituais.",
      },
      {
        day: 5,
        title: "Rumo a Sukhothai",
        location: "Lopburi · Phitsanulok · Sukhothai",
        description:
          "Deslocamento pelo interior do país, passando por Lopburi e Phitsanulok antes da chegada à antiga capital de Sukhothai.",
      },
      {
        day: 6,
        title: "Sukhothai e Chiang Rai",
        location: "Sukhothai · Chiang Rai",
        description:
          "Exploração do parque histórico de Sukhothai, incluindo o Wat Si Chum, antes de seguir para o extremo norte.",
      },
      {
        day: 7,
        title: "Triângulo Dourado",
        location: "Chiang Rai · Chiang Mai",
        description:
          "Dia de Triângulo Dourado, referências históricas da região, Baan Dam e Wat Rong Khun, seguindo depois para Chiang Mai.",
      },
      {
        day: 8,
        title: "Doi Suthep e Wat Suan Dok",
        location: "Chiang Mai",
        description:
          "Visita ao Doi Suthep e entrada na experiência contemplativa de Wat Suan Dok.",
      },
      {
        day: 9,
        title: "Meditação e Festival das Lanternas",
        location: "Chiang Mai",
        description:
          "Continuidade da experiência de meditação e participação na atmosfera do Festival das Lanternas, conforme calendário da saída.",
      },
      {
        day: 10,
        title: "Natureza e tradições do norte",
        location: "Chiang Mai",
        description:
          "Experiências ligadas à natureza, comunidades e artesanato local, encerrando com uma noite de cultura do norte tailandês.",
      },
      {
        day: 11,
        title: "Encerramento do norte ou extensão ao sul",
        location: "Chiang Mai · Bangkok / Krabi",
        description:
          "O roteiro principal retorna a Bangkok. Quem escolhe a extensão segue para o sul e continua a jornada em Krabi.",
      },
      {
        day: 12,
        title: "Phi Phi e mar de Andaman",
        location: "Krabi · Phi Phi",
        description:
          "Na extensão ao sul, navegação por ilhas e enseadas da região de Phi Phi, incluindo paisagens como Maya Bay e Pileh Lagoon, conforme condições locais.",
      },
      {
        day: 13,
        title: "Dia livre no sul",
        location: "Krabi",
        description: "Tempo livre para descanso e integração da experiência em meio à paisagem tropical.",
      },
      {
        day: 14,
        title: "Retorno",
        location: "Sul da Tailândia · Bangkok",
        description: "Encerramento da extensão e retorno para conexão com o voo de saída.",
      },
    ],
    facilitators: [
      {
        name: "Letícia Bhakti",
        role: "Facilitadora",
        bio: "Terapeuta, escritora e facilitadora de retiros e cursos, com trabalho voltado a desenvolvimento humano, reconexão e processos de transformação pessoal.",
      },
      {
        name: "Tarin Flores",
        role: "Acompanhamento de viagem",
        bio: "Terapeuta e profissional com longa experiência em turismo e viagens em grupo, dedicada a acompanhar os participantes ao longo da jornada.",
      },
    ],
    notes: [
      "A página anterior apresentava uma edição de 2024. Datas, valores, requisitos de entrada e programação operacional devem ser reconfirmados para cada nova saída.",
    ],
    sourceUrl: "https://www.neosenses.com.br/tailandia-iluminada/",
  },
  {
    slug: "chapada-dos-veadeiros",
    title: "Desvendando Shakti",
    kicker: "Retiro · Chapada dos Veadeiros",
    subtitle: "A reconexão com a intuição",
    destination: "Chapada dos Veadeiros",
    country: "Brasil",
    period: "Próximas saídas sob consulta",
    summary:
      "Um retiro de autoconhecimento e transformação para reconectar corpo, ciclos, intimidade e essência em meio à natureza da Chapada dos Veadeiros.",
    description:
      "Desvendando Shakti é uma vivência de reconexão com a intuição e com a própria essência. A proposta reúne práticas de autoconhecimento em um território escolhido por sua natureza exuberante e atmosfera de recolhimento.\n\nA palavra Shakti representa poder e energia na tradição hindu e inspira o eixo simbólico do retiro: força divina, transformação e presença.",
    why:
      "A Chapada dos Veadeiros cria um cenário de natureza ampla, silêncio e contato com a terra para uma experiência voltada ao interior. A vivência foi desenhada para abrir espaço para percepção do corpo, dos ciclos e da intimidade.",
    value:
      "Um retiro intimista que combina facilitação terapêutica, natureza e acolhimento em um mesmo percurso de reconexão.",
    forWhom:
      "Para mulheres e pessoas interessadas em autoconhecimento, reconexão com a intuição, consciência corporal e uma experiência de retiro em contato profundo com a natureza.",
    hero: "/images/destinations/brasil.jpg",
    photos: ["/images/destinations/brasil.jpg"],
    highlights: [
      {
        title: "Reconexão com a intuição",
        description: "A vivência propõe um retorno à escuta interna e à percepção do próprio corpo.",
      },
      {
        title: "Shakti",
        description: "O conceito de poder e energia inspira o processo de transformação que dá nome ao retiro.",
      },
      {
        title: "Chapada dos Veadeiros",
        description: "Natureza exuberante e um território escolhido para sustentar pausa, presença e aprofundamento.",
      },
      {
        title: "Sol da Meia Noite",
        description: "A proposta original prevê hospedagem em ambiente de acolhimento e conforto na Chapada.",
      },
    ],
    itinerary: [],
    facilitators: [
      {
        name: "Letícia Bhakti",
        role: "Facilitadora",
        bio: "Terapeuta, escritora e facilitadora de retiros e cursos, dedicada a processos de cura, resgate e conexão com o eu interior.",
      },
      {
        name: "Tarin Flores",
        role: "Facilitadora",
        bio: "Terapeuta e estudante do Budismo Tibetano, com atuação em jornadas para lugares de força e experiências de reconexão.",
      },
    ],
    notes: [
      "A edição exibida na página anterior ocorreu em junho de 2026. A nova página não anuncia essa data como futura.",
    ],
    sourceUrl: "https://www.neosenses.com.br/roteiros/chapadaveadeiros/",
  },
  {
    slug: "machu-picchu-xamanico",
    title: "Machu Picchu Xamânico",
    kicker: "Imersão espiritual · Peru",
    subtitle: "Sabedoria ancestral, presença e conexão",
    destination: "Machu Picchu e Vale Sagrado",
    country: "Peru",
    period: "Próximas saídas sob consulta",
    summary:
      "Uma imersão de autoconhecimento e conexão com a sabedoria ancestral peruana, combinando Machu Picchu, Humantay e vivências conduzidas em grupo.",
    description:
      "A proposta do Machu Picchu Xamânico é unir viagem e processo interior. A experiência foi concebida como um encontro com a cultura e a espiritualidade ancestral peruana, conduzido por pessoas ligadas a práticas xamânicas e terapêuticas.\n\nA imersão é apresentada como uma abordagem espiritual, não religiosa. A programação original declara que não utiliza substâncias para provocar alteração de consciência.",
    why:
      "O Peru reúne territórios de forte simbolismo para a NeoSenses. A jornada aproxima os participantes de Machu Picchu, do Vale Sagrado e da Laguna Humantay enquanto cria espaço para meditação, rituais e reflexão pessoal.",
    value:
      "Uma experiência que combina paisagens andinas, hospedagem sensorial, deslocamentos panorâmicos e vivências de reconexão conduzidas por uma equipe dedicada ao processo do grupo.",
    forWhom:
      "Para quem deseja conhecer o Peru além do roteiro convencional e se identifica com uma proposta de espiritualidade, autoconhecimento, contemplação e sabedoria ancestral.",
    hero: "/images/b2b/peru-machu-picchu.jpg",
    photos: [
      "/images/b2b/peru-humantay.jpg",
      "/images/b2b/peru-vale-sagrado.jpg",
      "/images/b2b/peru-xama.jpg",
      "/images/b2b/peru-cerimonia.jpg",
    ],
    highlights: [
      {
        title: "Machu Picchu",
        description: "Contato com um dos lugares mais simbólicos dos Andes, dentro de uma leitura contemplativa da viagem.",
      },
      {
        title: "Guia xamã",
        description: "Rituais, meditações e ensinamentos ligados à tradição ancestral peruana fazem parte da proposta original.",
      },
      {
        title: "Laguna Humantay",
        description: "Uma travessia física e simbólica associada a presença, desapego e renovação.",
      },
      {
        title: "Trem Vistadome",
        description: "Deslocamento panorâmico pelos Andes, valorizando a paisagem como parte da experiência.",
      },
      {
        title: "Vale Sagrado",
        description: "Hospedagem e vivências próximas ao Rio Urubamba, em uma região central na narrativa espiritual da jornada.",
      },
      {
        title: "Vivências xamânicas",
        description: "Práticas voltadas a percepção, alinhamento e reflexão, respeitando a experiência individual de cada participante.",
      },
    ],
    itinerary: [],
    facilitators: [
      {
        name: "Antarki Huaminca",
        role: "Guia espiritual peruano",
        bio: "Apresentado na experiência original como guia espiritual ligado à sabedoria ancestral peruana, responsável por ensinamentos e vivências do percurso.",
      },
      {
        name: "Ju Gomes",
        role: "Facilitadora",
        bio: "Terapeuta com formação em Psicologia Transpessoal, pesquisadora de xamanismo e professora de Yoga, atuando com autoconhecimento, práticas integrativas e espiritualidade.",
      },
    ],
    notes: [
      "O conteúdo legado não apresenta uma sequência dia a dia completa; a página nova preserva os destaques confirmados sem inventar etapas.",
    ],
    sourceUrl: "https://www.neosenses.com.br/machupicchu-xamanico/",
  },
  {
    slug: "caminho-de-maria-madalena",
    title: "O Caminho de Maria Madalena",
    kicker: "Peregrinação · Sul da França",
    subtitle: "Uma jornada entre o sagrado, a natureza e a transformação interior",
    destination: "Provença e Sul da França",
    country: "França",
    period: "Próximas saídas sob consulta",
    summary:
      "Uma peregrinação por Saintes-Maries-de-la-Mer, Camargue, Marselha, Sainte-Baume e Saint-Maximin, seguindo lugares associados à tradição de Maria Madalena.",
    description:
      "O Caminho de Maria Madalena percorre paisagens da Provença em uma jornada que aproxima território e experiência interior. Das planícies da Camargue às trilhas de Sainte-Baume, cada etapa é apresentada como um convite ao autoconhecimento, à abertura do coração e à busca de sentido.\n\nA proposta conecta peregrinação, natureza, história e espiritualidade, sem separar o caminho físico do processo subjetivo de quem viaja.",
    why:
      "A narrativa da jornada parte da ideia de que os lugares percorridos podem funcionar como marcos de uma travessia interior: presença, verdade, amor e integração entre espiritualidade e cotidiano.",
    value:
      "Oito etapas pelo sul da França combinando vilas históricas, paisagens da Camargue, Mediterrâneo, trilhas, santuários e espaços de contemplação.",
    forWhom:
      "Para quem se identifica com peregrinações, espiritualidade cristã ou simbólica, sagrado feminino, história e jornadas que combinam caminhada, cultura e reflexão interior.",
    hero: "/images/destinations/france.png",
    photos: ["/images/destinations/france.png"],
    highlights: [
      {
        title: "Saintes-Maries-de-la-Mer",
        description: "Início da travessia na Camargue, entre tradição, Mediterrâneo e paisagens abertas.",
      },
      {
        title: "Camargue",
        description: "Pântanos, cavalos brancos, touros e flamingos compõem uma das paisagens mais características do percurso.",
      },
      {
        title: "Sainte-Baume",
        description: "O coração contemplativo da peregrinação, com caminhada pela floresta e visita à gruta associada a Maria Madalena.",
      },
      {
        title: "Saint-Maximin",
        description: "Visita à basílica dedicada a Maria Madalena e tempo de integração na região de Provence Verte.",
      },
    ],
    itinerary: [
      {
        day: 1,
        title: "Chegada a Saintes-Maries-de-la-Mer",
        location: "Marselha · Camargue",
        description:
          "Chegada pelo aeroporto de Marselha e transfer pela paisagem da Camargue até Saintes-Maries-de-la-Mer, abrindo a jornada junto ao Mediterrâneo.",
      },
      {
        day: 2,
        title: "Igreja e paisagens da Camargue",
        location: "Saintes-Maries-de-la-Mer",
        description:
          "Exploração da vila e da igreja local, seguida de experiência pelos pântanos e campos da Camargue, território de cavalos brancos, touros e flamingos.",
      },
      {
        day: 3,
        title: "Aigues-Mortes e chegada a Sainte-Baume",
        location: "Aigues-Mortes · Sainte-Baume",
        description:
          "Visita à cidade medieval, suas muralhas e salinas, antes de seguir para a região de Sainte-Baume.",
      },
      {
        day: 4,
        title: "Marselha e os Calanques",
        location: "Marselha",
        description:
          "Passeio pelos Calanques, Porto Velho e Basílica de Notre-Dame de la Garde antes do retorno a Sainte-Baume.",
      },
      {
        day: 5,
        title: "A Gruta de Maria Madalena",
        location: "La Sainte-Baume",
        description:
          "Caminhada por floresta antiga até a gruta, em uma etapa dedicada à contemplação e à experiência de peregrinação.",
      },
      {
        day: 6,
        title: "Capela de Saint-Pilon",
        location: "La Sainte-Baume",
        description:
          "Subida até a capela em uma jornada que combina esforço físico, silêncio e vistas amplas sobre a Provença.",
      },
      {
        day: 7,
        title: "Basílica de Saint-Maximin",
        location: "Saint-Maximin-la-Sainte-Baume",
        description:
          "Visita à basílica dedicada a Maria Madalena e período livre para integração e contemplação na região.",
      },
      {
        day: 8,
        title: "Despedida e retorno",
        location: "Marselha",
        description: "Check-out e transfer para o aeroporto de Marselha, encerrando a peregrinação.",
      },
    ],
    facilitators: [
      {
        name: "Letícia Bhakti",
        role: "Facilitadora",
        bio: "Terapeuta, escritora e facilitadora de retiros e cursos, dedicada a trabalhos de transformação, cura e reconexão com o eu interior.",
      },
    ],
    notes: [
      "A página anterior mostrava uma saída de maio de 2026, já encerrada. Datas futuras serão informadas pela equipe.",
    ],
    sourceUrl: "https://www.neosenses.com.br/roteiros/maria-madalena/",
  },
  {
    slug: "india-milenar",
    title: "Uma Peregrinação pela Índia",
    kicker: "Jornada espiritual · Índia",
    subtitle: "Índia Milenar",
    destination: "Índia",
    country: "Índia",
    period: "Próximas saídas sob consulta",
    summary:
      "Uma viagem preparada para transformar a vida por meio de meditação, hinduísmo, budismo tibetano e psicologia transpessoal.",
    description:
      "A proposta da Índia Milenar é uma peregrinação de transformação e estudo interior. O conteúdo legado da NeoSenses apresenta a jornada a partir de quatro eixos: meditação, hinduísmo, budismo tibetano e psicologia transpessoal.\n\nA página nova preserva apenas o conteúdo que conseguimos confirmar no material público atual da NeoSenses. O detalhamento operacional e o roteiro dia a dia deverão ser validados antes de uma nova saída ser anunciada.",
    why:
      "A Índia ocupa um lugar singular na história de diversas tradições espirituais e filosóficas. A proposta da NeoSenses é aproximar o viajante desse universo não apenas como observador, mas como participante de uma jornada de transformação pessoal.",
    value:
      "Uma peregrinação orientada por práticas e referências espirituais, criada para quem deseja atravessar a Índia com intenção, contexto e espaço para integração interior.",
    forWhom:
      "Para quem busca uma viagem espiritual, tem interesse por meditação, tradições indianas, budismo tibetano e psicologia transpessoal, e valoriza experiências conduzidas em grupo.",
    hero: "/images/destinations/india.png",
    photos: ["/images/destinations/india.png"],
    highlights: [
      {
        title: "Meditação",
        description: "Práticas contemplativas aparecem como um dos pilares centrais da proposta da jornada.",
      },
      {
        title: "Hinduísmo",
        description: "Contato com referências, símbolos e contextos de uma das tradições fundamentais da Índia.",
      },
      {
        title: "Budismo Tibetano",
        description: "A jornada incorpora referências ao budismo tibetano dentro de seu eixo de estudo e espiritualidade.",
      },
      {
        title: "Psicologia Transpessoal",
        description: "O percurso é apresentado também como uma experiência de transformação e ampliação de consciência.",
      },
    ],
    itinerary: [],
    facilitators: [],
    notes: [
      "O endereço legado da Índia não respondeu durante a migração. O novo conteúdo foi limitado ao resumo que ainda está publicado na página principal da NeoSenses; nenhuma etapa, data ou preço foi inventado.",
    ],
    sourceUrl: "https://www.neosenses.com.br/pacotes-de-viagens/india-milenar/",
  },
];

export const migratedExperienceBySlug = Object.fromEntries(
  migratedExperiences.map((experience) => [experience.slug, experience])
) as Record<string, MigratedExperience>;
