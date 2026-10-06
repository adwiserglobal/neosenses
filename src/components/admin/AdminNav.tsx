"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Compass,
  LayoutDashboard,
  MapPinned,
  MessageSquareQuote,
  Settings,
  Users,
} from "lucide-react";

const MENU = [
  { href: "/admin", rotulo: "Visão geral", icone: LayoutDashboard },
  { href: "/admin/experiencias", rotulo: "Experiências", icone: Compass },
  { href: "/admin/blog", rotulo: "Blog", icone: BookOpenText },
  { href: "/admin/destinos", rotulo: "Destinos", icone: MapPinned },
  { href: "/admin/depoimentos", rotulo: "Depoimentos", icone: MessageSquareQuote },
  { href: "/admin/leads", rotulo: "Leads", icone: Users },
  { href: "/admin/configuracoes", rotulo: "Configurações", icone: Settings },
];

function estaAtivo(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="relative overflow-hidden bg-[#32103d] text-white lg:sticky lg:top-0 lg:h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_18%_8%,rgba(224,169,46,0.22),transparent_27%),radial-gradient(circle_at_90%_86%,rgba(126,34,139,0.5),transparent_34%)]"
      />

      <div className="relative flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5 lg:px-7 lg:py-8">
          <Link href="/admin" className="inline-flex items-baseline gap-2">
            <span className="font-heading text-2xl tracking-tight">NeoSenses</span>
            <span className="rounded-full border border-[#e0a92e]/35 bg-[#e0a92e]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f1c966]">
              Admin
            </span>
          </Link>
          <p className="mt-2 hidden max-w-[210px] text-xs leading-relaxed text-white/55 lg:block">
            Operação de conteúdo, jornadas e relacionamento.
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-4 lg:py-6">
          {MENU.map(({ href, rotulo, icone: Icone }) => {
            const ativo = estaAtivo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all lg:w-full ${
                  ativo
                    ? "bg-white text-[#3a1045] shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
                    : "text-white/68 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    ativo
                      ? "bg-[#f4e7bd] text-[#7b5710]"
                      : "bg-white/7 text-white/70 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <Icone className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{rotulo}</span>
                {ativo && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#d9a324] lg:block" />}
              </Link>
            );
          })}
        </nav>

        <div className="relative hidden border-t border-white/10 p-5 lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f1c966]">
              Painel interno
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              Alterações feitas aqui refletem a operação e o conteúdo público da NeoSenses.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
