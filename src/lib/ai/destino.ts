/**
 * Assistente de cadastro de destino.
 *
 * O admin digita "Kyoto, Japão" e recebe de volta um rascunho preenchido:
 * descrição, altitude, clima, coordenadas, texto para o site e o que a foto
 * deveria mostrar. Ele revisa, corrige e salva.
 *
 * ── Por que isto não pesa no site ─────────────────────────────────────────
 *
 * A IA roda UMA VEZ, no cadastro, com uma pessoa esperando na frente da tela.
 * O visitante lê do banco e nunca dispara uma chamada. É o inverso de dar
 * busca ao vivo ao Concierge: lá, cada visitante pagaria a latência e o
 * modelo teria liberdade de inventar a cada resposta; aqui, o custo é de uma
 * vez e passa por revisão humana antes de virar conteúdo.
 *
 * ── Por que a conferência abaixo existe ───────────────────────────────────
 *
 * Modelo de linguagem erra coordenada com a mesma confiança com que acerta.
 * "Latitude -13.16, longitude -72.54" para Machu Picchu está certo; para uma
 * vila pequena, pode estar a centenas de quilômetros. Como isso alimenta o
 * Concierge e o Packing Assistant, o erro se propaga.
 *
 * Então nada entra direto: cada campo é verificado contra o que é
 * fisicamente possível, e o que não passa é REBAIXADO a "confirmar" em vez de
 * ser descartado em silêncio. O admin vê o campo marcado e decide.
 *
 * ── O que esta conferência NÃO faz ────────────────────────────────────────
 *
 * Ela valida plausibilidade física, não existência. Pedindo a ficha de um
 * lugar inventado, o modelo devolve uma ficha inteira e convincente — testado
 * com "Vilarejo de Zarthonia, Montanhas de Kelbrand", que não existe: veio
 * nome em três idiomas e o resto a caminho. Coordenada inventada dentro da
 * faixa válida passa aqui, porque não há como distinguir daqui.
 *
 * O que segura isso é o fluxo: quem digita o nome do lugar é a pessoa que
 * está montando a viagem para lá. Ela sabe que o lugar existe — é a IA que
 * pode não saber. Por isso o resultado é rascunho de formulário e não
 * gravação direta.
 *
 * Este módulo não conhece o cliente de IA — de propósito, para ser testável
 * sem rede. Mesma escolha de `journey/roteiro.ts`.
 */

// ── O que a IA devolve ─────────────────────────────────────────────────────
export interface SugestaoDestino {
  nome: string;
  nomeEn?: string;
  nomeEs?: string;
  pais: string;
  paisCodigo?: string;
  descricao: string;
  /** Parágrafo pronto para a página, em tom de convite e sem promessa. */
  copy?: string;
  latitude?: number | null;
  longitude?: number | null;
  altitudeM?: number | null;
  timezone?: string | null;
  climaTipo?: string | null;
  tempMinC?: number | null;
  tempMaxC?: number | null;
  estacaoChuvosa?: string | null;
  /** O que a foto de capa deveria mostrar. A IA não gera imagem. */
  fotoSugerida?: string | null;
  /** Termos para procurar a foto em banco de imagens. */
  fotoBusca?: string[];
  /** Cuidados que valem para quem viaja em grupo até lá. */
  avisos?: string[];
}

/** Campo que não passou na conferência e precisa de olho humano. */
export interface Ressalva {
  campo: string;
  motivo: string;
}

export interface SugestaoConferida {
  sugestao: SugestaoDestino;
  ressalvas: Ressalva[];
}

const CLIMAS = [
  "tropical", "equatorial", "subtropical", "temperado", "mediterraneo",
  "desertico", "semiarido", "montanha", "frio", "polar",
];

