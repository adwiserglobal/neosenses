/**
 * As peças que os quatro layouts compartilham.
 *
 * Vieram da leitura dos três modelos da equipe (peru-sagrado, marrocos,
 * rio-amazonas): os três repetem a mesma gramática — chapéu curto em caixa
 * alta, título serifado grande, texto de respiro, e faixas que alternam
 * claro e escuro para marcar capítulo. O que muda entre eles é a ordem e
 * quais blocos aparecem, não o desenho de cada bloco.
 *
 * Tudo aqui é Server Component: nenhum destes precisa de estado, e o que
 * abre e fecha usa `<details>`, que o navegador já sabe fazer sem
 * JavaScript. Página longa que só existe depois do JS carregar é página
 * que o buscador lê pela metade.
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { Surge, SurgeEmCascata } from "@/components/ui/Surge";
import { podeOtimizar } from "@/lib/utils";

import { Chapeu, ehEscuro, type Fundo } from "./base";

// As peças de topo moram em `base.tsx` — ver o porquê no cabeçalho de lá.
export { Capa, Chapeu, Faixa, ehEscuro, type Fundo } from "./base";

// ── Título de seção ────────────────────────────────────────────────────────
export function TituloDeSecao({
  chapeu,
  titulo,
  texto,
  fundo = "areia",
  centro = false,
  className = "",
}: {
  chapeu?: string;
  titulo: string;
  texto?: string;
  fundo?: Fundo;
  centro?: boolean;
  className?: string;
}) {
  const escuro = ehEscuro(fundo);
  return (
    // O título entra antes do conteúdo, e o chapéu antes dele: a cascata
    // curta faz o olho subir ao começo da seção em vez de cair no meio.
    <div className={`${centro ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      {chapeu && (
        <Surge>
          <Chapeu escuro={escuro} comRisco={!centro} className="mb-4">
            {chapeu}
          </Chapeu>
        </Surge>
      )}
      <Surge atraso={chapeu ? 0.08 : 0}>
        <h2
          className={`font-heading text-3xl md:text-4xl ${
            escuro ? "text-warm-white" : "text-primary-700"
          }`}
        >
          {titulo}
        </h2>
      </Surge>
      {texto && (
        <Surge atraso={0.16}>
          <p
            className={`mt-5 text-lg leading-relaxed ${
              escuro ? "text-warm-white/75" : "text-text-muted"
            } ${centro ? "mx-auto" : ""}`}
          >
            {texto}
          </p>
        </Surge>
      )}
    </div>
  );
}

// ── Texto de corpo ─────────────────────────────────────────────────────────
/**
 * Parágrafos vindos do banco. O conteúdo é texto puro com quebras — nunca
 * HTML —, então cada bloco separado por linha em branco vira um parágrafo
 * aqui e não há como injetar marcação pelo painel.
 */
