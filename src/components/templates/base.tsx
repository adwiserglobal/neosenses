/**
 * As peças de topo e de moldura, num módulo próprio.
 *
 * Separadas de `blocos.tsx` por causa do peso no navegador: `/contato` e
 * `/planejar` são componentes de cliente, e importar `blocos` inteiro
 * mandaria a grade, o roteiro em sanfona e o "quem conduz" para o bundle
 * dessas páginas — 800 linhas de layout que elas não desenham.
 *
 * Quem já importava de `blocos` continua funcionando: lá tudo isto é
 * reexportado.
 */

import Image from "next/image";
import type { ReactNode } from "react";
import { podeOtimizar } from "@/lib/utils";

// ── Fundo das faixas ───────────────────────────────────────────────────────
/**
 * As quatro superfícies. Alternar é o que dá ritmo à página longa: dois
 * blocos claros seguidos viram uma parede de texto.
 */
export type Fundo = "areia" | "clara" | "noite" | "floresta";

const FUNDOS: Record<Fundo, string> = {
  areia: "bg-warm-white text-text-primary",
  clara: "bg-surface text-text-primary",
  noite: "bg-primary-700 text-warm-white",
  floresta: "bg-forest-700 text-warm-white",
};

export const ehEscuro = (fundo: Fundo) => fundo === "noite" || fundo === "floresta";

// ── Faixa ──────────────────────────────────────────────────────────────────
export function Faixa({
  children,
  fundo = "areia",
  id,
  className = "",
  largura = "wide",
}: {
  children: ReactNode;
  fundo?: Fundo;
  id?: string;
  className?: string;
  largura?: "wide" | "content" | "narrow";
}) {
  const container =
    largura === "narrow" ? "container-narrow" : largura === "content" ? "container-content" : "container-wide";

  return (
    <section id={id} className={`${FUNDOS[fundo]} py-20 md:py-28 ${className}`}>
      <div className={container}>{children}</div>
    </section>
  );
}

// ── Chapéu ─────────────────────────────────────────────────────────────────
export function Chapeu({
  children,
  escuro = false,
  comRisco = false,
  className = "",
}: {
  children: ReactNode;
  escuro?: boolean;
  comRisco?: boolean;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={`chapeu ${escuro ? "chapeu-claro" : ""} ${comRisco ? "chapeu-com-risco" : ""} ${className}`}
    >
      {children}
    </p>
  );
}


// ── Capa ───────────────────────────────────────────────────────────────────
/**
 * O topo da página.
 *
 * `priority` na imagem porque ela é, por definição, o maior elemento acima
 * da dobra — sem isso o Next a trata como qualquer outra e ela entra depois
 * do resto, que é exatamente a métrica que o buscador mede.
 *
 * O véu escuro por cima não é estética: o título é branco, e sobre foto
 * clara ele desaparece. Com o degradê, o contraste do texto deixa de
 * depender da foto que alguém cadastrar amanhã.
 */
export function Capa({
  chapeu,
  titulo,
  subtitulo,
  resumo,
  imagem,
  altura = "media",
  acoes,
  meta,
  alinhamento = "esquerda",
}: {
  chapeu?: string;
  titulo: string;
  /** Segunda linha do topo, logo abaixo do título — "As Três Faces do
   *  Divino". Fica aqui e não no chapéu: em caixa alta e emendado à
   *  categoria e ao destino, o topo virava uma linha de quatro partes que
   *  ninguém lê inteira. */
  subtitulo?: string;
  resumo?: string;
  imagem?: string | null;
  altura?: "media" | "cheia";
  acoes?: ReactNode;
  meta?: ReactNode;
  alinhamento?: "esquerda" | "centro";
}) {
  const centro = alinhamento === "centro";

  return (
    <section
      className={`relative flex items-end overflow-hidden bg-primary-700 pb-16 pt-32 md:pb-20 ${
        altura === "cheia" ? "min-h-[86vh]" : "min-h-[62vh]"
      }`}
    >
      {imagem && (
        <>
          <Image
            src={imagem}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            unoptimized={!podeOtimizar(imagem)}
            className="object-cover"
          />
          {/* O véu é quem garante a legibilidade, não a foto.
           *
           * A parada do meio subiu de 75% para 88% de opacidade depois de
           * medir: com 75%, o chapéu dourado sobre a montanha de Vinicunca
           * dava 3,65:1 — reprovado para 11px, que pede 4,5:1. E `hero_image`
           * é campo livre do painel, então a próxima foto cadastrada pode ser
           * mais clara ainda.
           *
           * 88% no meio segura o dourado em 6,1:1 mesmo contra branco puro,
           * que é o pior caso possível. O topo continua em 25% para a foto
           * respirar — é lá que ela aparece, e nenhum texto mora lá. */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-800 via-primary-800/88 to-primary-800/25" />
        </>
      )}

      <div className={`container-wide relative z-10 ${centro ? "text-center" : ""}`}>
        {chapeu && (
          <Chapeu escuro comRisco={!centro} className="mb-5">
            {chapeu}
          </Chapeu>
        )}

        <h1
          className={`font-heading text-warm-white ${centro ? "mx-auto max-w-4xl" : "max-w-4xl"}`}
        >
          {titulo}
        </h1>

        {subtitulo && (
          <p
            className={`mt-3 font-heading text-xl italic text-secondary-200 md:text-2xl ${
              centro ? "mx-auto max-w-3xl" : "max-w-3xl"
            }`}
          >
            {subtitulo}
          </p>
        )}

        {resumo && (
          <p
            className={`mt-6 text-lg leading-relaxed text-warm-white/80 md:text-xl ${
              centro ? "mx-auto max-w-2xl" : "max-w-2xl"
            }`}
          >
            {resumo}
          </p>
        )}

        {meta && (
          <div
            className={`mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-warm-white/70 ${
              centro ? "justify-center" : ""
            }`}
          >
            {meta}
          </div>
        )}

        {acoes && (
          <div className={`mt-9 flex flex-wrap gap-4 ${centro ? "justify-center" : ""}`}>{acoes}</div>
        )}
      </div>
    </section>
  );
}