/** Fuso horário que o Node reconhece. Nome inventado quebraria a formatação. */
function fusoValido(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function numeroOuNulo(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * Normaliza e confere a resposta da IA.
 *
 * Nunca lança: devolve o que dá para aproveitar mais a lista do que precisa de
 * conferência. Rascunho com três campos marcados é mais útil que erro na tela.
 */
export function conferirSugestao(bruto: unknown): SugestaoConferida | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;
  const ressalvas: Ressalva[] = [];

  const nome = texto(o.nome, 120);
  const pais = texto(o.pais, 80);
  if (!nome || !pais) return null; // sem isso não há destino nenhum

  // ── Coordenadas ──────────────────────────────────────────────────────────
  // Fora de faixa é impossível, não improvável. E (0,0) é a Ilha Nula, no
  // Atlântico — quase sempre sinal de campo não preenchido virando zero.
  let latitude = numeroOuNulo(o.latitude);
  let longitude = numeroOuNulo(o.longitude);

  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    ressalvas.push({ campo: "latitude", motivo: `${latitude} está fora da faixa -90 a 90` });
    latitude = null;
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    ressalvas.push({ campo: "longitude", motivo: `${longitude} está fora da faixa -180 a 180` });
    longitude = null;
  }
  if (latitude === 0 && longitude === 0) {
    ressalvas.push({
      campo: "coordenadas",
      motivo: "(0, 0) fica no oceano Atlântico — provavelmente campo vazio virou zero",
    });
    latitude = null;
    longitude = null;
  }
  if ((latitude === null) !== (longitude === null)) {
    ressalvas.push({
      campo: "coordenadas",
      motivo: "veio só uma das duas; coordenada pela metade não localiza nada",
    });
    latitude = null;
    longitude = null;
  }

  // ── Altitude ─────────────────────────────────────────────────────────────
  // Everest tem 8.849 m e o mar Morto está a -430 m. Fora disso não é lugar
  // onde se leva grupo.
  let altitudeM = numeroOuNulo(o.altitudeM ?? o.altitude_m);
  if (altitudeM !== null && (altitudeM < -450 || altitudeM > 8900)) {
    ressalvas.push({ campo: "altitude", motivo: `${altitudeM} m não é altitude de lugar habitado` });
    altitudeM = null;
  }

  // ── Temperatura ──────────────────────────────────────────────────────────
  let tempMinC = numeroOuNulo(o.tempMinC ?? o.temp_min_c);
  let tempMaxC = numeroOuNulo(o.tempMaxC ?? o.temp_max_c);

  for (const [rotulo, valor] of [["tempMinC", tempMinC], ["tempMaxC", tempMaxC]] as const) {
    if (valor !== null && (valor < -60 || valor > 55)) {
      ressalvas.push({ campo: rotulo, motivo: `${valor} °C está fora do que se registra em terra` });
      if (rotulo === "tempMinC") tempMinC = null;
      else tempMaxC = null;
    }
  }
  if (tempMinC !== null && tempMaxC !== null && tempMinC > tempMaxC) {
    ressalvas.push({
      campo: "temperatura",
      motivo: `mínima (${tempMinC}) maior que a máxima (${tempMaxC})`,
    });
    tempMinC = null;
    tempMaxC = null;
  }

  // ── Clima e fuso ─────────────────────────────────────────────────────────
  let climaTipo: string | null = texto(o.climaTipo ?? o.clima_tipo, 30).toLowerCase() || null;
  if (climaTipo && !CLIMAS.includes(climaTipo)) {
    ressalvas.push({
      campo: "climaTipo",
      motivo: `"${climaTipo}" não está na lista usada pelo site`,
    });
    climaTipo = null;
  }

  let timezone: string | null = texto(o.timezone, 60) || null;
  if (timezone && !fusoValido(timezone)) {
    ressalvas.push({ campo: "timezone", motivo: `"${timezone}" não é um fuso conhecido` });
    timezone = null;
  }

  // ── Texto ────────────────────────────────────────────────────────────────
  const descricao = texto(o.descricao, 600);
  if (!descricao) ressalvas.push({ campo: "descricao", motivo: "veio vazia" });

  const copy = texto(o.copy, 900) || null;

  // Promessa que a NeoSenses não fez não entra no site pela mão da IA.
  const PROIBIDO = /\b(garantimos?|garantido|imperd[ií]vel|única na vida|melhor do mundo|transformar[áa] sua vida|com certeza vai)\b/i;
  if (copy && PROIBIDO.test(copy)) {
    ressalvas.push({
      campo: "copy",
      motivo: "contém promessa ou superlativo que a equipe não autorizou",
    });
  }

  const lista = (v: unknown, max: number, limite: number): string[] =>
    Array.isArray(v) ? v.map((x) => texto(x, max)).filter(Boolean).slice(0, limite) : [];

  return {
    sugestao: {
      nome,
      nomeEn: texto(o.nomeEn ?? o.nome_en, 120) || undefined,
      nomeEs: texto(o.nomeEs ?? o.nome_es, 120) || undefined,
      pais,
      paisCodigo: texto(o.paisCodigo ?? o.pais_codigo, 2).toUpperCase() || undefined,
      descricao,
      copy: copy ?? undefined,
      latitude,
      longitude,
      altitudeM,
      timezone,
      climaTipo,
      tempMinC,
      tempMaxC,
      estacaoChuvosa: texto(o.estacaoChuvosa ?? o.estacao_chuvosa, 40) || null,
      fotoSugerida: texto(o.fotoSugerida ?? o.foto_sugerida, 300) || null,
      fotoBusca: lista(o.fotoBusca ?? o.foto_busca, 60, 6),
      avisos: lista(o.avisos, 200, 6),
    },
    ressalvas,
  };
}

