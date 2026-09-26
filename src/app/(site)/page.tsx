/**
 * Home.
 *
 * Server Component: precisa ler o catálogo para mostrar as jornadas em
 * destaque. As partes animadas ficam em components/home/Hero, que roda no
 * navegador.
 */

import Link from "next/link";
import { listarDestaques } from "@/lib/dal/experiences";
import { listarDepoimentos } from "@/lib/dal/content";
import { Hero, Pilares } from "@/components/home/Hero";
import { ConviteAoFacilitador } from "@/components/templates/funil";
import { ExperienceCard } from "@/components/ui/Cards";
import { linkWhatsApp, t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

// A home declara o próprio canonical. Estava no layout raiz, de onde toda
// rota que não redefinisse o herdava — e quatro páginas acabaram anunciando
// ser cópia da home, inclusive /contato, a única com endereço e telefone.
export const metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

export default async function HomePage() {
  const [destaques, depoimentos] = await Promise.all([listarDestaques(3), listarDepoimentos(3)]);

  return (
    <>
      <Hero />
      <Pilares />

      {/* Jornadas em destaque — some quando não há nada publicado, em vez de
          mostrar uma grade vazia. */}
      {destaques.length > 0 && (
        <section className="bg-warm-gray/30 py-24 md:py-32">
          <div className="container-wide">
            <div className="mb-12 text-center">
              <p className="mx-auto mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">
                Próximas Jornadas
              </p>
              <h2 className="mx-auto max-w-2xl font-heading text-3xl text-primary-700 md:text-4xl">
                Experiências abertas neste momento
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {destaques.map((exp, i) => (
                <ExperienceCard key={exp.id} experience={exp} index={i} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/experiencias"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-8 py-4 text-sm font-semibold text-primary-700 transition-all hover:border-secondary-500 hover:text-secondary-500"
              >
                Ver todas as experiências
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Passo 2.4 do documento: a chamada B2B na home.
          Fica depois das jornadas e antes dos depoimentos — quem conduz
          grupo precisa ver o catálogo primeiro para entender o que a
          NeoSenses opera, e só então o convite faz sentido. */}
      <ConviteAoFacilitador />

      {depoimentos.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container-wide">
            <div className="mb-12 text-center">
              <p className="mx-auto mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">
                Quem Já Foi
              </p>
              <h2 className="mx-auto max-w-2xl font-heading text-3xl text-primary-700 md:text-4xl">
                Histórias de quem viajou com a gente
              </h2>
            </div>

            <ul className="grid gap-8 md:grid-cols-3">
              {depoimentos.map((d) => (
                <li key={d.id} className="rounded-xl border border-border bg-surface p-8">
                  <blockquote className="italic leading-relaxed text-text-primary">
                    “{t(d.quote as I18nField, "pt")}”
                  </blockquote>
                  <p className="mt-4 text-sm font-medium text-primary-700">{d.name}</p>
                  {d.location && <p className="text-xs text-text-muted">{d.location}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-gradient-dark py-24 md:py-32">
        <div className="container-wide text-center">
          <h2 className="mx-auto mb-6 max-w-2xl font-heading text-3xl text-warm-white md:text-4xl">
            Pronto para um Novo Sentir?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-warm-white/70">
            Converse com nossos especialistas e descubra a experiência ideal para sua jornada.
          </p>
          <a
            href={linkWhatsApp("Olá! Vim pelo site e quero conhecer as jornadas da NeoSenses.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-lg bg-[var(--color-whatsapp)] px-8 py-4 text-sm font-semibold text-[#0b2e18] shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Fale no WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
