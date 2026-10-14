/**
 * Depoimentos reais, aprovados no painel interno.
 * A seção inteira só é montada quando há pelo menos um registro publicado.
 */
import Image from "next/image";
import { podeOtimizar, t } from "@/lib/utils";
import type { I18nField, Testimonial } from "@/types/models";

export function DepoimentosHome({ depoimentos }: { depoimentos: Testimonial[] }) {
  if (depoimentos.length === 0) return null;

  const largura =
    depoimentos.length === 1
      ? "mx-auto max-w-[620px] grid-cols-1"
      : depoimentos.length === 2
        ? "mx-auto max-w-[1030px] grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section aria-labelledby="titulo-depoimentos" className="relative isolate overflow-hidden bg-primary-800 py-24 md:py-32">
      {/* Degradê roxo da marca de ponta a ponta. Começa no tom da seção de
          facilitadores acima e fecha perto do roxo da chamada final, sem
          faixa clara entre elas. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#45204f_0%,#4c1262_35%,#5a0b73_70%,#40104f_100%)]" />
        <div className="absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-primary-400/25 blur-3xl" />
        <div className="absolute -left-24 bottom-16 h-[26rem] w-[26rem] rounded-full bg-secondary-300/15 blur-3xl" />
      </div>

      <div className="container-wide relative">
        <div className="mb-12 text-center md:mb-16">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-secondary-300/70" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-300">
              Experiências que deixam marcas
            </p>
            <span aria-hidden="true" className="h-px w-8 bg-secondary-300/70" />
          </div>
          <h2 id="titulo-depoimentos" className="mx-auto max-w-3xl font-heading text-3xl leading-tight text-warm-white md:text-5xl">
            Histórias de quem viveu <span className="italic text-secondary-300">um novo sentir</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-warm-white/80 md:text-base">
            Cada jornada tem uma história. Conheça as palavras de quem já compartilhou esse caminho.
          </p>
        </div>

        <ul className={`grid gap-6 lg:gap-8 ${largura}`}>
          {depoimentos.map((depoimento) => {
            const texto = t(depoimento.quote as I18nField, "pt");
            const nota = depoimento.rating ? Math.min(5, Math.max(1, Math.round(depoimento.rating))) : null;
            const inicial = depoimento.name.trim().charAt(0).toLocaleUpperCase("pt-BR");

            return (
              <li key={depoimento.id} className="relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/20 bg-white/[0.09] p-7 shadow-[0_18px_46px_rgba(10,2,16,0.35)] backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-secondary-300 before:via-secondary-200 before:to-primary-400 md:p-9">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span aria-hidden="true" className="font-heading text-6xl leading-[0.75] text-secondary-300">“</span>
                  {nota !== null && (
                    <span aria-label={`Avaliação: ${nota} de 5 estrelas`} className="text-sm tracking-[0.16em] text-secondary-300">
                      {"★".repeat(nota)}
                    </span>
                  )}
                </div>

                <blockquote className="flex-1 font-heading text-lg leading-[1.7] text-warm-white md:text-[19px]">
                  {texto}
                </blockquote>

                <div className="mt-9 flex items-center gap-3 border-t border-white/20 pt-6">
                  {depoimento.photo ? (
                    <Image
                      src={depoimento.photo}
                      alt={`Foto de ${depoimento.name}`}
                      width={48}
                      height={48}
                      sizes="48px"
                      unoptimized={!podeOtimizar(depoimento.photo)}
                      className="h-12 w-12 shrink-0 rounded-full border border-white/30 object-cover"
                    />
                  ) : (
                    <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-300 font-heading text-xl text-primary-900">
                      {inicial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-warm-white">{depoimento.name}</p>
                    {depoimento.location && (
                      <p className="mt-0.5 text-xs text-warm-white/70">{depoimento.location}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
