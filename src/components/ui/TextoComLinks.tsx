"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { partirEmLinks } from "@/lib/ai/links";

interface Props {
  texto: string;
  numeroWhatsApp?: string;
  /** Pode ser forçado por outro consumidor. No chat, a detecção é automática. */
  animar?: boolean;
}

/**
 * Evita repetir a animação quando o chat é fechado e aberto de novo. O texto
 * já lido volta imediatamente; apenas respostas novas são "digitadas".
 */
const respostasJaAnimadas = new Set<string>();

function limparMarkdownVisual(texto: string): string {
  return texto
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1");
}

export function TextoComLinks({ texto, numeroWhatsApp, animar }: Props) {
  const raiz = useRef<HTMLSpanElement>(null);
  const limpo = useMemo(() => limparMarkdownVisual(texto), [texto]);
  const palavras = useMemo(() => limpo.match(/\S+\s*/g) ?? (limpo ? [limpo] : []), [limpo]);
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(palavras.length);
  const [digitando, setDigitando] = useState(false);

  useEffect(() => {
    const classesDaBolha = raiz.current?.parentElement?.className ?? "";
    const ehMensagemDoUsuario = classesDaBolha.includes("bg-primary-700");
    const ehErro = classesDaBolha.includes("bg-amber-50");
    const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const deveAnimar = animar ?? (!ehMensagemDoUsuario && !ehErro);

    if (
      !deveAnimar ||
      reduzirMovimento ||
      palavras.length <= 1 ||
      respostasJaAnimadas.has(limpo)
    ) {
      setQuantidadeVisivel(palavras.length);
      setDigitando(false);
      return;
    }

    setQuantidadeVisivel(0);
    setDigitando(true);

    let indice = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const mostrarProxima = () => {
      indice += 1;
      setQuantidadeVisivel(indice);

      if (indice >= palavras.length) {
        setDigitando(false);
        respostasJaAnimadas.add(limpo);
        return;
      }

      const anterior = palavras[indice - 1] ?? "";
      // Pausas discretas em fim de frase deixam a leitura mais natural sem
      // transformar respostas maiores numa espera longa.
      const pausa = /[.!?…]\s*$/.test(anterior) ? 85 : 26;
      timer = setTimeout(mostrarProxima, pausa);
    };

    timer = setTimeout(mostrarProxima, 90);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [animar, limpo, palavras]);

  const textoVisivel = palavras.slice(0, quantidadeVisivel).join("");
  const trechos = partirEmLinks(textoVisivel, { numeroWhatsApp });

  return (
    <span ref={raiz}>
      {trechos.map((t, i) => {
        if (t.tipo === "texto") return <span key={i}>{t.valor}</span>;

        const estilo =
          "underline underline-offset-2 decoration-current/40 hover:decoration-current transition";

        if (t.externo) {
          return (
            <a
              key={i}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${estilo} font-medium`}
            >
              {t.valor}
            </a>
          );
        }

        return (
          <Link key={i} href={t.href} className={estilo}>
            {t.valor}
          </Link>
        );
      })}
      {digitando && (
        <span aria-hidden="true" className="ml-0.5 inline-block animate-pulse text-secondary-500">
          ▍
        </span>
      )}
    </span>
  );
}
