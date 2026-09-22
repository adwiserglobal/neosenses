/**
 * Cria as jornadas do funil de facilitador a partir dos modelos da equipe.
 *
 * O conteúdo é o dos três modelos publicados na Netlify — peru-sagrado,
 * marrocos e rio-amazonas —, transcrito, não reescrito. O que a equipe
 * escreveu é o que vai ao ar; o script só converte para o schema.
 *
 * ── O que NÃO entra, e por quê ────────────────────────────────────────────
 *
 * PREÇO E DATA. Nenhum dos três modelos tem, e é a razão de existirem: o
 * roteiro nasce da conversa com a facilitadora. Inventar "a partir de" aqui
 * seria inventar a oferta.
 *
 * O XAMÃ como facilitador cadastrado. O texto sobre Antarke Huaminca entra
 * no corpo da página do Peru, onde a equipe o colocou. Criar uma linha em
 * `facilitators` faria a foto e a bio dele aparecerem em qualquer página que
 * liste condutores, inclusive as B2C — que é uma afirmação que ninguém fez.
 *
 * OS VÍDEOS do modelo da Amazônia. Estão embutidos no HTML e o schema não
 * tem onde guardar vídeo de galeria. Ficam registrados como débito.
 *
 * ── Publicado, não rascunho ───────────────────────────────────────────────
 *
 * Diferente de `migrar-experiencias.mjs`, que nasce em draft: aquele era
 * conteúdo raspado por robô de um site com preço vencido. Este é material
 * que a equipe escreveu, revisou e já publicou por conta própria.
 *
 * Idempotente: casa por slug e atualiza. Os blocos filhos (destaques,
 * territórios, parceria, perguntas) são substituídos por inteiro a cada
 * execução — é o que mantém a segunda passagem igual à primeira em vez de
 * duplicar tudo.
 *
 * Uso:
 *   node scripts/cadastrar-b2b.mjs --local    banco de desenvolvimento
 *   node scripts/cadastrar-b2b.mjs            projeto da nuvem (.env.local)
 *   node scripts/cadastrar-b2b.mjs --dry      só mostra o que faria
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIMULAR = process.argv.includes("--dry");
const LOCAL = process.argv.includes("--local");

function lerEnv(arquivo) {
  const env = {};
  try {
    for (const l of readFileSync(join(RAIZ, arquivo), "utf8").split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* arquivo ausente é caso normal: nem toda máquina tem os dois */
  }
  return env;
}

const env = LOCAL ? lerEnv(".env.development.local") : lerEnv(".env.local");
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const S = env.SUPABASE_SERVICE_ROLE_KEY;

if (!U || !S) {
  console.error(
    `Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em ${
      LOCAL ? ".env.development.local" : ".env.local"
    }.`
  );
  process.exit(1);
}

const cab = { apikey: S, Authorization: `Bearer ${S}`, "Content-Type": "application/json" };

