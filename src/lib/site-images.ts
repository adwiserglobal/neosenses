export type SiteImageDefinition = {
  key: string;
  label: string;
  section: string;
  description: string;
  fallback: string;
  aspectRatio: number;
  alt: string;
};

/**
 * Imagens estruturais do site que podem ser substituídas pelo painel.
 *
 * Capas de experiências, destinos e artigos continuam sendo editadas nas
 * respectivas telas, onde seus registros já possuem o NeoSenses Studio.
 */
export const SITE_IMAGE_REGISTRY: SiteImageDefinition[] = [
  { key: "home.hero.1", label: "Capa principal", section: "Home", description: "Primeira imagem do carrossel de abertura", fallback: "/images/hero/homepage.png", aspectRatio: 16 / 9, alt: "Imagem de abertura da NeoSenses" },
  { key: "home.hero.2", label: "Carrossel · Marrocos", section: "Home", description: "Imagem do carrossel de abertura", fallback: "/images/hero/marrocos-deserto.jpg", aspectRatio: 16 / 9, alt: "Paisagem do deserto do Marrocos" },
  { key: "home.hero.3", label: "Carrossel · Amazônia", section: "Home", description: "Imagem do carrossel de abertura", fallback: "/images/hero/amazonia-por-do-sol.jpg", aspectRatio: 16 / 9, alt: "Pôr do sol na Amazônia" },
  { key: "home.hero.4", label: "Carrossel · Camelo", section: "Home", description: "Imagem do carrossel de abertura", fallback: "/images/hero/camelo-por-do-sol.jpg", aspectRatio: 16 / 9, alt: "Camelo ao pôr do sol" },
  { key: "home.hero.5", label: "Carrossel · Marrocos à noite", section: "Home", description: "Imagem do carrossel de abertura", fallback: "/images/hero/marrocos-noite.jpg", aspectRatio: 16 / 9, alt: "Paisagem noturna no Marrocos" },
  { key: "home.hero.6", label: "Carrossel · Aurora boreal", section: "Home", description: "Imagem do carrossel de abertura", fallback: "/images/hero/aurora-boreal.jpg", aspectRatio: 16 / 9, alt: "Aurora boreal no céu" },
  { key: "home.purpose", label: "Nosso Propósito", section: "Home", description: "Fotografia orgânica ao lado do texto institucional", fallback: "https://images.squarespace-cdn.com/content/v1/5ec07f18ab653106f98ea674/1589679989698-84YPF8B5T8FV90TSH01M/william-farlow-IevaZPwq0mw-unsplash.jpg?format=2500w", aspectRatio: 4 / 4.2, alt: "Imagem da seção Nosso Propósito" },
  { key: "home.pillar.jornadas", label: "Pilar · Jornadas de Alma", section: "Home", description: "Primeiro card da seção O que nos move", fallback: "/images/home/circulo-de-vivencia.webp", aspectRatio: 6 / 5, alt: "Grupo reunido em uma vivência" },
  { key: "home.pillar.autoconhecimento", label: "Pilar · Autoconhecimento", section: "Home", description: "Segundo card da seção O que nos move", fallback: "/images/b2b/peru-xama.jpg", aspectRatio: 6 / 5, alt: "Vivência espiritual conduzida por um facilitador no Peru" },
  { key: "home.pillar.roteiros", label: "Pilar · Roteiros e Vivências", section: "Home", description: "Terceiro card da seção O que nos move", fallback: "/images/b2b/peru-machu-picchu.jpg", aspectRatio: 6 / 5, alt: "Machu Picchu, no Peru" },
  { key: "home.pillar.conexao", label: "Pilar · Conexão", section: "Home", description: "Quarto card da seção O que nos move", fallback: "/images/home/conexao-marrocos.webp", aspectRatio: 6 / 5, alt: "Encontro entre viajantes e moradores locais no Marrocos" },
  { key: "home.thematic.maria", label: "Faixa · Caminho de Maria Madalena", section: "Home", description: "Imagem da jornada temática", fallback: "/images/tematicos/maria-madalena-rosas-faixa.webp", aspectRatio: 16 / 9, alt: "Imagem temática do Caminho de Maria Madalena" },
  { key: "home.thematic.tailandia", label: "Faixa · Tailândia", section: "Home", description: "Imagem da jornada temática", fallback: "/images/tematicos/tailandia-buda-faixa.webp", aspectRatio: 16 / 9, alt: "Imagem temática da Tailândia" },
  { key: "home.thematic.egito", label: "Faixa · Egito", section: "Home", description: "Imagem da jornada temática", fallback: "/images/tematicos/egito-piramides-cairo.jpg", aspectRatio: 16 / 9, alt: "Pirâmides do Egito" },
  { key: "home.jornadas.background", label: "Fundo · Nossas Jornadas", section: "Home", description: "Fundo da vitrine de experiências em destaque", fallback: "/images/home/jornadas-deserto.jpg", aspectRatio: 16 / 9, alt: "Paisagem de deserto ao fundo das jornadas" },
  { key: "home.cta.background", label: "Fundo · Chamada final", section: "Home", description: "Imagem de fundo do convite final para contato", fallback: "/images/hero/amazonia-por-do-sol.jpg", aspectRatio: 16 / 9, alt: "Pôr do sol na Amazônia" },

  { key: "about.hero", label: "Capa · Sobre Nós", section: "Sobre Nós", description: "Imagem principal do topo da página", fallback: "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/1bf305dfd09276a3f8b502d7546301a49e4f4d8f51d701ab14acbf2da4c23260.png", aspectRatio: 16 / 9, alt: "Imagem de abertura da página Sobre Nós" },
  { key: "about.story", label: "Imagem · Nossa história", section: "Sobre Nós", description: "Fotografia ao lado do texto institucional", fallback: "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/2ac7788ab8babc735a2a31ff8a954ff0b9d12a170490f4c825856126e1d0e813.png", aspectRatio: 4 / 5, alt: "Pessoas em meditação diante de uma imagem de Buda" },
  { key: "about.closing", label: "Fundo · Encerramento", section: "Sobre Nós", description: "Imagem de fundo da chamada final da página", fallback: "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/6543fe3a334967c84fc11915fc0322e192623354f71776841959cd7d293c3745.png", aspectRatio: 16 / 9, alt: "Imagem de encerramento da página Sobre Nós" },

  { key: "facilitators.hero", label: "Capa · Para Facilitadores", section: "Para Facilitadores", description: "Imagem principal do topo da página", fallback: "https://cdn.openart.ai/openart-uploads/production/attachment-transfers/24a92239a3b08a656a404aa6816c8597ba6288bd83620f3bc145c38d34c5aee6.png", aspectRatio: 16 / 9, alt: "Imagem de abertura para facilitadores" },
  { key: "facilitators.gallery.1", label: "Galeria · Titicaca", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/peru-titicaca.jpg", aspectRatio: 4 / 3, alt: "Paisagem andina do Peru" },
  { key: "facilitators.gallery.2", label: "Galeria · Marrocos", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/marrocos-entrega.jpg", aspectRatio: 4 / 3, alt: "Vivência no Marrocos" },
  { key: "facilitators.gallery.3", label: "Galeria · Amazônia aérea", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/amazonas-floresta-aerea.jpg", aspectRatio: 4 / 3, alt: "Floresta amazônica vista do alto" },
  { key: "facilitators.gallery.4", label: "Galeria · Cultura berbere", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/marrocos-farmacia-berbere.jpg", aspectRatio: 4 / 3, alt: "Cultura local no Marrocos" },
  { key: "facilitators.gallery.5", label: "Galeria · Lagoa sagrada", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/peru-lagoa-sagrada.jpg", aspectRatio: 4 / 3, alt: "Lagoa em meio às montanhas do Peru" },
  { key: "facilitators.gallery.6", label: "Galeria · Rio Amazônico", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/amazonas-flutuante.jpg", aspectRatio: 4 / 3, alt: "Comunidade ribeirinha na Amazônia" },
  { key: "facilitators.gallery.7", label: "Galeria · Rabat", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/marrocos-rabat.jpg", aspectRatio: 4 / 3, alt: "Arquitetura e paisagem urbana do Marrocos" },
  { key: "facilitators.gallery.8", label: "Galeria · Rio e floresta", section: "Para Facilitadores", description: "Faixa de fotos da página", fallback: "/images/b2b/amazonas-hero-principal.jpg", aspectRatio: 4 / 3, alt: "Paisagem do rio e da floresta amazônica" },
  { key: "facilitators.closing", label: "Fundo · Convite final", section: "Para Facilitadores", description: "Imagem de fundo do convite final da página", fallback: "/images/b2b/marrocos-final.jpg", aspectRatio: 16 / 9, alt: "Paisagem do Marrocos no convite final" },
  { key: "facilitators.feature.peru", label: "Destaque · Machu Picchu", section: "Para Facilitadores", description: "Imagem grande na seção de territórios", fallback: "/images/b2b/peru-machu-picchu.jpg", aspectRatio: 16 / 10, alt: "Machu Picchu, no Peru" },
  { key: "facilitators.feature.marrocos", label: "Destaque · Marrocos", section: "Para Facilitadores", description: "Imagem na seção de territórios", fallback: "/images/b2b/marrocos-deserto.jpg", aspectRatio: 16 / 9, alt: "Deserto do Marrocos" },
  { key: "facilitators.feature.amazonas", label: "Destaque · Amazônia", section: "Para Facilitadores", description: "Imagem na seção de territórios", fallback: "/images/b2b/amazonas-hero-lago.jpg", aspectRatio: 16 / 9, alt: "Paisagem amazônica" },
  { key: "facilitators.destination.marrocos", label: "Destino · Marrocos", section: "Para Facilitadores", description: "Card de roteiro para grupos", fallback: "/images/b2b/marrocos-entrega.jpg", aspectRatio: 4 / 5, alt: "Marrocos" },
  { key: "facilitators.destination.peru", label: "Destino · Peru", section: "Para Facilitadores", description: "Card de roteiro para grupos", fallback: "/images/b2b/peru-titicaca.jpg", aspectRatio: 4 / 5, alt: "Peru" },
  { key: "facilitators.destination.amazonas", label: "Destino · Amazônia", section: "Para Facilitadores", description: "Card de roteiro para grupos", fallback: "/images/b2b/amazonas-floresta-aerea.jpg", aspectRatio: 4 / 5, alt: "Amazônia" },
  { key: "facilitators.destination.egito", label: "Destino · Egito", section: "Para Facilitadores", description: "Card de roteiro para grupos", fallback: "/images/destinations/egito.jpg", aspectRatio: 4 / 5, alt: "Egito" },
];
