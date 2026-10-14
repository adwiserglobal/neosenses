/**
 * Faixa de fotos que corre sozinha, em laço contínuo.
 *
 * Só CSS: não depende de JavaScript, pausa quando o mouse está em cima e
 * fica parada (e rolável) para quem pediu menos movimento. A lista é
 * desenhada duas vezes para o laço fechar sem salto; a cópia fica escondida
 * dos leitores de tela.
 */

import Image from "next/image";

export interface FotoDaFaixa {
  src: string;
  alt: string;
}

function Fotos({ fotos, copia }: { fotos: FotoDaFaixa[]; copia?: boolean }) {
  return (
    <ul className="flex shrink-0 gap-4 pr-4" aria-hidden={copia || undefined}>
      {fotos.map((foto) => (
        <li
          key={foto.src}
          className="relative h-52 w-72 shrink-0 overflow-hidden rounded-2xl bg-primary-100 md:h-64 md:w-96"
        >
          <Image
            src={foto.src}
            alt={copia ? "" : foto.alt}
            fill
            sizes="(min-width: 768px) 384px, 288px"
            className="object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

export function FaixaDeFotos({ fotos }: { fotos: FotoDaFaixa[] }) {
  return (
    <div className="faixa-externa">
      <div className="faixa-rolante">
        <Fotos fotos={fotos} />
        <Fotos fotos={fotos} copia />
      </div>
    </div>
  );
}
