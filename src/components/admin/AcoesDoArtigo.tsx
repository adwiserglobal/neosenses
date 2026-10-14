"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { alterarSituacaoArtigo, excluirArtigoBlog } from "@/lib/actions/blog";

type Situacao = "draft" | "published" | "archived";

const botao =
  "rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:opacity-50";

/** Botões de cada linha da lista de artigos: ver, editar, tirar do ar, arquivar e excluir. */
export function AcoesDoArtigo({
  id,
  slug,
  situacao,
  podeExcluir,
}: {
  id: string;
  slug: string;
  situacao: Situacao;
  podeExcluir: boolean;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  function mudar(status: Situacao) {
    setErro("");
    iniciar(async () => {
      const r = await alterarSituacaoArtigo(id, status);
      if (!r.success) return setErro(r.error || "Não foi possível alterar o artigo.");
      router.refresh();
    });
  }

  function excluir() {
    setErro("");
    iniciar(async () => {
      const r = await excluirArtigoBlog(id);
      if (!r.success) {
        setExcluindo(false);
        return setErro(r.error || "Não foi possível excluir o artigo.");
      }
      router.refresh();
    });
  }

  if (excluindo) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
        <span className="text-red-800">Excluir para sempre? Não dá para desfazer.</span>
        <button type="button" disabled={pendente} onClick={() => setExcluindo(false)}
          className={`${botao} border-primary-700 text-primary-700`}>Cancelar</button>
        <button type="button" disabled={pendente} onClick={excluir}
          className={`${botao} border-red-700 bg-red-700 text-white hover:bg-red-800`}>
          {pendente ? "Excluindo…" : "Sim, excluir"}
        </button>
        {erro && <p role="alert" className="w-full text-right text-xs text-red-800">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
      {situacao === "published" && slug && (
        <Link href={`/blog/${slug}`} target="_blank"
          className={`${botao} border-border text-text-muted hover:border-secondary-400`}>Ver no site</Link>
      )}
      {situacao === "published" ? (
        <button type="button" disabled={pendente} onClick={() => mudar("draft")}
          className={`${botao} border-secondary-400 text-secondary-700 hover:bg-secondary-50`}>
          {pendente ? "Tirando…" : "Tirar do ar"}
        </button>
      ) : (
        <button type="button" disabled={pendente} onClick={() => mudar("published")}
          className={`${botao} border-secondary-400 bg-secondary-50 text-secondary-700 hover:bg-secondary-100`}>
          {pendente ? "Publicando…" : "Publicar"}
        </button>
      )}
      {situacao === "draft" && (
        <button type="button" disabled={pendente} onClick={() => mudar("archived")}
          className={`${botao} border-border text-text-muted hover:border-secondary-400`}>Arquivar</button>
      )}
      {podeExcluir && (
        <button type="button" disabled={pendente} onClick={() => setExcluindo(true)}
          className={`${botao} border-red-200 text-red-700 hover:bg-red-50`}>Excluir</button>
      )}
      <Link href={`/admin/blog/${id}`}
        className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">Editar</Link>
      {erro && <p role="alert" className="w-full text-right text-xs text-red-800">{erro}</p>}
    </div>
  );
}
