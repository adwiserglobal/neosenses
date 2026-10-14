/**
 * Plano B de uma experiência espelhada: a página original não respondeu, então
 * mostramos o que guardamos na importação, dentro do layout normal do site
 * (com menu e rodapé), e mantemos a conversa a um clique.
 */

import Image from "next/image";
import { podeOtimizar, linkWhatsApp } from "@/lib/utils";
import type { CopiaDaPagina } from "@/lib/importacao/copia";

export function CopiaDaExperiencia({
  titulo,
  resumo,
  capa,
  copia,
}: {
  titulo: string;
  resumo?: string;
  capa?: string | null;
  copia: CopiaDaPagina | null;
}) {
  const fotos = copia?.fotos ?? [];
  const imagemPrincipal = fotos[0] ?? capa ?? null;
  const galeria = fotos.slice(1, 7);
  const paragrafos = (copia?.texto ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30)
    .slice(0, 40);

  return (
    <article className="bg-[#f5eddf] pb-20 pt-32 md:pb-28 md:pt-40">
      <div className="container-content">
        <h1 className="font-heading text-4xl leading-tight text-primary-700 md:text-5xl">{titulo}</h1>
        {resumo && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">{resumo}</p>}

        {imagemPrincipal && (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-primary-100">
            <Image
              src={imagemPrincipal}
              alt=""
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              unoptimized={!podeOtimizar(imagemPrincipal)}
              className="object-cover"
              priority
            />
          </div>
        )}

        {paragrafos.length > 0 && (
          <div className="mt-10 max-w-3xl space-y-4 text-base leading-[1.8] text-text-primary">
            {paragrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {galeria.length > 0 && (
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {galeria.map((src) => (
              <li key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-primary-100">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 320px, 50vw"
                  unoptimized={!podeOtimizar(src)}
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 rounded-2xl border border-secondary-300/40 bg-[#fffaf2] p-7 md:p-9">
          <p className="font-heading text-2xl text-primary-700">Quer saber mais sobre esta jornada?</p>
          <p className="mt-2 max-w-xl text-text-muted">
            Nossa equipe conta os detalhes, as datas e como participar.
          </p>
          <a
            href={linkWhatsApp(`Olá! Quero saber mais sobre: ${titulo}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario mt-6"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
