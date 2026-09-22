"use client";

/**
 * Renderiza a resposta do Concierge transformando em link o que é da casa.
 *
 * A decisão de o que vira link mora em `lib/ai/links.ts`, testada sem rede.
 * Aqui só se desenha o resultado.
 *
 * Link externo (WhatsApp) abre em nova aba: a pessoa está no meio de uma
 * conversa, e trocar a página por baixo dela é perder o que já foi dito.
 * Interno navega na mesma aba, que é o comportamento esperado de um link do
 * próprio site.
 */

import Link from "next/link";
import { partirEmLinks } from "@/lib/ai/links";

interface Props {
  texto: string;
  /** Número aceito no wa.me. Outro número não vira link. */
  numeroWhatsApp?: string;
}

export function TextoComLinks({ texto, numeroWhatsApp }: Props) {
  const trechos = partirEmLinks(texto, { numeroWhatsApp });

  return (
    <>
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
    </>
  );
}