export function Corpo({
  texto,
  fundo = "areia",
  className = "",
}: {
  texto: string;
  fundo?: Fundo;
  className?: string;
}) {
  const paragrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragrafos.length === 0) return null;
  const escuro = ehEscuro(fundo);

  return (
    <div className={`space-y-5 ${className}`}>
      {paragrafos.map((p, i) => (
        <p
          key={i}
          className={`max-w-[68ch] whitespace-pre-line leading-relaxed ${
            escuro ? "text-warm-white/80" : "text-text-primary/85"
          }`}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

// ── Citação ────────────────────────────────────────────────────────────────
export function Citacao({ children, fundo = "areia" }: { children: ReactNode; fundo?: Fundo }) {
  const escuro = ehEscuro(fundo);
  return (
    <blockquote
      className={`mt-10 border-l-2 pl-6 font-heading text-xl italic leading-snug md:text-2xl ${
        escuro ? "border-secondary-300 text-warm-white" : "border-secondary-400 text-primary-700"
      }`}
    >
      {children}
    </blockquote>
  );
}

// ── Faixa de foto ──────────────────────────────────────────────────────────
/**
 * Banner largo entre seções. Existe para dar respiro numa página longa —
 * e por isso é decorativo: `alt` vazio e `aria-hidden`, para o leitor de
 * tela não anunciar uma imagem que não acrescenta informação. Quando há
 * legenda, ela é conteúdo e vai no texto, não no `alt`.
 */
export function FaixaFoto({
  imagem,
  legenda,
  altura = "media",
}: {
  imagem?: string | null;
  legenda?: string;
  altura?: "baixa" | "media" | "alta";
}) {
  if (!imagem) return null;

  const alturas = {
    baixa: "h-[38vh] min-h-[240px]",
    media: "h-[52vh] min-h-[320px]",
    alta: "h-[70vh] min-h-[420px]",
  };

  return (
    <section className={`relative w-full overflow-hidden bg-primary-800 ${alturas[altura]}`}>
      <Image
        src={imagem}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        unoptimized={!podeOtimizar(imagem)}
        className="object-cover"
      />
      {legenda && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-800/85 to-transparent" />
          <div className="container-wide absolute inset-x-0 bottom-0 pb-10">
            <p className="max-w-xl font-heading text-xl leading-snug text-warm-white md:text-2xl">
              {legenda}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

// ── Grade de cartões ───────────────────────────────────────────────────────
export interface ItemDeGrade {
  id: string;
  titulo: string;
  descricao?: string;
  imagem?: string | null;
}

export function Grade({
  itens,
  fundo = "areia",
  colunas = 3,
  comImagem = false,
  numerada = true,
}: {
  itens: ItemDeGrade[];
  fundo?: Fundo;
  colunas?: 2 | 3 | 4;
  comImagem?: boolean;
  /**
   * Numeração discreta no canto de cada cartão.
   *
   * Substitui os símbolos decorativos (✦ ❋ ☾) que ficavam aqui. Eles
   * pediam significado que não tinham — um ✺ não quer dizer nada — e numa
   * compra de quinze a quarenta mil reais liam como apresentação de
   * escola. O número é o mesmo tratamento das etapas do roteiro e dos
   * benefícios da página de facilitador: coerência, não enfeite novo.
   *
   * Desligue quando o cartão já tiver imagem: aí a foto é o âncora visual
   * e o número vira ruído.
   */
  numerada?: boolean;
}) {
  if (itens.length === 0) return null;
  const escuro = ehEscuro(fundo);

  const grade =
    colunas === 2
      ? "sm:grid-cols-2"
      : colunas === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul className={`grid gap-6 ${grade}`}>
      {itens.map((item, i) => (
        <SurgeEmCascata key={item.id} indice={i} as="li" className="h-full">
          <div
            className={`group h-full overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${
              escuro
                ? "border-warm-white/15 bg-warm-white/[0.06] hover:border-secondary-300/40 hover:bg-warm-white/[0.09]"
                : "border-border bg-surface hover:border-secondary-300 hover:shadow-card"
            }`}
          >
            {comImagem && item.imagem && (
              <div className="relative aspect-[4/3] overflow-hidden bg-warm-gray">
                <Image
                  src={item.imagem}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={!podeOtimizar(item.imagem)}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            )}

            <div className="p-6">
              {numerada && !comImagem && (
                <span
                  aria-hidden="true"
                  className={`mb-3 block font-heading text-sm leading-none tracking-widest ${
                    escuro ? "text-secondary-300/70" : "text-secondary-500/70"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}

              <h3
                className={`font-heading text-lg ${escuro ? "text-warm-white" : "text-primary-700"}`}
              >
                {item.titulo}
              </h3>

              {item.descricao && (
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    escuro ? "text-warm-white/70" : "text-text-muted"
                  }`}
                >
                  {item.descricao}
                </p>
              )}
            </div>
          </div>
        </SurgeEmCascata>
      ))}
    </ul>
  );
}

// ── Etapas numeradas ───────────────────────────────────────────────────────
/**
 * Territórios e roteiro. O número é decorativo — a ordem já está na
 * sequência da lista, e um leitor de tela lendo "zero um" antes de cada
 * título só atrapalha.
 */
export function Etapas({
  itens,
  fundo = "areia",
}: {
  itens: Array<{ id: string; numero: number; titulo: string; descricao?: string; local?: string | null; imagem?: string | null }>;
  fundo?: Fundo;
}) {
  if (itens.length === 0) return null;
  const escuro = ehEscuro(fundo);

  return (
    <ol className="space-y-px">
      {itens.map((item) => (
        <li
          key={item.id}
          className={`grid gap-4 border-t py-8 md:grid-cols-[auto_1fr] md:gap-10 ${
            escuro ? "border-warm-white/15" : "border-border"
          }`}
        >
          <span
            aria-hidden="true"
            className={`font-heading text-3xl leading-none md:w-20 ${
              escuro ? "text-secondary-300/70" : "text-secondary-500"
            }`}
          >
            {String(item.numero).padStart(2, "0")}
          </span>

          <div className="min-w-0">
            <h3 className={`font-heading text-xl ${escuro ? "text-warm-white" : "text-primary-700"}`}>
              {item.titulo}
            </h3>
            {item.local && (
              <p className={`mt-1 text-xs uppercase tracking-wider ${escuro ? "text-warm-white/50" : "text-text-muted"}`}>
                {item.local}
              </p>
            )}
            {item.descricao && (
              <p
                className={`mt-3 max-w-[65ch] leading-relaxed ${
                  escuro ? "text-warm-white/75" : "text-text-muted"
                }`}
              >
                {item.descricao}
              </p>
            )}

            {item.imagem && (
              <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-lg bg-warm-gray">
                <Image
                  src={item.imagem}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 768px) 70vw, 100vw"
                  unoptimized={!podeOtimizar(item.imagem)}
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Etapas em sanfona ──────────────────────────────────────────────────────
/**
 * O roteiro dia a dia, com cada etapa fechada por padrão.
 *
 * O documento de reformulação pede sanfona na seção "A Jornada" para não
 * alongar demais a rolagem no celular — um roteiro de catorze dias com
 * tudo aberto passa de dez telas, e quem quer só saber quantos dias são
 * desiste no meio.
 *
 * `<details>` nativo, não estado em React: abre e fecha sem JavaScript, o
 * buscador lê o conteúdo fechado, e Ctrl+F do navegador encontra o texto
 * de dentro. A primeira etapa vem aberta para que a página não pareça uma
 * lista de títulos mudos.
 */
export function EtapasSanfona({
  itens,
  fundo = "areia",
}: {
  itens: Array<{
    id: string;
    numero: number;
    titulo: string;
    descricao?: string;
    local?: string | null;
    imagem?: string | null;
  }>;
  fundo?: Fundo;
}) {
  if (itens.length === 0) return null;
  const escuro = ehEscuro(fundo);

  return (
    <ol className="space-y-3">
      {itens.map((item, i) => (
        <SurgeEmCascata key={item.id} indice={i} as="li">
          <details
            open={i === 0}
            className={`group overflow-hidden rounded-xl border ${
              escuro ? "border-warm-white/15 bg-warm-white/[0.06]" : "border-border bg-surface"
            }`}
          >
            <summary
              className={`flex cursor-pointer list-none items-center gap-4 px-5 py-4 marker:content-[''] ${
                escuro ? "text-warm-white" : "text-primary-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`shrink-0 font-heading text-lg leading-none ${
                  escuro ? "text-secondary-300/80" : "text-secondary-500"
                }`}
              >
                {String(item.numero).padStart(2, "0")}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug">{item.titulo}</span>
                {item.local && (
                  <span
                    className={`mt-0.5 block text-xs uppercase tracking-wider ${
                      escuro ? "text-warm-white/50" : "text-text-muted"
                    }`}
                  >
                    {item.local}
                  </span>
                )}
              </span>

              <span
                aria-hidden="true"
                className={`shrink-0 text-lg transition-transform group-open:rotate-45 ${
                  escuro ? "text-secondary-300" : "text-secondary-500"
                }`}
              >
                +
              </span>
            </summary>

            {(item.descricao || item.imagem) && (
              <div className="px-5 pb-5 pl-[3.75rem]">
                {item.descricao && (
                  <p
                    className={`max-w-[65ch] whitespace-pre-line leading-relaxed ${
                      escuro ? "text-warm-white/75" : "text-text-muted"
                    }`}
                  >
                    {item.descricao}
                  </p>
                )}
                {item.imagem && (
                  <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-lg bg-warm-gray">
                    <Image
                      src={item.imagem}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="(min-width: 768px) 70vw, 100vw"
                      unoptimized={!podeOtimizar(item.imagem)}
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </details>
        </SurgeEmCascata>
      ))}
    </ol>
  );
}

// ── Perguntas ──────────────────────────────────────────────────────────────
export function Perguntas({
  itens,
  fundo = "areia",
}: {
  itens: Array<{ id: string; pergunta: string; resposta: string }>;
  fundo?: Fundo;
}) {
  if (itens.length === 0) return null;
  const escuro = ehEscuro(fundo);

  return (
    <div className="space-y-3">
      {itens.map((item) => (
        <details
          key={item.id}
          className={`group rounded-xl border px-6 py-5 ${
            escuro ? "border-warm-white/15 bg-warm-white/[0.06]" : "border-border bg-surface"
          }`}
        >
          <summary
            className={`flex cursor-pointer items-center justify-between gap-4 font-medium marker:content-[''] ${
              escuro ? "text-warm-white" : "text-primary-700"
            }`}
          >
            {item.pergunta}
            <span
              aria-hidden="true"
              className={`shrink-0 text-lg transition-transform group-open:rotate-45 ${
                escuro ? "text-secondary-300" : "text-secondary-500"
              }`}
            >
              +
            </span>
          </summary>
          <p
            className={`mt-4 max-w-[68ch] whitespace-pre-line leading-relaxed ${
              escuro ? "text-warm-white/75" : "text-text-muted"
            }`}
          >
            {item.resposta}
          </p>
        </details>
      ))}
    </div>
  );
}

// ── Quem conduz ────────────────────────────────────────────────────────────
/**
 * Seção 8 do esqueleto: a equipe da jornada, em três papéis.
 *
 * O documento de reformulação separa quem facilita, o guia da NeoSenses
 * credenciado no CADASTUR e o anfitrião local. Não é organização por
 * organização: é o argumento de segurança da página — a pessoa está
 * comprando uma viagem cara para ir com desconhecidos, e saber que há um
 * guia credenciado junto muda a decisão.
 *
 * Papel sem ninguém cadastrado não vira bloco vazio nem promessa: some.
 */
const PAPEIS: Array<{ chave: string; titulo: string; ajuda: string }> = [
  {
    chave: "facilitator",
    titulo: "Facilitação",
    ajuda: "Quem conduz a vivência e sustenta o campo do grupo.",
  },
  {
    chave: "guia_neosenses",
    titulo: "Guia acompanhante NeoSenses",
    ajuda: "Guia de turismo credenciado, responsável pela logística e pelo apoio ao grupo.",
  },
  {
    chave: "guia_local",
    titulo: "Anfitrião local",
    ajuda: "Quem recebe no território e conduz as vivências da tradição do lugar.",
  },
];

export function QuemConduz({
  pessoas,
  fundo = "clara",
}: {
  pessoas: Array<{ id: string; nome: string; papel: string; bio?: string; foto?: string | null }>;
  fundo?: Fundo;
}) {
  if (pessoas.length === 0) return null;
  const escuro = ehEscuro(fundo);

  const grupos = PAPEIS.map((p) => ({
    ...p,
    membros: pessoas.filter((x) => (x.papel || "facilitator") === p.chave),
  })).filter((g) => g.membros.length > 0);

  // Papel desconhecido no banco não some da página: entra como facilitação,
  // que é o padrão da coluna.
  const conhecidos = new Set(PAPEIS.map((p) => p.chave));
  const soltos = pessoas.filter((x) => !conhecidos.has(x.papel || "facilitator"));
  if (soltos.length > 0) {
    const facilitacao = grupos.find((g) => g.chave === "facilitator");
    if (facilitacao) facilitacao.membros.push(...soltos);
    else grupos.unshift({ ...PAPEIS[0], membros: soltos });
  }

  return (
    <div className="space-y-10">
      {grupos.map((grupo) => (
        <div key={grupo.chave}>
          <h3
            className={`font-heading text-lg ${escuro ? "text-warm-white" : "text-primary-700"}`}
          >
            {grupo.titulo}
          </h3>
          <p className={`mt-1 text-sm ${escuro ? "text-warm-white/60" : "text-text-muted"}`}>
            {grupo.ajuda}
          </p>

          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {grupo.membros.map((pessoa) => (
              <li
                key={pessoa.id}
                className={`flex gap-4 rounded-xl border p-5 ${
                  escuro ? "border-warm-white/15 bg-warm-white/[0.06]" : "border-border bg-surface"
                }`}
              >
                {pessoa.foto ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-warm-gray">
                    <Image
                      src={pessoa.foto}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="64px"
                      unoptimized={!podeOtimizar(pessoa.foto)}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-heading text-xl ${
                      escuro
                        ? "bg-warm-white/10 text-secondary-300"
                        : "bg-secondary-50 text-secondary-500"
                    }`}
                    aria-hidden="true"
                  >
                    {pessoa.nome.charAt(0)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className={`font-medium ${escuro ? "text-warm-white" : "text-primary-700"}`}>
                    {pessoa.nome}
                  </p>
                  {pessoa.bio && (
                    <p
                      className={`mt-1 text-sm leading-relaxed ${
                        escuro ? "text-warm-white/70" : "text-text-muted"
                      }`}
                    >
                      {pessoa.bio}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
