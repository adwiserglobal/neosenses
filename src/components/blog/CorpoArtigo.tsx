import Image from "next/image";
import { blocosDoArtigo } from "@/lib/blog/formatacao";
import { podeOtimizar } from "@/lib/utils";

function Enfase({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return <>{partes.map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**")
      ? <strong key={i} className="font-semibold text-primary-800">{parte.slice(2, -2)}</strong>
      : <span key={i}>{parte}</span>
  )}</>;
}

/** Não interpreta HTML do usuário: somente texto React e imagens de URL validada. */
export function CorpoArtigo({ conteudo }: { conteudo: string }) {
  return (
    <div className="space-y-7">
      {blocosDoArtigo(conteudo).map((bloco, i) => {
        switch (bloco.tipo) {
          case "subtitulo":
            return bloco.nivel === 3
              ? <h3 key={i} className="pt-3 font-heading text-2xl leading-tight text-primary-700">{bloco.texto}</h3>
              : <h2 key={i} className="pt-6 font-heading text-3xl leading-tight text-primary-700 md:text-4xl">{bloco.texto}</h2>;
          case "paragrafo":
            return <p key={i} className="whitespace-pre-line text-[16px] leading-[1.95] text-text-primary md:text-[17px]"><Enfase texto={bloco.texto} /></p>;
          case "citacao":
            return <blockquote key={i} className="border-l-[3px] border-secondary-300 bg-secondary-50/40 py-5 pl-6 pr-5 font-heading text-xl italic leading-relaxed text-primary-700">{bloco.texto}</blockquote>;
          case "lista":
            return <ul key={i} className="list-disc space-y-3 pl-6 text-[16px] leading-[1.85] marker:text-secondary-400 md:text-[17px]">
              {bloco.itens.map((item, j) => <li key={j}><Enfase texto={item} /></li>)}
            </ul>;
          case "imagem":
            return <figure key={i} className="py-5">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-warm-gray">
                <Image src={bloco.url} alt={bloco.alt} fill sizes="(min-width: 1024px) 800px, 100vw" unoptimized={!podeOtimizar(bloco.url)} className="object-cover" />
              </div>
              {bloco.alt && <figcaption className="mt-3 text-center text-xs text-text-muted">{bloco.alt}</figcaption>}
            </figure>;
        }
      })}
    </div>
  );
}
