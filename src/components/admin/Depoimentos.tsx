"use client";

/**
 * Cadastro de depoimentos.
 *
 * Formulário declarado fora do componente de lista, pelo mesmo motivo do
 * cadastro de datas: definido dentro, o React o remonta a cada renderização e
 * quem estivesse digitando perderia o texto.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarDepoimento, excluirDepoimento } from "@/lib/actions/admin";
import { t } from "@/lib/utils";
import type { I18nField, Testimonial } from "@/types/models";

interface OpcaoExperiencia {
  id: string;
  titulo: string;
}

interface Props {
  depoimentos: Testimonial[];
  experiencias: OpcaoExperiencia[];
}

const campo =
  "w-full rounded-lg border border-border bg-warm-white px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20";

function FormularioDepoimento({
  depoimento,
  experiencias,
  aoEnviar,
  aoCancelar,
  pendente,
}: {
  depoimento?: Testimonial;
  experiencias: OpcaoExperiencia[];
  aoEnviar: (dados: FormData) => void;
  aoCancelar: () => void;
  pendente: boolean;
}) {
  return (
    <form action={aoEnviar} className="space-y-4 rounded-xl border border-secondary-300 bg-secondary-50/40 p-5">
      {depoimento && <input type="hidden" name="id" value={depoimento.id} />}

      <div>
        <label className="mb-1 block text-xs font-medium text-primary-700">Depoimento *</label>
        <textarea
          name="quote_pt"
          defaultValue={t(depoimento?.quote as I18nField, "pt")}
          required
          rows={4}
          maxLength={1500}
          placeholder="O que a pessoa escreveu, nas palavras dela."
          className={`resize-y ${campo}`}
        />
        <p className="mt-1 text-xs text-text-muted">
          Depoimento específico convence mais que elogio genérico. &quot;Chorei no terceiro dia e
          ninguém achou estranho&quot; vale mais que &quot;experiência maravilhosa&quot;.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Nome *</label>
          <input name="name" defaultValue={depoimento?.name ?? ""} required maxLength={120} className={campo} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Cidade</label>
          <input
            name="location"
            defaultValue={depoimento?.location ?? ""}
            maxLength={120}
            placeholder="São Paulo, SP"
            className={campo}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Foto (endereço)</label>
          <input
            name="photo"
            type="url"
            defaultValue={depoimento?.photo ?? ""}
            maxLength={500}
            placeholder="https://…"
            className={campo}
          />
          <p className="mt-1 text-xs text-text-muted">Rosto real pesa mais que texto sozinho.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Experiência</label>
          <select name="experience_id" defaultValue={depoimento?.experience_id ?? ""} className={campo}>
            <option value="">Nenhuma em especial</option>
            {experiencias.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-muted">Vinculado, aparece na página daquela jornada.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Nota (1 a 5)</label>
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            defaultValue={depoimento?.rating ?? ""}
            className={campo}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Situação</label>
          <select name="status" defaultValue={depoimento?.status ?? "draft"} className={campo}>
            <option value="draft">Rascunho</option>
            <option value="published">No ar</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Ordem</label>
          <input name="sort_order" type="number" defaultValue={depoimento?.sort_order ?? 0} className={campo} />
        </div>
      </div>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          name="is_featured"
          defaultChecked={depoimento?.is_featured ?? false}
          className="h-4 w-4 accent-secondary-500"
        />
        <span className="text-sm text-primary-700">Destacar na home</span>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={aoCancelar} className="rounded-lg border border-border px-5 py-2 text-sm text-text-muted">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function Depoimentos({ depoimentos, experiencias }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function enviar(dados: FormData) {
    setErro(null);
    iniciar(async () => {
      const r = await salvarDepoimento(dados);
      if (!r.success) {
        setErro(r.error ?? "Não foi possível salvar.");
        return;
      }
      setEditando(null);
      router.refresh();
    });
  }

  function remover(id: string, nome: string) {
    if (!window.confirm(`Excluir o depoimento de ${nome}?`)) return;
    setErro(null);
    iniciar(async () => {
      const r = await excluirDepoimento(id);
      if (!r.success) {
        setErro(r.error ?? "Não foi possível excluir.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {editando !== "novo" && (
        <button
          type="button"
          onClick={() => setEditando("novo")}
          className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          Novo depoimento
        </button>
      )}

      {erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {erro}
        </p>
      )}

      {editando === "novo" && (
        <FormularioDepoimento
          experiencias={experiencias}
          aoEnviar={enviar}
          aoCancelar={() => setEditando(null)}
          pendente={pendente}
        />
      )}

      {depoimentos.length === 0 && editando !== "novo" ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-muted">
          Nenhum depoimento cadastrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {depoimentos.map((d) =>
            editando === d.id ? (
              <li key={d.id}>
                <FormularioDepoimento
                  depoimento={d}
                  experiencias={experiencias}
                  aoEnviar={enviar}
                  aoCancelar={() => setEditando(null)}
                  pendente={pendente}
                />
              </li>
            ) : (
              <li key={d.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                          d.status === "published"
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-border bg-warm-gray text-text-muted"
                        }`}
                      >
                        {d.status === "published" ? "No ar" : d.status === "draft" ? "Rascunho" : "Arquivado"}
                      </span>
                      {d.is_featured && (
                        <span className="rounded-full border border-secondary-300 bg-secondary-50 px-2.5 py-0.5 text-[11px] text-secondary-700">
                          Destaque
                        </span>
                      )}
                      {d.rating && (
                        <span className="text-[11px] text-text-muted">{"★".repeat(d.rating)}</span>
                      )}
                    </div>

                    <blockquote className="mt-2 italic leading-relaxed text-text-primary">
                      “{t(d.quote as I18nField, "pt")}”
                    </blockquote>
                    <p className="mt-1.5 text-sm text-text-muted">
                      {d.name}
                      {d.location ? ` · ${d.location}` : ""}
                      {!d.photo && <span className="ml-2 text-xs text-amber-700">sem foto</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditando(d.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-secondary-500 hover:text-secondary-500"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(d.id, d.name)}
                      disabled={pendente}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
