/**
 * Área restrita.
 *
 * A verificação de sessão acontece aqui, no servidor, e vale para toda página
 * abaixo de /admin. O layout decide o papel; o proxy corta cedo quem não tem
 * sessão nenhuma.
 */

import Link from "next/link";
import { exigirPapel, sair } from "@/lib/actions/auth";

export const metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MENU = [
  { href: "/admin", rotulo: "Visão geral" },
  { href: "/admin/experiencias", rotulo: "Experiências" },
  { href: "/admin/blog", rotulo: "Blog" },
  { href: "/admin/destinos", rotulo: "Destinos" },
  { href: "/admin/depoimentos", rotulo: "Depoimentos" },
  { href: "/admin/leads", rotulo: "Leads" },
  { href: "/admin/configuracoes", rotulo: "Configurações" },
  { href: "/admin/supabase", rotulo: "Supabase" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPapel(["admin", "editor"]);

  return (
    <div className="min-h-screen bg-warm-gray/20">
      <header className="border-b border-border bg-surface">
        <div className="container-wide flex flex-wrap items-center gap-4 py-4">
          <Link href="/admin" className="font-heading text-lg text-primary-700">
            NeoSenses <span className="text-text-muted">· Painel</span>
          </Link>

          <nav className="flex flex-wrap gap-1">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition hover:bg-warm-gray hover:text-primary-700"
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-text-muted underline underline-offset-4 hover:text-primary-700"
            >
              Ver o site
            </Link>
            <span className="text-text-muted">
              {perfil.full_name || perfil.email}
              <span className="ml-2 rounded-full bg-warm-gray px-2 py-0.5 text-xs uppercase tracking-wide">
                {perfil.role}
              </span>
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="text-sm text-text-muted underline underline-offset-4 hover:text-primary-700"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-wide py-8">{children}</main>
    </div>
  );
}