async function req(caminho, opcoes = {}) {
  const r = await fetch(`${U}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: { ...cab, ...(opcoes.headers ?? {}), Prefer: opcoes.prefer ?? "return=representation" },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${opcoes.method ?? "GET"} ${caminho} → ${r.status} ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

const pt = (texto) => ({ pt: texto });

// ──────────────────────────────────────────────────────────────────────────
// O conteúdo, como a equipe escreveu
// ──────────────────────────────────────────────────────────────────────────
const IMG = "/images/b2b";

const JORNADAS = [
  {
    slug: "retiro-no-peru-sagrado-para-facilitadoras",
    template: "territorio",
    destino: "vale-sagrado",
    titulo: "Crie seu retiro espiritual no Peru com a NeoSenses",
    chapeu: "Parceria para terapeutas e facilitadoras · Peru",
    resumo:
      "Uma jornada personalizada para terapeutas, facilitadoras e líderes de grupos que desejam conduzir uma experiência profunda de autoconhecimento, cura e conexão com a sabedoria ancestral peruana, com o apoio da NeoSenses e a condução xamânica de Antarke Huaminca.",
    capa: `${IMG}/peru-lagoa-sagrada.jpg`,
    descricao: `Existe uma forma de levar seu trabalho terapêutico para outro nível: conduzir seu próprio grupo em uma jornada espiritual pelo Peru Sagrado.

A NeoSenses cria roteiros personalizados para terapeutas que desejam realizar retiros, imersões e vivências internacionais em lugares de força como Cusco, Vale Sagrado, Machu Picchu, Lagoa Humantay, Montanhas Coloridas e Lago Titicaca.

Você entra com sua medicina, sua condução e seu grupo. A NeoSenses oferece a curadoria da experiência, a organização do roteiro, a conexão com o Xamã Antarke Huaminca e o suporte necessário para transformar essa viagem em uma vivência profunda, segura e inesquecível.

As vivências desta imersão são conduzidas pelo Xamã Antarke Huaminca, referência em sabedoria ancestral peruana e prática espiritual, com o objetivo de apoiar a conexão com o mundo espiritual, trazer insights pessoais e abrir caminhos de cura interior para o seu grupo.

Batizado espiritualmente como Antarke Huaminca, o Xamã peruano foi escolhido aos nove anos para ser desenvolvido como guia espiritual. Desde então, segue sua jornada compartilhando ensinamentos, conduzindo vivências e rituais sagrados. Antarke já conduziu inúmeros grupos ao Peru e estará com o grupo durante toda a jornada — e, na parceria com a NeoSenses, apoia terapeutas e facilitadoras na condução espiritual de seus próprios grupos.

A imersão xamânica não é uma prática religiosa, mas uma abordagem espiritual que busca ampliar a consciência e aprofundar a conexão com o divino. Não são utilizadas quaisquer substâncias que possam gerar alterações de estado de consciência.`,
    paraQuem: `Esta página foi criada para terapeutas que sentem o chamado de realizar um retiro no Peru, mas desejam contar com uma parceira experiente para estruturar cada detalhe da jornada.

Para quem já conduz grupos e quer levar o próprio trabalho a um território de força.
Para quem deseja unir viagem e desenvolvimento humano.
Para quem quer profundidade espiritual com segurança e estrutura.
Para quem prefere não construir tudo sozinha.

Cada experiência é única e será vivenciada de acordo com a permissão da alma de cada participante do seu grupo.`,
    fechamento: {
      titulo: "Sinta o chamado do Peru Sagrado",
      texto:
        "Roteiros personalizados para terapeutas e facilitadoras que desejam realizar retiros espirituais no Peru. Você traz o seu grupo e a sua medicina. A NeoSenses cuida da experiência, do roteiro e da conexão com o Peru Sagrado.",
    },
    parceria: {
      facilitador: [
        "Sua medicina, sua abordagem terapêutica e seu método de trabalho.",
        "Seu grupo — os participantes que confiam na sua condução.",
        "A intenção e o propósito que deseja oferecer nesse retiro.",
      ],
      neosenses: [
        "A curadoria da experiência e a construção do roteiro em lugares de força do Peru.",
        "A conexão com o Xamã Antarke Huaminca e as cerimônias ancestrais.",
        "A logística local, a estrutura e o suporte durante toda a jornada.",
        "A segurança e a profundidade necessárias para transformar a viagem em uma vivência inesquecível para o seu grupo.",
      ],
    },
    territorios: [
      {
        titulo: "Cusco",
        descricao:
          "A antiga capital do Império Inca é o ponto de entrada para a energia ancestral dos Andes. Suas ruas, templos e montanhas convidam o participante a desacelerar, abrir o coração e se preparar para uma jornada de reconexão.",
      },
      {
        titulo: "Vale Sagrado",
        descricao:
          "Um território de profunda conexão com a Terra, os ancestrais e os elementos da natureza. O Vale Sagrado é um convite à presença, à reverência e à escuta interior.",
        imagem: `${IMG}/peru-vale-sagrado.jpg`,
      },
      {
        titulo: "Machu Picchu",
        descricao:
          "Um dos grandes símbolos espirituais do Peru. Entre montanhas e construções ancestrais, Machu Picchu convida à contemplação, à presença e ao reconhecimento da força sagrada que habita este território.",
        imagem: `${IMG}/peru-machu-picchu.jpg`,
      },
      {
        titulo: "Lagoa Humantay",
        descricao:
          "Um espaço de purificação, silêncio e renovação. Suas águas e montanhas convidam cada participante a soltar antigos padrões e abrir espaço para uma nova energia.",
        imagem: `${IMG}/peru-humantay.jpg`,
      },
      {
        titulo: "Montanhas Coloridas",
        descricao:
          "Um lugar de beleza, força e superação. As Montanhas Coloridas representam a coragem de atravessar limites internos e reconhecer a grandeza da própria jornada.",
        imagem: `${IMG}/peru-montanhas-coloridas.jpg`,
      },
      {
        titulo: "Lago Titicaca",
        descricao:
          "Um lago sagrado associado à origem, ancestralidade e reconexão profunda. Um espaço para honrar a vida, o silêncio, a sabedoria das águas e o feminino sagrado.",
        imagem: `${IMG}/peru-titicaca.jpg`,
      },
    ],
    grades: [
      {
        chave: "vivencias",
        titulo: "Experiências que podem compor o roteiro do seu retiro",
        itens: [
          {
            titulo: "Vivência do Renascimento",
            descricao:
              "Uma experiência simbólica de renovação, soltura e abertura para uma nova fase — um convite para deixar para trás padrões antigos, crenças limitantes e pesos emocionais que já não servem mais.",
            simbolo: "✦",
          },
          {
            titulo: "Vivência do Voo do Condor",
            descricao:
              "O condor é um símbolo sagrado dos Andes, associado à visão elevada, liberdade e conexão espiritual. Uma vivência que convida a olhar a própria vida de um lugar mais alto.",
            simbolo: "☾",
          },
          {
            titulo: "Conexão com Gaia",
            descricao:
              "Uma prática para sentir o pulsar da Terra, conectar o coração humano ao coração da Mãe Planetária e reconhecer a natureza como fonte de cura, equilíbrio e sabedoria.",
            simbolo: "❋",
          },
          {
            titulo: "Rituais Ancestrais",
            descricao:
              "Cerimônias conduzidas pelo Xamã Antarke Huaminca, respeitando os saberes tradicionais peruanos e criando um campo de reverência, presença e espiritualidade.",
            simbolo: "✺",
          },
        ],
      },
      {
        chave: "sementes",
        titulo: "O que este retiro pode despertar no seu grupo",
        itens: [
          { titulo: "Ativações e limpezas energéticas", simbolo: "✧" },
          { titulo: "Alinhamentos e desbloqueios", simbolo: "☼" },
          { titulo: "Acesso a propósitos", simbolo: "✦" },
          { titulo: "Integração entre Terra e Céu junto ao coração", simbolo: "❋" },
        ],
      },
    ],
    perguntas: [
      {
        q: "Esta página é para viajantes individuais?",
        a: "Não. Ela é voltada para terapeutas, facilitadoras e líderes de grupos que desejam criar um retiro no Peru em parceria com a NeoSenses.",
      },
      {
        q: "Preciso já ter um grupo formado?",
        a: "Não necessariamente. Você pode conversar com a equipe para entender formatos e possibilidades.",
      },
      {
        q: "Posso conduzir minhas próprias práticas?",
        a: "Sim. A proposta é justamente integrar o território e a condução xamânica à forma como cada terapeuta conduz seu trabalho.",
      },
      {
        q: "As vivências envolvem alguma substância?",
        a: "Não. Não são utilizadas quaisquer substâncias que possam gerar alterações de estado de consciência.",
      },
      {
        q: "O roteiro é fechado?",
        a: "Não. Ele é construído com você, a partir do propósito do seu grupo e dos lugares de força que fizerem sentido para a jornada.",
      },
    ],
    fotos: [`${IMG}/peru-cerimonia.jpg`, `${IMG}/peru-xama.jpg`, `${IMG}/peru-machu-picchu.jpg`],
  },

  {
    slug: "jornada-no-marrocos-para-facilitadoras",
    template: "territorio",
    destino: "vale-das-rosas",
    titulo: "Leve seu grupo para uma jornada inesquecível no Marrocos",
    chapeu: "NeoSenses · Jornadas para grupos",
    resumo:
      "Um destino que toca os sentidos e amplia a experiência do grupo: do Atlântico ao Saara, das cidades imperiais aos vales e kasbahs, com curadoria, profundidade e espaço para a sua condução.",
    capa: `${IMG}/marrocos-abertura.jpg`,
    descricao: `O Marrocos é um convite ao encantamento. Um destino que desperta os sentidos, atravessa culturas e envolve cada viajante em uma atmosfera de cor, textura, sabor, tradição e beleza.

Para terapeutas e facilitadoras, ele se torna um cenário poderoso para criar jornadas de reconexão, expansão, feminilidade, autoconhecimento, espiritualidade, presença e transformação.

A NeoSenses oferece essa possibilidade para quem deseja levar seus grupos para além do turismo comum, com curadoria, profundidade e uma experiência cuidadosamente desenhada.

Cada terapeuta conduz de um jeito único. Por isso a proposta não é entregar algo engessado, mas criar uma experiência que dialogue com a essência da facilitadora e o tipo de jornada que ela deseja proporcionar. O roteiro pode abrir espaço para rodas de partilha, práticas de presença, meditações, vivências femininas, rituais simbólicos, pausas de integração e momentos de contemplação.

O Marrocos oferece o cenário. A terapeuta oferece a condução. A NeoSenses cria a ponte.`,
    paraQuem: `Essa proposta é para terapeutas, facilitadoras e líderes de grupos que desejam oferecer experiências mais profundas, belas e transformadoras.

Para quem quer criar um retiro internacional com propósito.
Para quem deseja unir viagem e desenvolvimento humano.
Para quem busca um destino feminino, acolhedor e encantador.
Para quem quer levar seu grupo com o apoio de uma curadoria especializada.
Para quem sente que o destino também faz parte da transformação.
Para quem quer oferecer uma experiência diferente, estética e inesquecível.`,
    fechamento: {
      titulo: "O Marrocos pode ser o próximo território da sua jornada",
      texto:
        "Imagine conduzir seu grupo em um destino onde cada detalhe convida ao encantamento: as cores, os aromas, os rituais, o deserto, os encontros, os sabores e a beleza viva de uma cultura que toca a alma. Você traz o seu grupo e a sua medicina. A NeoSenses cria o caminho.",
    },
    parceria: {
      facilitador: [
        "Sua medicina e a forma como você conduz o seu trabalho.",
        "Seu grupo e o propósito que deseja oferecer a ele.",
        "As práticas que quiser integrar ao roteiro.",
      ],
      neosenses: [
        "Curadoria do roteiro e estrutura da experiência.",
        "Organização da jornada e apoio logístico.",
        "Escolha de hospedagens com charme e identidade.",
        "Conexão com experiências culturais autênticas.",
        "Integração entre turismo, sensorialidade e propósito.",
        "Espaço para a terapeuta conduzir suas próprias práticas.",
      ],
    },
    territorios: [
      {
        titulo: "Casablanca",
        descricao:
          "O ponto de chegada, onde a energia do Marrocos começa a se revelar entre arquitetura, mar e elegância.",
        imagem: `${IMG}/marrocos-casablanca.jpg`,
      },
      {
        titulo: "Rabat e Meknès",
        descricao:
          "Cidades que conectam história, charme e sofisticação, com paisagens e tradições que introduzem o grupo ao espírito do país.",
        imagem: `${IMG}/marrocos-rabat.jpg`,
      },
      {
        titulo: "Fès",
        descricao:
          "Uma imersão em uma das medinas mais fascinantes do mundo, com arquitetura, artesanato, tecelagem, cerâmica e a atmosfera vibrante da herança marroquina.",
        imagem: `${IMG}/marrocos-fes.jpg`,
      },
      {
        titulo: "Travessia para o Saara",
        descricao:
          "Estradas cênicas, montanhas, vales, florestas e o sentimento de atravessar o país em direção a uma experiência grandiosa — por Ifrane, a Floresta de Cedros, o Vale do Ziz e Erfoud.",
        imagem: `${IMG}/marrocos-travessia.jpg`,
      },
      {
        titulo: "Merzouga e o Deserto",
        descricao:
          "O encontro com o silêncio, o dourado das dunas, o pôr do sol no deserto, o passeio de dromedário e a magia de dormir sob um céu estrelado.",
        imagem: `${IMG}/marrocos-deserto.jpg`,
      },
      {
        titulo: "Todra, Dadès e Ouarzazate",
        descricao:
          "Paisagens cinematográficas, gargantas rochosas, vales e kasbahs que tornam o trajeto tão marcante quanto o destino.",
        imagem: `${IMG}/marrocos-todra.jpg`,
      },
      {
        titulo: "Ait Ben Haddou",
        descricao:
          "Um dos cenários mais icônicos do Marrocos, com força estética, história e beleza singular.",
        imagem: `${IMG}/marrocos-ait-ben-haddou.jpg`,
      },
      {
        titulo: "Marrakech",
        descricao:
          "A cidade das cores, dos souks, da arte, da hospitalidade, da gastronomia e das experiências sensoriais que ficam na memória — do Palácio Bahia à Mesquita Koutoubia e ao Mellah.",
        imagem: `${IMG}/marrocos-marrakech.jpg`,
      },
    ],
    grades: [
      {
        chave: "motivos",
        titulo: "Por que escolher o Marrocos",
        itens: [
          {
            titulo: "Cultura viva",
            descricao: "Tradições milenares que pulsam nas ruas, nas mãos artesãs e nos encontros.",
            simbolo: "✦",
          },
          {
            titulo: "Beleza e sensorialidade",
            descricao: "Cores, aromas, texturas e sabores que envolvem o grupo do primeiro ao último dia.",
            simbolo: "❋",
          },
          {
            titulo: "Força feminina",
            descricao: "Cooperativas, saberes ancestrais e a presença viva das mulheres marroquinas.",
            simbolo: "☾",
          },
          {
            titulo: "Paisagens icônicas",
            descricao: "Do azul do Atlântico às montanhas do Atlas e ao dourado infinito do Saara.",
            simbolo: "⛰",
          },
          {
            titulo: "Deserto e silêncio",
            descricao: "A potência emocional das dunas: espaço raro de contemplação e presença.",
            simbolo: "☼",
          },
          {
            titulo: "Artesanato ancestral",
            descricao: "Tapetes, cerâmicas, tecidos e ofícios passados de geração em geração.",
            simbolo: "✺",
          },
          {
            titulo: "Gastronomia e rituais",
            descricao: "Chá de menta, especiarias, tagines e mesas que celebram o encontro.",
            simbolo: "☕",
          },
          {
            titulo: "Experiências memoráveis",
            descricao: "Vivências que ficam na memória do grupo — e no corpo, muito depois da viagem.",
            simbolo: "✧",
          },
        ],
      },
      {
        chave: "vivencias",
        titulo: "Vivências que tornam o roteiro inesquecível",
        itens: [
          {
            titulo: "Passeio de dromedário ao pôr do sol",
            descricao:
              "A caravana avança devagar enquanto as dunas se acendem em dourado — um dos momentos mais emocionantes da jornada.",
          },
          {
            titulo: "Dormir em acampamento no deserto",
            descricao:
              "Tendas acolhedoras, fogueira, estrelas em abundância e o silêncio raro do Saara embalando a noite do grupo.",
          },
          {
            titulo: "Música Gnaoua em Khamlia",
            descricao:
              "Ritmos ancestrais que atravessam o corpo — um encontro musical e espiritual com uma comunidade acolhedora.",
          },
          {
            titulo: "Chá de menta tradicional",
            descricao:
              "Servido do alto, doce e perfumado: o gesto de hospitalidade que se repete como um pequeno ritual em cada parada.",
          },
          {
            titulo: "Aula de culinária marroquina",
            descricao:
              "Especiarias, técnicas e segredos de família — e, ao final, a alegria de partilhar à mesa o que o grupo criou junto.",
          },
          {
            titulo: "Henna e kaftans em riad tradicional",
            descricao:
              "Uma tarde de beleza e celebração feminina: arte na pele, tecidos que vestem histórias, doces típicos e fotografias para sempre.",
          },
          {
            titulo: "Souks e medinas",
            descricao:
              "Um labirinto de aromas, cores, lanternas e artesanato — caminhar aqui é uma experiência sensorial por si só.",
          },
          {
            titulo: "Cooperativa de tapetes berberes",
            descricao:
              "Mulheres que tecem símbolos e memórias em lã — cada tapete conta uma história de território e feminilidade.",
          },
          {
            titulo: "Cooperativa de óleo de argan",
            descricao:
              "O “ouro líquido” do Marrocos, extraído por mãos femininas — beleza, sustento e tradição em cada gota.",
          },
          {
            titulo: "Farmácia berbere tradicional",
            descricao:
              "Ervas, óleos e especiarias da medicina ancestral marroquina, apresentados em uma experiência aromática única.",
          },
          {
            titulo: "Gastronomia marroquina",
            descricao:
              "Tagines, cuscuz, pães quentes, doces de amêndoa — mesas generosas que transformam refeições em encontros.",
          },
          {
            titulo: "Arquitetura e riads encantadores",
            descricao:
              "Pátios com fontes, mosaicos, arcos e luz filtrada — hospedagens que são, elas mesmas, parte da experiência.",
          },
        ],
      },
    ],
    perguntas: [
      {
        q: "Essa página é para viajantes individuais?",
        a: "Não. Esta página é voltada para terapeutas, facilitadoras e líderes de grupos que desejam criar uma experiência no Marrocos em parceria com a NeoSenses.",
      },
      {
        q: "Preciso já ter um grupo formado?",
        a: "Não necessariamente. Você pode conversar com a equipe para entender formatos e possibilidades.",
      },
      {
        q: "A NeoSenses ajuda a estruturar a experiência?",
        a: "Sim. A NeoSenses apoia a construção do roteiro, a curadoria da jornada e a estrutura da experiência.",
      },
      {
        q: "Posso incluir minhas próprias práticas no roteiro?",
        a: "Sim. A proposta é justamente integrar o destino com a forma como cada terapeuta conduz seu trabalho.",
      },
      {
        q: "O roteiro é fechado?",
        a: "Não. Ele pode ser adaptado conforme o perfil da facilitadora e o objetivo da experiência.",
      },
    ],
    fotos: [`${IMG}/marrocos-entrega.jpg`, `${IMG}/marrocos-cta.jpg`, `${IMG}/marrocos-final.jpg`],
  },

  {
    slug: "imersao-na-amazonia-para-facilitadoras",
    template: "territorio",
    destino: null,
    titulo: "Leve seu grupo para uma imersão transformadora na Amazônia",
    chapeu: "Amazônia · Rio Negro",
    resumo:
      "Roteiros personalizados para terapeutas, facilitadoras e líderes de grupos que desejam conduzir retiros com propósito às margens do Rio Negro, em conexão com a natureza, a cultura ribeirinha e o turismo sustentável.",
    capa: `${IMG}/amazonas-hero-principal.jpg`,
    descricao: `Existe uma força que só a natureza viva consegue despertar.

Na Amazônia, o grupo é convidado a desacelerar, respirar com a floresta, navegar pelas águas do Rio Negro, conhecer a cultura ribeirinha e viver experiências que aproximam corpo, alma, comunidade e natureza.

A experiência acontece na região do Lago do Acajatuba, no município de Iranduba, próximo a Manaus, em uma área conectada à Reserva de Desenvolvimento Sustentável do Rio Negro. É uma região marcada pela presença de comunidades tradicionais ribeirinhas, casas flutuantes, deslocamentos de barco, pousadas de selva, águas escuras, floresta abundante e uma cultura local viva.

A jornada nasce conectada ao turismo sustentável e ao turismo de base comunitária. Isso significa que ela não é apenas sobre visitar um lugar bonito: é também sobre respeitar quem vive ali, apoiar a comunidade, valorizar a cultura local e construir uma forma mais consciente de viajar.

A Amazônia entra como cenário vivo. A terapeuta entra com sua condução. A NeoSenses cria a ponte.`,
    paraQuem: `Essa experiência é ideal para terapeutas, facilitadoras e líderes de grupos que desejam criar uma imersão com mais profundidade, beleza e significado.

Para quem deseja conduzir um retiro fora do comum.
Para quem sente que a natureza pode ser parte do processo terapêutico.
Para quem quer oferecer uma experiência memorável ao seu grupo.
Para quem busca um destino com cultura, presença e propósito.
Para quem deseja criar uma vivência em parceria com comunidades locais.
Para quem quer contar com a estrutura da NeoSenses para realizar esse projeto com mais segurança.`,
    fechamento: {
      titulo: "A Amazônia pode ser o próximo território da sua medicina",
      texto:
        "Imagine conduzir seu grupo em um lugar onde a floresta respira, o rio ensina, a comunidade acolhe e cada experiência convida à presença. A NeoSenses está pronta para ajudar você a transformar esse chamado em um retiro possível, organizado e cheio de significado.",
    },
    parceria: {
      facilitador: [
        "Sua medicina, sua condução e seu grupo.",
        "O propósito da imersão e o ritmo que ela pede.",
        "As práticas que quiser integrar ao roteiro.",
      ],
      neosenses: [
        "Curadoria do roteiro e organização da experiência.",
        "Conexão com parceiros locais e comunidades ribeirinhas.",
        "Hospedagens e pousadas de selva.",
        "Vivências culturais e comunitárias.",
        "Deslocamentos internos e experiências na natureza.",
        "Suporte para transformar a viagem em uma vivência com propósito.",
      ],
    },
    territorios: [],
    grades: [
      {
        chave: "motivos",
        titulo: "A Amazônia como campo de reconexão",
        itens: [
          { titulo: "Natureza viva", simbolo: "❋" },
          { titulo: "Cultura ribeirinha", simbolo: "✦" },
          { titulo: "Turismo sustentável", simbolo: "☘" },
          { titulo: "Imersão na floresta", simbolo: "✺" },
          { titulo: "Vivências comunitárias", simbolo: "☾" },
          { titulo: "Espaço para práticas terapêuticas", simbolo: "✧" },
          { titulo: "Presença e desaceleração", simbolo: "☼" },
          { titulo: "Conexão profunda com o Rio Negro", simbolo: "≈" },
        ],
      },
      {
        chave: "vivencias",
        titulo: "Vivências que aproximam seu grupo da floresta, da cultura e de si mesmo",
        itens: [
          {
            titulo: "Navegação pelo Rio Negro",
            descricao:
              "Travessias de barco que convidam ao silêncio, à contemplação e à presença diante da imensidão das águas.",
            imagem: `${IMG}/amazonas-navegacao.jpg`,
          },
          {
            titulo: "Trilha na floresta amazônica",
            descricao: "Um encontro direto com a força da mata, seus sons, aromas, texturas e ensinamentos.",
            imagem: `${IMG}/amazonas-trilha.jpg`,
          },
          {
            titulo: "Pôr do sol no flutuante",
            descricao:
              "Um momento perfeito para práticas de integração, meditação, partilhas ou rituais conduzidos pela terapeuta.",
            imagem: `${IMG}/amazonas-porsol-flutuante.jpg`,
          },
          {
            titulo: "Oficina de ervas medicinais",
            descricao: "Contato com saberes tradicionais e com a potência das plantas da floresta.",
            imagem: `${IMG}/amazonas-ervas.jpg`,
          },
          {
            titulo: "Oficina de artesanato",
            descricao: "Uma vivência cultural que aproxima o grupo da comunidade e de seus modos de criação.",
            imagem: `${IMG}/amazonas-artesanato.jpg`,
          },
          {
            titulo: "Oficina de açaí",
            descricao: "Uma experiência sensorial ligada aos sabores, ao cotidiano e à cultura amazônica.",
            imagem: `${IMG}/amazonas-acai.jpg`,
          },
          {
            titulo: "Oficina de cosméticos naturais",
            descricao: "Um mergulho em saberes da natureza e no uso consciente de recursos locais.",
            imagem: `${IMG}/amazonas-cosmeticos.jpg`,
          },
          {
            titulo: "Oficina de Carimbó",
            descricao: "Movimento, ritmo, alegria e expressão cultural para integrar corpo, grupo e território.",
            imagem: `${IMG}/amazonas-carimbo.jpg`,
          },
          {
            titulo: "Projeto Quelônios",
            descricao: "Contato com iniciativas de preservação e cuidado com a vida amazônica.",
            imagem: `${IMG}/amazonas-quelonios.jpg`,
          },
          {
            titulo: "Encontro com a cultura ribeirinha",
            descricao:
              "Uma oportunidade de conhecer histórias, modos de vida e saberes de quem habita esse território.",
            imagem: `${IMG}/amazonas-comunidade.jpg`,
          },
          {
            titulo: "Encontro com os botos",
            descricao: "Um momento de encantamento com um dos seres mais simbólicos das águas do Rio Negro.",
            imagem: `${IMG}/amazonas-boto.jpg`,
          },
        ],
      },
      {
        chave: "formatos",
        titulo: "Uma experiência que pode nascer do seu jeito",
        itens: [
          { titulo: "Retiro de reconexão com a natureza" },
          { titulo: "Imersão de autoconhecimento" },
          { titulo: "Vivência feminina" },
          { titulo: "Retiro de silêncio e presença" },
          { titulo: "Jornada de cura emocional" },
          { titulo: "Imersão de corpo, movimento e expressão" },
          { titulo: "Experiência espiritual em contato com a floresta" },
          { titulo: "Viagem de integração para grupos terapêuticos" },
        ],
      },
    ],
    perguntas: [
      {
        q: "Essa página é para viajantes individuais?",
        a: "Não. Esta página é voltada para terapeutas, facilitadoras e líderes de grupos que desejam criar uma experiência personalizada na Amazônia com a NeoSenses.",
      },
      {
        q: "Preciso já ter um grupo formado?",
        a: "Não necessariamente. Você pode conversar com a equipe da NeoSenses para entender possibilidades, formatos e próximos passos.",
      },
      {
        q: "A NeoSenses cuida da logística?",
        a: "Sim. A proposta é que a NeoSenses apoie a construção do roteiro, experiências, parceiros locais, hospedagens e estrutura da jornada.",
      },
      {
        q: "Posso conduzir minhas próprias práticas?",
        a: "Sim. A ideia é que a terapeuta possa levar sua própria medicina, metodologia e condução, integrando suas práticas ao roteiro criado com a NeoSenses.",
      },
      {
        q: "A experiência envolve comunidade local?",
        a: "Sim. A jornada valoriza o turismo de base comunitária, a cultura ribeirinha e o contato respeitoso com as pessoas que vivem na região.",
      },
      {
        q: "O roteiro é personalizável?",
        a: "Sim. A proposta é criar uma experiência alinhada ao propósito da terapeuta e ao perfil do grupo.",
      },
    ],
    fotos: [
      `${IMG}/amazonas-floresta-aerea.jpg`,
      `${IMG}/amazonas-flutuante.jpg`,
      `${IMG}/amazonas-final.jpg`,
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────
console.log(`\nBanco: ${LOCAL ? "LOCAL" : "NUVEM"} — ${U}\n`);

if (SIMULAR) {
  for (const j of JORNADAS) {
    const itens = j.grades.reduce((s, g) => s + g.itens.length, 0);
    console.log(
      `  ${j.slug.padEnd(46)} ${j.template.padEnd(11)} ` +
        `${String(j.territorios.length).padStart(2)} territórios · ${String(itens).padStart(2)} destaques · ` +
        `${j.perguntas.length} perguntas · ${j.parceria.facilitador.length}+${j.parceria.neosenses.length} parceria`
    );
  }
  console.log("\n(simulação — nada foi gravado)");
  process.exit(0);
}

// Destinos, para ligar as jornadas onde faz sentido.
const destinos = await req("destinations?select=id,slug");
const idDoDestino = (slug) => {
  if (!slug) return null;
  const d = destinos.find((x) => x.slug?.pt === slug);
  if (!d) console.warn(`  aviso: destino "${slug}" não existe — a jornada fica sem destino ligado`);
  return d?.id ?? null;
};

let criadas = 0;
let atualizadas = 0;

for (const j of JORNADAS) {
  const registro = {
    title: pt(j.titulo),
    slug: pt(j.slug),
    hero_kicker: pt(j.chapeu),
    short_description: pt(j.resumo),
    description: pt(j.descricao),
    who_is_this_for: pt(j.paraQuem),
    closing_title: pt(j.fechamento.titulo),
    closing_text: pt(j.fechamento.texto),
    hero_image: j.capa,
    destination_id: idDoDestino(j.destino),
    audience: "facilitador",
    template: j.template,
    status: "published",
    published_at: new Date().toISOString(),
    price_currency: "BRL",
    metadata: {
      origem: "modelo aprovado pela equipe (Netlify)",
      cadastrado_em: new Date().toISOString().slice(0, 10),
      // As faixas de foto da página saem daqui — mesmo campo que a migração
      // do site antigo usou, para o layout ter uma fonte só.
      imagens_originais: j.fotos,
    },
  };

  const existente = await req(`experiences?slug->>pt=eq.${encodeURIComponent(j.slug)}&select=id`);
  let id;

  if (existente.length) {
    await req(`experiences?id=eq.${existente[0].id}`, {
      method: "PATCH",
      body: JSON.stringify(registro),
    });
    id = existente[0].id;
    atualizadas++;
    console.log(`  atualizada  ${j.slug}`);
  } else {
    const criada = await req("experiences", { method: "POST", body: JSON.stringify(registro) });
    id = criada[0].id;
    criadas++;
    console.log(`  criada      ${j.slug}`);
  }

  // Os filhos são recriados por inteiro. Sem isso, a segunda execução
  // duplicaria cada território e cada pergunta — nenhuma dessas tabelas tem
  // chave natural que um upsert pudesse usar.
  for (const tabela of [
    "experience_highlights",
    "itinerary_days",
    "experience_faqs",
    "experience_partnership",
  ]) {
    await req(`${tabela}?experience_id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  }

  const destaques = [];
  let ordem = 0;
  for (const grade of j.grades) {
    for (const item of grade.itens) {
      destaques.push({
        experience_id: id,
        grupo: grade.chave,
        grupo_titulo: pt(grade.titulo),
        title: pt(item.titulo),
        description: item.descricao ? pt(item.descricao) : null,
        icon: item.simbolo ?? null,
        sort_order: ordem++,
      });
    }
  }
  if (destaques.length) {
    await req("experience_highlights", {
      method: "POST",
      body: JSON.stringify(destaques),
      prefer: "return=minimal",
    });
  }

  if (j.territorios.length) {
    await req("itinerary_days", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify(
        j.territorios.map((t, i) => ({
          experience_id: id,
          day_number: i + 1,
          title: pt(t.titulo),
          description: pt(t.descricao),
          image: t.imagem ?? null,
          sort_order: i,
        }))
      ),
    });
  }

  await req("experience_faqs", {
    method: "POST",
    prefer: "return=minimal",
    body: JSON.stringify(
      j.perguntas.map((p, i) => ({
        experience_id: id,
        question: pt(p.q),
        answer: pt(p.a),
        sort_order: i,
      }))
    ),
  });

  const parceria = [
    ...j.parceria.facilitador.map((texto, i) => ({
      experience_id: id,
      side: "facilitador",
      text: pt(texto),
      sort_order: i,
    })),
    ...j.parceria.neosenses.map((texto, i) => ({
      experience_id: id,
      side: "neosenses",
      text: pt(texto),
      sort_order: i,
    })),
  ];
  await req("experience_partnership", {
    method: "POST",
    body: JSON.stringify(parceria),
    prefer: "return=minimal",
  });
}

console.log(`\n${criadas} criada(s), ${atualizadas} atualizada(s).`);
console.log("Conferir em /para-facilitadores\n");
