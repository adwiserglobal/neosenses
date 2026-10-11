import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const faixas = [
  {
    titulo: "Caminho de Maria Madalena",
    texto: "Embarque em uma jornada transcendental pelas trilhas sagradas do Caminho de Maria Madalena, onde cada passo é uma dança entre o divino e o terreno. Descubra os segredos ancestrais que sussurram nas brisas das paisagens místicas. Neste roteiro de transformação espiritual, o Caminho de Maria Madalena tornam-se entrada para uma imersão interior profunda. Desperte seu espírito, abrace a jornada, e permita que os sentimentos despertos guiem seu caminho para a autodescoberta.",
    imagem: "/images/destinations/france.png",
    destino: "/experiencias/caminho-de-maria-madalena",
    fundo: "bg-[#260408]",
    gradiente: "bg-gradient-to-r from-[#180306]/98 via-[#39060d]/85 to-transparent",
    alinhamento: "esquerda",
    cta: "text-[#f2f794]",
  },
  {
    titulo: "Jornada Espiritual Tailândia",
    texto: "Viajar para a Tailândia significa vivenciar os sentimentos de felicidade e tranquilidade em seus estados mais puros. A Terra dos Sorrisos, como o país é conhecido, é guiada de acordo com o lema budista: sanuk sabai e saduak (seja feliz, fique tranquilo e contente-se com aquilo que a vida te oferece).",
    imagem: "/images/destinations/thailand.png",
    destino: "/experiencias/tailandia-iluminada",
    fundo: "bg-[#825020]",
    gradiente: "bg-gradient-to-r from-[#a46a25]/95 via-[#75461b]/82 to-[#211207]/38",
    alinhamento: "esquerda",
    cta: "text-[#f2f794]",
  },
  {
    titulo: "Despertar Na Floresta",
    texto: "Como a palavra afirma, espiritualidade é viver segundo o espírito. Quando no homem aparece a pergunta do sentido, quando o homem querendo conhecer a si mesmo começa a explorar aquilo que é nele interior, quando começa a observar o mundo, a escutar, a pensar, a meditar, a interpretar e, de consequência, a escolher, a decidir, então inicia nele a sua busca pela vida espiritual.",
    imagem: "/images/b2b/amazonas-floresta-aerea.jpg",
    destino: "/experiencias",
    fundo: "bg-[#10291a]",
    gradiente: "bg-gradient-to-r from-[#061a12]/95 via-[#0a2017]/78 to-transparent",
    alinhamento: "esquerda",
    cta: "text-[#ff8e9a]",
  },
] as const;

export function TematicosHome() {
  return (
    <section aria-label="Jornadas temáticas" className="bg-[#f2e8d7] py-8 md:py-12">
      <div className="mx-auto w-[min(96%,1640px)]">
        <div className="overflow-hidden rounded-[18px] shadow-[0_15px_55px_rgba(48,27,18,0.12)]">
          {faixas.map((faixa) => (
            <Link
              key={faixa.titulo}
              href={faixa.destino}
              className={`group relative isolate flex min-h-[400px] overflow-hidden ${faixa.fundo} md:min-h-[400px]`}
            >
              <Image
                src={faixa.imagem}
                alt=""
                fill
                sizes="(min-width: 1024px) 1400px, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <div aria-hidden="true" className={`absolute inset-0 ${faixa.gradiente}`} />
              <div
                className={`relative z-10 flex w-full items-center px-6 py-12 sm:px-9 md:px-14 lg:px-[7%] ${faixa.alinhamento === "direita" ? "md:justify-start" : "md:justify-start"}`}
              >
                <div className="max-w-[650px] text-left">
                  <h2 className="font-heading text-[clamp(2.5rem,4.1vw,4.1rem)] leading-[1.04] text-white">
                    {faixa.titulo}
                  </h2>
                  <p className="mt-5 text-base leading-[1.7] text-white/95 md:text-lg">
                    {faixa.texto}
                  </p>
                  <span className={`mt-7 inline-flex items-center gap-2 font-heading text-[clamp(1.6rem,2.5vw,2.4rem)] leading-none transition-transform duration-300 group-hover:translate-x-2 ${faixa.cta}`}>
                    <ArrowRight className="h-[0.85em] w-[0.85em]" strokeWidth={2.8} aria-hidden="true" />
                    Conheça
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
