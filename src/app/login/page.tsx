"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { entrar } from "@/lib/actions/auth";

/**
 * O formulário lê a query string (`redirect` e `erro`), e `useSearchParams`
 * obriga a um limite de Suspense: sem ele o build de produção falha ao
 * pré-renderizar esta página. Em desenvolvimento o erro não aparece — só na
 * hora de publicar.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<TelaDeCarregamento />}>
      <FormularioLogin />
    </Suspense>
  );
}

function TelaDeCarregamento() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-white">
      <div className="text-center">
        <h1 className="mb-2 font-heading text-3xl text-primary-700">NeoSenses</h1>
        <p className="text-sm italic text-text-muted">Carregando…</p>
      </div>
    </main>
  );
}

function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();

  // Motivo da recusa vindo do layout do /admin, para a pessoa saber por que
  // voltou para cá em vez de só ver o formulário de novo.
  const motivo = params.get("erro");
  const avisoInicial =
    motivo === "conta-inativa"
      ? "Sua conta está inativa. Fale com um administrador."
      : motivo === "sem-permissao"
      ? "Sua conta não tem acesso ao painel."
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const resultado = await entrar(email, password);

    if (!resultado.success) {
      setError(resultado.error ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }

    // O redirecionamento acontece aqui, e não dentro da server action:
    // `redirect()` numa action lança uma exceção de controle que o try/catch
    // do formulário engoliria, deixando a tela travada em "Entrando...".
    const destino = params.get("redirect") ?? "/admin";
    router.replace(destino.startsWith("/") ? destino : "/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-white">
      <div className="w-full max-w-md px-6">
        <div className="mb-10 text-center">
          <h1 className="mb-2 font-heading text-3xl text-primary-700">NeoSenses</h1>
          <p className="text-sm italic text-text-muted">Área Administrativa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(error || avisoInicial) && (
            <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {error || avisoInicial}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary transition-colors focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
              placeholder="admin@neosenses.com.br"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary transition-colors focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-secondary-600 hover:bg-secondary-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-text-muted">
          © 2026 NeoSenses. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
