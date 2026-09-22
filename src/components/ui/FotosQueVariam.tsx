"use client";

/**
 * Alterna entre as fotos de um destino.
 *
 * Cadastrar três fotos e mostrar sempre a primeira não muda nada para quem
 * revisita a página. A troca é o que faz as três valerem a pena.
 *
 * ── Escolhas ──────────────────────────────────────────────────────────────
 *
 * Cada card começa numa foto diferente. Com todos partindo da primeira, uma
 * grade de sete destinos vira sete transições sincronizadas, piscando juntas
 * — parece defeito, não variação.
 *
 * O ponto de partida vem de um hash do `semente`, e não de Math.random():
 * sorteio de verdade daria resultados diferentes no servidor e no cliente, e
 * o React acusaria a divergência de hidratação. Determinístico resolve os
 * dois problemas de uma vez — cada card difere do vizinho, e servidor e
 * cliente concordam.
 *
 * Quem pede menos movimento não recebe troca nenhuma: fica parado na foto
 * inicial. Card que se mexe sozinho no canto do olho é exatamente o que a
 * preferência existe para evitar.
 *
 * Uma foto só: nem monta o rodízio.
 */

import { useEffect, useState } from "react";

interface Props {
  fotos: string[];
  alt: string;
  className?: string;
  /** Define em qual foto este card começa. O id do destino serve. */
  semente?: string;
  /** Tempo em cada foto. Longo de propósito: isto é fundo, não apresentação. */
  intervaloMs?: number;
}

/** Hash pequeno e estável. Só precisa espalhar, não precisa ser seguro. */
function indiceInicial(semente: string, total: number): number {
  if (total < 2) return 0;
  let h = 0;
  for (let i = 0; i < semente.length; i++) {
    h = (h * 31 + semente.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % total;
}

export function FotosQueVariam({
  fotos,
  alt,
  className = "",
  semente = "",
  intervaloMs = 6000,
}: Props) {
  const [atual, setAtual] = useState(() => indiceInicial(semente, fotos.length));

  useEffect(() => {
    if (fotos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const relogio = setInterval(
      () => setAtual((i) => (i + 1) % fotos.length),
      intervaloMs
    );
    return () => clearInterval(relogio);
  }, [fotos.length, intervaloMs]);

  if (!fotos.length) return null;

  return (
    <>
      {fotos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === atual ? alt : ""}
          // A primeira carrega junto com a página; as outras só quando o
          // navegador tiver folga. Três fotos por card numa grade de sete
          // seriam vinte e uma requisições disputando a largura de banda com
          // o que a pessoa está olhando.
          loading={i === 0 ? "eager" : "lazy"}
          aria-hidden={i !== atual}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === atual ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      ))}
    </>
  );
}
