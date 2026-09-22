/**
 * Área restrita.
 *
 * A verificação de sessão acontece aqui, no servidor, e vale para toda página
 * abaixo de /admin — inclusive as que ainda serão criadas. Deixar cada página
 * se proteger sozinha é como uma rota nova nasce aberta sem ninguém notar.
 *
 * O `middleware` também redireciona quem não tem sessão, mas ele não consulta
 * o papel. As duas camadas são propositais: middleware corta cedo, o layout
 * decide de fato.
 */

import Link from "next/link";
import { exigirPapel, sair } from "@/lib/actions/auth";

export const metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

// Sessão precisa ser lida a cada requisição; cache aqui serviria página de
// admin para quem já saiu.
export const dynamic = "force-dynamic";

const MENU = [
  { href: "/admin", rotulo: "Visão geral" },
  { href: "/admin/experiencias", rotulo: "Experiências" },
  { href: "/admin/blog", rotulo: "Blog" },
  { href: "/admin/destinos", rotulo: "Destinos" },
  { href: "/admin/depoimentos", rotulo: "Depoimentos" },
  { href: "/admin/leads", rotulo: "Leads" },
  { href: "/admin/configuracoes", rotulo: "Configurações" },
];

// `/admin/supabase` saiu do menu: é diagnóstico de infraestrutura, não
// trabalho do dia a dia de quem cadastra conteúdo. A ROTA continua de pé —
// é ela que diz o que falta configurar quando algo não grava —, só deixou
// de ocupar uma linha do menu. O atalho está no rodapé da visão geral.

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await exigirPapel(["admin", "editor"]);

  return (
    <div className="min-h-screen bg-warm-gray/20">
      <header className="border-b border-border bg-surface">
        <div className="container-wide flex flex-wrap items-center gap-4 py-4">
          <Link href="/admin" className="font-heading text-lg text-primary-700">
            NeoSenses <span className="text-text-muted">· Painel</span>
          </Link>

          <nav className="flex gap-1">
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
            {/* Caminho de volta ao site. Antes o cabeçalho público aparecia
                aqui por cima do painel e servia de saída por acidente; agora
                que ele não vem mais, a saída precisa ser explícita. */}
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
              <button type="submit" className="text-sm text-text-muted underline underline-offset-4 hover:text-primary-700">
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
