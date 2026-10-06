import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { Suspense } from "react";
import { lerConfiguracoesPublicas } from "@/lib/dal/content";

const linksDeExperiencia = [
  { label: "Todas as jornadas", href: "/experiencias" },
  { label: "Destinos", href: "/destinos" },
  { label: "Montar meu roteiro", href: "/planejar" },
  { label: "Para Facilitadores", href: "/para-facilitadores" },
];

/**
 * O registro só aparece quando o número real foi preenchido no painel.
 * Carregado em Suspense para não bloquear o cabeçalho e o conteúdo público.
 */
async function RegistroCadastur() {
  const configuracoes = await lerConfiguracoesPublicas();
  const registro = configuracoes["empresa.cadastur"];
  if (typeof registro !== "string" || !registro.trim()) return null;
  return <li className="text-xs text-text-muted">CADASTUR: {registro.trim()}</li>;
}

function GoogleRatingBadge() {
  const pontos =
    "100.0,7.0 110.7,14.7 123.0,10.0 131.4,20.2 144.5,18.9 149.9,30.9 162.9,33.1 165.1,46.1 177.1,51.5 175.8,64.6 186.0,73.0 181.3,85.3 189.0,96.0 181.3,106.7 186.0,119.0 175.8,127.4 177.1,140.5 165.1,145.9 162.9,158.9 149.9,161.1 144.5,173.1 131.4,171.8 123.0,182.0 110.7,177.3 100.0,185.0 89.3,177.3 77.0,182.0 68.6,171.8 55.5,173.1 50.1,161.1 37.1,158.9 34.9,145.9 22.9,140.5 24.2,127.4 14.0,119.0 18.7,106.7 11.0,96.0 18.7,85.3 14.0,73.0 24.2,64.6 22.9,51.5 34.9,46.1 37.1,33.1 50.1,30.9 55.5,18.9 68.6,20.2 77.0,10.0 89.3,14.7";

  return (
    <svg
      viewBox="0 0 200 192"
      role="img"
      aria-label="Nota máxima no Google: 5 de 5"
      className="mt-6 h-auto w-[104px]"
    >
      <defs>
        <linearGradient id="googleBadgeGold" x1="20" y1="20" x2="180" y2="172" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE77A" />
          <stop offset="0.42" stopColor="#E5B83D" />
          <stop offset="0.72" stopColor="#B97910" />
          <stop offset="1" stopColor="#FFD84A" />
        </linearGradient>
        <mask id="googleBadgeRing">
          <rect width="200" height="192" fill="black" />
          <polygon points={pontos} fill="white" />
          <circle cx="100" cy="96" r="70" fill="black" />
        </mask>
      </defs>

      <polygon points={pontos} fill="url(#googleBadgeGold)" mask="url(#googleBadgeRing)" />

      <g fill="#F7C928">
        <text x="100" y="39" textAnchor="middle" fontSize="23">★</text>
        <text x="66" y="47" textAnchor="middle" fontSize="13">★</text>
        <text x="82" y="42" textAnchor="middle" fontSize="17">★</text>
        <text x="118" y="42" textAnchor="middle" fontSize="17">★</text>
        <text x="134" y="47" textAnchor="middle" fontSize="13">★</text>
      </g>

      <text x="100" y="69" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2A201B">
        Nota máxima no
      </text>

      <g fontSize="30" fontWeight="700" fontFamily="Arial, sans-serif">
        <text x="47" y="103" fill="#4285F4">G</text>
        <text x="71" y="103" fill="#EA4335">o</text>
        <text x="89" y="103" fill="#FBBC05">o</text>
        <text x="108" y="103" fill="#4285F4">g</text>
        <text x="128" y="103" fill="#34A853">l</text>
        <text x="139" y="103" fill="#EA4335">e</text>
      </g>

      <text
        x="100"
        y="139"
        textAnchor="middle"
        fontSize="38"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        fill="#B97A13"
      >
        5/5
      </text>

      <g fill="#F7C928">
        <text x="100" y="171" textAnchor="middle" fontSize="22">★</text>
        <text x="72" y="168" textAnchor="middle" fontSize="14">★</text>
        <text x="85" y="173" textAnchor="middle" fontSize="12">★</text>
        <text x="115" y="173" textAnchor="middle" fontSize="12">★</text>
        <text x="128" y="168" textAnchor="middle" fontSize="14">★</text>
      </g>
    </svg>
  );
}

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
              className="inline-flex items-center"
              aria-label="NeoSenses, início"
            >
              <Image
                src="/images/neosenses-logo-claro.svg"
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

            <GoogleRatingBadge />
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
              <li className="text-xs text-text-muted">CNPJ: 60.937.280/0001-90</li>
              <Suspense fallback={null}><RegistroCadastur /></Suspense>
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
