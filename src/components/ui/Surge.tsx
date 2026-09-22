"use client";

/**
 * Entrada animada, para usar dentro de Server Component.
 *
 * As páginas internas são `async` e leem o banco, então não podem ser
 * client components — mas `framer-motion` exige um. Este é o pedaço
 * mínimo que roda no navegador: um invólucro que anima os filhos ao
 * entrarem na tela, sem que a página deixe de ser servidor.
 *
 * ── Por que não animar tudo ───────────────────────────────────────────────
 *
 * Movimento serve para dirigir o olho, não para provar que existe. O padrão
 * aqui é curto (0,5s), sutil (18px) e acontece UMA vez (`once: true`):
 * conteúdo que reanima a cada rolagem cansa e atrapalha quem relê.
 *
 * ── Quem pediu menos movimento recebe menos movimento ─────────────────────
 *
 * `prefers-reduced-motion` não é preferência estética: para quem tem
 * sensibilidade vestibular, animação não pedida provoca enjoo de verdade.
 * O CSS já desliga a rolagem suave; aqui o componente devolve o conteúdo
 * parado, sem sequer montar a animação.
 *
 * ── Sem JavaScript, sem esconder ──────────────────────────────────────────
 *
 * `useReducedMotion` só responde depois da hidratação, então o HTML que sai
 * do servidor carrega `opacity: 0` — é assim que o framer-motion funciona, e
 * não há como pedir a animação sem pedir o primeiro quadro invisível.
 *
 * O risco disso é concreto: com o JavaScript desligado ou quebrado, a página
 * chega inteira e não se vê nada. Daí o `data-anima` em cada invólucro e a
 * regra dentro de `<noscript>` no layout, que devolve tudo ao normal. O
 * atributo existe só para esse alcance — não estilize por ele.
 */

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const CURVA = [0.22, 0.61, 0.36, 1] as const;

export function Surge({
  children,
  atraso = 0,
  distancia = 18,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  /** Segundos. Numa lista, use o índice para escalonar. */
  atraso?: number;
  distancia?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const semMovimento = useReducedMotion();
  const Componente = motion[as];

  if (semMovimento) {
    const Simples = as;
    return <Simples className={className}>{children}</Simples>;
  }

  return (
    <Componente
      data-anima=""
      className={className}
      initial={{ opacity: 0, y: distancia }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: atraso,
        ease: CURVA as unknown as [number, number, number, number],
      }}
    >
      {children}
    </Componente>
  );
}

/**
 * A mesma entrada, em cascata, para uma lista.
 *
 * O atraso entre itens é pequeno de propósito: 60ms dá a sensação de que a
 * grade "assenta", e acima de ~100ms a pessoa espera o último item chegar.
 * O teto de 6 evita que o décimo cartão de uma grade grande demore meio
 * segundo para existir.
 */
export function SurgeEmCascata({
  children,
  indice,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  indice: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  return (
    <Surge atraso={Math.min(indice, 6) * 0.06} className={className} as={as}>
      {children}
    </Surge>
  );
}
