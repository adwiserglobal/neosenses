import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Newsletter } from "./Newsletter";

const linksDeExperiencia = [
  { label: "Todas as jornadas", href: "/experiencias" },
  { label: "Destinos", href: "/destinos" },
  { label: "Montar meu roteiro", href: "/planejar" },
  { label: "Para Facilitadores", href: "/para-facilitadores" },
];

/**
 * Rodapé deliberadamente estático: ele está presente em todas as páginas e
 * não deve segurar uma navegação inteira enquanto espera o banco. Conteúdo
 * dinâmico fica nas páginas que realmente precisam dele.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-warm-white">
      <div className="border-b border-border bg-warm-gray/50 py-12">
        <div className="container-wide flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <h3 className="font-heading text-xl text-primary-700">Receba nossas novidades</h3>
            <p className="mt-1 text-sm text-text-muted">Experiências exclusivas e inspirações para sua jornada.</p>
          </div>
          <Newsletter />
        </div>
      </div>

      <div className="container-wide py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              prefetch
              className="inline-flex items-center rounded-md bg-primary-800 px-3 py-2"
              aria-label="NeoSenses — início"
            >
              <Image
                src="/images/neosenses-logo.svg"
                alt="NeoSenses"
                width={200}
                height={25}
                className="h-[20px] w-auto"
              />
            </Link>
            <p className="mt-2 text-sm italic text-secondary-500">Um Novo Sentir</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-muted">
              Experiências transformadoras de viagem que elevam sua vibração e conectam com seu melhor.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="https://instagram.com/neosenses"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted transition-all hover:border-secondary-500 hover:text-secondary-500"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Experiências
            </h4>
            <ul className="space-y-3 text-sm">
              {linksDeExperiencia.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch
                    className="inline-block py-1 text-text-muted transition-colors hover:text-secondary-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Empresa
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Sobre Nós", href: "/sobre" },
                { label: "Blog", href: "/blog" },
                { label: "FAQ", href: "/contato/faq" },
                { label: "Privacidade", href: "/legal/privacidade" },
                { label: "Termos", href: "/legal/termos" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch
                    className="inline-block py-1 text-text-muted transition-colors hover:text-secondary-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Contato
            </h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                <a href="mailto:contato@neosenses.com.br" className="transition-colors hover:text-secondary-500">
                  contato@neosenses.com.br
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                <a href="tel:+5511947188319" className="transition-colors hover:text-secondary-500">
                  +55 11 94718-8319
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                <span>
                  Rua Alegre, 928 – Santa Paula<br />
                  São Caetano do Sul – SP<br />
                  09550-250
                </span>
              </li>
              <li className="pt-1 text-xs text-text-muted">Seg–Sáb 9:00–18:00</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-wide flex flex-col items-center justify-between gap-3 py-6 text-xs text-text-muted md:flex-row">
          <p>© {new Date().getFullYear()} NeoSenses. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/legal/privacidade" prefetch className="transition-colors hover:text-secondary-500">
              Política de Privacidade
            </Link>
            <Link href="/legal/termos" prefetch className="transition-colors hover:text-secondary-500">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
