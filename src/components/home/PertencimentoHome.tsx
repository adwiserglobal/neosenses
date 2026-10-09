import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { linkWhatsApp } from "@/lib/utils";

/**
 * Um convite humano entre o manifesto da marca e o catálogo.
 * Fotos já presentes no projeto; sem depoimentos ou estatísticas inventados.
 */
export function PertencimentoHome() {
  return (
    <section className="relative overflow-hidden bg-[#50125f] py-20 text-white md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_0%_10%,rgba(251,198,90,0.19),transparent_26%),radial-gradient(circle_at_100%_90%,rgba(162,73,161,0.42),transparent_32%)]"
      />

      <div className="container-wide relative grid items-center gap-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-20">
        <div className="order-2 lg:order-1">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#eed19a]">
            Um convite para fazer parte
          </p>
          <h2 className="max-w-[650px] font-heading text-[clamp(2.4rem,4vw,4.25rem)] leading-[1.12] tracking-[-0.02em]">
            Você merece viver histórias <span className="italic text-[#f1d18e]">nas quais se reconhece.</span>
          </h2>
          <p className="mt-7 max-w-[59ch] text-base leading-[1.9] text-white/85 md:text-lg">
            Talvez você esteja buscando uma pausa. Talvez novos olhares, novas
            amizades ou apenas a coragem de fazer algo por si. A beleza de uma
            jornada não está só no destino, mas nos encontros, nas descobertas
            e no que cada pessoa traz para compartilhar.
          </p>

          <div className="mt-9 grid gap-4 border-y border-white/18 py-6 sm:grid-cols-3">
            {[
              ["01", "Mais presença"],
              ["02", "Novos encontros"],
              ["03", "Memórias que ficam"],
            ].map(([numero, titulo]) => (
              <div key={numero} className="flex items-baseline gap-2">
                <span className="text-[11px] font-semibold text-[#f1d18e]">{numero}</span>
                <span className="font-heading text-[17px] text-white/95">{titulo}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/experiencias"
              className="inline-flex items-center gap-2 rounded-full bg-[#edc36f] px-7 py-3.5 text-sm font-semibold text-[#37143d] transition hover:bg-[#ffe1a0]"
            >
              Encontrar minha próxima jornada
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={linkWhatsApp("Olá! Quero saber mais sobre as jornadas da NeoSenses e encontrar uma experiência que combine comigo.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Conversar com a equipe
            </a>
          </div>
        </div>

        <div className="relative order-1 mx-auto grid h-[370px] w-full max-w-[640px] grid-cols-[1.15fr_0.85fr] gap-3 sm:h-[500px] lg:order-2 lg:h-[575px]">
          <div className="relative overflow-hidden rounded-[140px_30px_30px_30px] border border-white/15 shadow-[0_24px_65px_rgba(10,5,14,0.28)]">
            <Image
              src="/images/b2b/peru-cerimonia.jpg"
              alt="Vivência cerimonial no Peru"
              fill
              sizes="(min-width: 1024px) 30vw, 65vw"
              className="object-cover"
            />
          </div>
          <div className="grid grid-rows-[1fr_1.1fr] gap-3">
            <div className="relative overflow-hidden rounded-[30px_90px_30px_30px] border border-white/15">
              <Image
                src="/images/b2b/marrocos-gnaoua.jpg"
                alt="Expressão cultural e musical do Marrocos"
                fill
                sizes="(min-width: 1024px) 22vw, 35vw"
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[30px_30px_100px_30px] border border-white/15">
              <Image
                src="/images/b2b/marrocos-entrega.jpg"
                alt="Momentos de convivência e descoberta em Marrocos"
                fill
                sizes="(min-width: 1024px) 22vw, 35vw"
                className="object-cover"
              />
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-5 -left-4 h-28 w-28 rounded-full border border-[#f5d494]/60 sm:-left-8"
          />
        </div>
      </div>
    </section>
  );
}
