"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { definirSenhaInicial } from "@/lib/actions/auth";

export function PrimeiroAcessoForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    if (senha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 12) {
      setErro("Escolha uma senha com pelo menos 12 caracteres.");
      return;
    }

    setCarregando(true);
    const resultado = await definirSenhaInicial(senha, confirmacao);
    if (!resultado.success) {
      setErro(resultado.error ?? "Não foi possível atualizar sua senha.");
      setCarregando(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#32103d] px-5 py-10">
      <div aria-hidden="true" className="fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(224,169,46,0.22),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(126,34,139,0.42),transparent_38%)]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="primeiro-acesso-titulo"
        className="relative w-full max-w-lg rounded-[28px] border border-[#eadfcf] bg-[#fffaf2] p-7 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:p-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6f16]">
          NeoSenses Operations
        </p>
        <h1 id="primeiro-acesso-titulo" className="mt-4 font-heading text-3xl text-[#3b1742]">
          Defina sua nova senha
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#715f54]">
          Este é seu primeiro acesso ao painel interno. Antes de continuar,
          escolha uma senha pessoal e confirme-a abaixo.
        </p>

        <form onSubmit={enviar} className="mt-8 space-y-5">
          {erro && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <div>
            <label htmlFor="nova-senha" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4a304b]">
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              minLength={12}
              maxLength={128}
              required
              className="w-full rounded-xl border border-[#dfd3c1] bg-white px-4 py-3.5 text-[#352a31] outline-none transition focus:border-[#a77a20] focus:ring-4 focus:ring-[#d9a324]/15"
              placeholder="Pelo menos 12 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmar-senha" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4a304b]">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
              minLength={12}
              maxLength={128}
              required
              className="w-full rounded-xl border border-[#dfd3c1] bg-white px-4 py-3.5 text-[#352a31] outline-none transition focus:border-[#a77a20] focus:ring-4 focus:ring-[#d9a324]/15"
              placeholder="Digite novamente a nova senha"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-[#4d145b] px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#371044] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {carregando ? "Salvando senha..." : "Salvar senha e acessar o painel"}
          </button>
        </form>
      </section>
    </main>
  );
}
