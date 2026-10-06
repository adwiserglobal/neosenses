"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExperienceCard } from "@/components/ui/Cards";
import type { ExperienceWithRelations } from "@/types/models";

interface Props {
  experiencias: ExperienceWithRelations[];
}

export function JornadasCarousel({ experiencias }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(experiencias.length > 1);

  function atualizarBotoes() {
    const el = trilho.current;
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 8);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  useEffect(() => {
    atualizarBotoes();
    const el = trilho.current;
    if (!el) return;

    const observar = new ResizeObserver(atualizarBotoes);
    observar.observe(el);
    window.addEventListener("resize", atualizarBotoes);
    return () => {
      observar.disconnect();
      window.removeEventListener("resize", atualizarBotoes);
    };
  }, [experiencias.length]);

  function mover(direcao: -1 | 1) {
    const el = trilho.current;
    if (!el) return;

    // Avança aproximadamente uma "tela" de cards, como carrosséis de streaming.
    el.scrollBy({
      left: direcao * Math.max(300, el.clientWidth * 0.86),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      {experiencias.length > 1 && (
        <div className="mb-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={!podeVoltar}
            aria-label="Ver jornadas anteriores"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary-700 shadow-sm transition hover:border-secondary-400 hover:text-secondary-600 disabled:cursor-default disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={!podeAvancar}
            aria-label="Ver próximas jornadas"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary-700 shadow-sm transition hover:border-secondary-400 hover:text-secondary-600 disabled:cursor-default disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div
        ref={trilho}
        onScroll={atualizarBotoes}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6"
      >
        {experiencias.map((exp, i) => (
          <div
            key={exp.id}
            className="w-[86%] shrink-0 snap-start sm:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)]"
          >
            <ExperienceCard experience={exp} index={Math.min(i, 3)} />
          </div>
        ))}
      </div>

      {experiencias.length > 1 && (
        <p className="mt-2 text-center text-xs text-text-muted md:hidden">
          Deslize para o lado para ver outras jornadas
        </p>
      )}
    </div>
  );
}
