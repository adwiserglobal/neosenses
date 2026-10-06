/**
 * Área restrita da NeoSenses.
 */

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { exigirPapel, sair } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPapel(["admin", "editor"]);

  return (
    <div className="min-h-screen bg-[#f5efe4] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <AdminNav />

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#dfd3c1] bg-[#fbf7ef]/95 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center gap-4 px-5 md:px-8 xl:px-10">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9b6f16]">
                NeoSenses Operations
              </p>
              <p className="mt-1 hidden text-sm text-[#715f54] sm:block">
                Gestão do site, conteúdo e relacionamento
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9cdbd] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#4a3c35] transition hover:border-[#b99745] hover:bg-white"
              >
                <span className="hidden sm:inline">Ver o site</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>

              <div className="hidden items-center gap-3 rounded-full border border-[#e0d4c4] bg-white/55 py-1.5 pl-2 pr-3 md:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4d145b] text-xs font-semibold uppercase text-white">
                  {(perfil.full_name || perfil.email).slice(0, 1)}
                </span>
                <span className="max-w-[180px] truncate text-xs font-medium text-[#594a42]">
                  {perfil.full_name || perfil.email}
                </span>
                <span className="rounded-full bg-[#eadfc6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7e5d19]">
                  {perfil.role}
                </span>
              </div>

              <form action={sair}>
                <button
                  type="submit"
                  aria-label="Sair do painel"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#78665c] transition hover:bg-[#efe4d5] hover:text-[#4d145b]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="relative overflow-hidden px-5 py-7 md:px-8 md:py-9 xl:px-10 xl:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_96%_2%,rgba(117,31,130,0.08),transparent_28%),radial-gradient(circle_at_8%_84%,rgba(217,163,36,0.08),transparent_26%)]"
          />
          <div className="relative mx-auto max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
