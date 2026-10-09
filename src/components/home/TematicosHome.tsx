import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { migratedExperienceBySlug } from "@/content/migratedExperiences";

/**
 * Faixas temáticas editoriais que conduzem a experiências reais.
 * Todas as URLs apontam para páginas existentes no projeto.
 */
const temas = [
  {
    slug: "caminho-de-maria-madalena",
    chapeu: "Peregrinação e sagrado feminino",
    titulo: "O Caminho de Maria Madalena",
    texto: "Entre vilas da Provença, natureza e caminhos de peregrinação, uma jornada de história, espiritualidade e encontro consigo.",
    sobreposicao: "from-[#190206]/95 via-[#500a1a]/82 to-[#5c1327]/30",
    alinhamento: "direita",
  },
  {
    slug: "chapada-dos-veadeiros",
    chapeu: "Retiro e reconexão",
    titulo: "Desvendando Shakti",
    texto: "Na Chapada dos Veadeiros, uma imersão dedicada à intuição, ao corpo e ao autoconhecimento em contato com a natureza.",
    sobreposicao: "from-[#14201a]/92 via-[#32503d]/75 to-[#354f31]/20",
    alinhamento: "esquerda",
  },
  {
    slug: "india-milenar",
    chapeu: "Tradição e espiritualidade",
    titulo: "Uma Peregrinação pela Índia",
    texto: "Meditação, culturas milenares e descobertas que convidam a viver uma viagem com mais presença e profundidade.",
    sobreposicao: "from-[#211329]/95 via-[#5a3167]/75 to-[#7f5d36]/20",
    alinhamento: "direita",
  },
] as const;

export function TematicosHome() {
  return (
    <section aria-labelledby="tematicos-titulo" className="bg-[#efe4d0] py-16 md:py-20">
      <div className="container-wide">
        <header className="mb-9 max-w-[860px] md:mb-11">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-[#8a641b]">
            Experiências em destaque
          </p>
          <h2 id="tematicos-titulo" className="font-heading text-4xl leading-tight text-primary-700 md:text-[3.25rem]">
            Toda jornada tem uma história.
            <span className="block italic text-[#a26f20]">Qual delas chama por você?</span>
          </h2>
          <p className="mt-4 max-w-[68ch] text-base leading-[1.75] text-[#645348] md:text-lg">
            Conheça algumas das vivências da NeoSenses. Cada caminho é um convite para descobrir
            novos lugares e diferentes maneiras de sentir o mundo.
          </p>
        </header>

        <div className="space-y-5 md:space-y-6">
          {temas.map((tema, indice) => {
            const experiencia = migratedExperienceBySlug[tema.slug];
            if (!experiencia) return null;
            const textoDireita = tema.alinhamento === "direita";

            return (
              <Link
                key={tema.slug}
                href={`/experiencias/${tema.slug}`}
                className="group relative isolate block min-h-[440px] overflow-hidden rounded-[22px] bg-[#251322] shadow-[0_15px_45px_rgba(42,19,29,0.13)] transition-shadow duration-300 hover:shadow-[0_25px_60px_rgba(42,19,29,0.21)] md:min-h-[395px]"
                aria-label={`Conhecer a experiência ${experiencia.title}`}
              >
                <Image
                  src={experiencia.hero}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 1280px, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.045]"
                />
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 bg-gradient-to-t from-[#190f15]/95 via-[#22151d]/55 to-[#190f15]/20 md:bg-gradient-to-r ${textoDireita ? "md:rotate-180" : ""} ${tema.sobreposicao}`}
                />
                <div
                  className={`relative z-10 flex min-h-[440px] items-end p-7 sm:p-9 md:min-h-[395px] md:items-center md:p-12 xl:p-16 ${textoDireita ? "md:justify-end" : "md:justify-start"}`}
                >
                  <div className="w-full max-w-[650px]">
                    <span className="inline-block rounded-full border border-white/40 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                      {tema.chapeu}
                    </span>
                    <h3 className="mt-5 font-heading text-[clamp(2.3rem,3.6vw,4.2rem)] leading-[1.05] text-white">
                      {tema.titulo}
                    </h3>
                    <p className="mt-5 max-w-[54ch] text-base leading-[1.7] text-white/90 md:text-lg">
                      {tema.texto}
                    </p>
                    <span className="mt-7 inline-flex items-center gap-3 font-heading text-2xl font-medium text-[#f5dc94] md:text-3xl">
                      Conheça esta jornada
                      <ArrowUpRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                    </span>
                  </div>
                </div>
                <span className="pointer-events-none absolute bottom-5 right-6 z-10 text-xs font-semibold tracking-[0.1em] text-white/65">
                  0{indice + 1} / 03
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
