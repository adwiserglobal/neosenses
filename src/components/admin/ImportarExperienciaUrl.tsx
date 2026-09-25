"use client";

import { useState, useTransition } from "react";
import {
  importarExperienciaDeUrl,
  type ResultadoImportacaoExperiencia,
} from "@/lib/actions/importarExperiencia";

export function ImportarExperienciaUrl() {
  const [url, setUrl] = useState("");
  const [resultado, setResultado] = useState<ResultadoImportacaoExperiencia | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setResultado(null);
    iniciar(async () => {
      const resposta = await importarExperienciaDeUrl(url);
      setResultado(resposta);
      if (resposta.success) setUrl("");
    });
  }

  return (
    <section className="rounded-2xl border border-secondary-200 bg-secondary-50/40 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-700">
        Espelho 1:1
      </p>
      <h2 className="mt-1 font-heading text-xl text-primary-700">
        Cole a página pronta exatamente como ela foi criada
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-text-muted">
        A NeoSenses não reorganiza textos nem troca o layout. A experiência exibe a página externa inteira,
        com o mesmo design, animações, vídeos, links e formulários. Alterações feitas na página de origem
        aparecem automaticamente no espelho.
      </p>

      <form onSubmit={enviar} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={pendente}
          placeholder="https://site-da-cliente.com/experiencia"
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pendente || !url.trim()}
          className="rounded-xl bg-secondary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary-700 disabled:opacity-50"
        >
          {pendente ? "Preparando espelho…" : "Criar espelho"}
        </button>
      </form>

      {pendente && (
        <div className="mt-4 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-muted">
          Validando a página e preparando a experiência 1:1. Nenhum conteúdo será reescrito pela IA.
        </div>
      )}

      {resultado && !resultado.success && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {resultado.error || "Não foi possível criar o espelho dessa página."}
        </div>
      )}

      {resultado?.success && resultado.id && (
        <div className="mt-4 rounded-xl border border-success/30 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-success">Espelho criado</p>
          <p className="mt-0.5 font-heading text-lg text-primary-700">{resultado.titulo}</p>
          <p className="mt-1 text-xs text-text-muted">
            {resultado.plataforma || "Página externa"} · espelho ao vivo · layout original preservado
          </p>
          {resultado.aviso && (
            <p className="mt-2 text-xs leading-5 text-text-muted">{resultado.aviso}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/admin/experiencias/${resultado.id}`}
              className="inline-block rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Revisar e publicar
            </a>
            {resultado.sourceUrl && (
              <a
                href={resultado.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted"
              >
                Abrir página original
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