// ── Prompt ─────────────────────────────────────────────────────────────────
export const SISTEMA_DESTINO = `Você prepara fichas de destino para uma agência de viagens brasileira que leva grupos pequenos a lugares de valor cultural e espiritual.

Devolva SOMENTE um objeto JSON, sem texto antes ou depois, com estes campos:

{
  "nome": "nome do destino em português, como apareceria no site",
  "nomeEn": "nome em inglês",
  "nomeEs": "nome em espanhol",
  "pais": "país em português",
  "paisCodigo": "código ISO de 2 letras",
  "descricao": "2 a 3 frases sobre o que o lugar é, geograficamente e culturalmente",
  "copy": "um parágrafo para a página do destino, em português do Brasil",
  "latitude": número decimal,
  "longitude": número decimal,
  "altitudeM": altitude média em metros,
  "timezone": "identificador IANA, ex: America/Sao_Paulo",
  "climaTipo": "um de: tropical, equatorial, subtropical, temperado, mediterraneo, desertico, semiarido, montanha, frio, polar",
  "tempMinC": mínima média anual em Celsius,
  "tempMaxC": máxima média anual em Celsius,
  "estacaoChuvosa": "meses abreviados, ex: dez-mar, ou 'nenhuma'",
  "fotoSugerida": "o que a foto de capa deveria mostrar",
  "fotoBusca": ["3 a 5 termos de busca para achar essa foto"],
  "avisos": ["2 a 4 cuidados práticos para quem viaja em grupo até lá"]
}

REGRAS

1. Dado que você não souber com segurança vai como null. Nunca invente
   coordenada, altitude ou fuso — eles alimentam o que o site diz sobre
   preparação de viagem, e errado é pior que ausente.

2. A "copy" convida, não promete. Nada de "imperdível", "única na vida",
   "vai transformar sua vida" ou superlativo do tipo. Descreva o lugar e o
   que se sente lá; quem decide se é imperdível é quem lê.

3. Não invente preço, data, duração, roteiro, hotel nem nome de guia. Isso é
   de cada saída e não é assunto seu.

4. Os "avisos" são práticos e verificáveis: altitude que exige aclimatação,
   estação de chuva que muda a mala, exigência de visto, código de vestimenta
   em local religioso. Não são conselho médico.

5. Escreva em português do Brasil, no tom de quem conhece o lugar e respeita
   quem mora nele. Evite exotismo e "místico" como enfeite.`;

export function promptDestino(lugar: string, contexto?: string): string {
  const extra = contexto?.trim()
    ? `\n\nContexto que a equipe informou sobre esta viagem:\n${contexto.trim().slice(0, 500)}`
    : "";
  return `Monte a ficha do destino: ${lugar.trim().slice(0, 200)}${extra}`;
}
