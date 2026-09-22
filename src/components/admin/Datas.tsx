"use client";

/**
 * Datas de uma experiência.
 *
 * O ponto de encontro fica aqui, junto da data, e não no cadastro geral: ele
 * muda de uma saída para outra. É a informação que o Concierge responde
 * quando alguém pergunta onde o grupo se encontra — e enquanto estiver vazia,
 * ele encaminha para a equipe em vez de inventar endereço.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarData, excluirData } from "@/lib/actions/admin";
import type { ExperienceDate } from "@/types/models";

interface Props {
  experienceId: string;
  datas: ExperienceDate[];
}

function formatar(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pontoPreenchido(ponto: unknown): boolean {
  if (!ponto || typeof ponto !== "object") return false;
  return Object.keys(ponto as Record<string, unknown>).length > 0;
}

const campo =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20";

/**
 * Declarado fora do componente de propósito.
 *
 * Definido dentro, o React o trata como um tipo novo a cada renderização e
 * remonta o formulário inteiro — quem estivesse digitando perderia o texto e
 * o foco a cada render disparado por outro estado da tela.
 */
function FormularioDeData({
  experienceId,
  data,
  aoEnviar,
  aoCancelar,
  pendente,
}: {
  experienceId: string;
  data?: ExperienceDate;
  aoEnviar: (dados: FormData) => void;
  aoCancelar: () => void;
  pendente: boolean;
}) {
  const ponto = (data?.meeting_point ?? {}) as Record<string, unknown>;
  const instrucoes = (ponto.instrucoes as Record<string, string> | undefined)?.pt ?? "";

  return (
    <form action={aoEnviar} className="space-y-4 rounded-xl border border-secondary-300 bg-secondary-50/40 p-5">
      <input type="hidden" name="experience_id" value={experienceId} />
      {data && <input type="hidden" name="id" value={data.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Início *</label>
          <input type="date" name="start_date" defaultValue={data?.start_date ?? ""} required className={campo} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Fim *</label>
          <input type="date" name="end_date" defaultValue={data?.end_date ?? ""} required className={campo} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Vagas</label>
          <input type="number" name="spots_total" min={0} defaultValue={data?.spots_total ?? ""} className={campo} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Ocupadas</label>
          <input type="number" name="spots_taken" min={0} defaultValue={data?.spots_taken ?? 0} className={campo} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Valor (R$)</label>
          <input type="number" name="price" min={0} step="0.01" defaultValue={data?.price ?? ""} className={campo} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Situação</label>
          <select name="status" defaultValue={data?.status ?? "published"} className={campo}>
            <option value="published">No ar</option>
            <option value="draft">Rascunho</option>
            <option value="sold_out">Esgotada</option>
            <option value="archived">Arquivada</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 border-t border-secondary-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-700">Ponto de encontro</p>
        <p className="text-xs text-text-muted">
          É o que o Concierge responde quando perguntam onde o grupo se encontra. Vazio significa que
          ele encaminha para a equipe.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-primary-700">Local</label>
            <input
              name="meeting_local"
              defaultValue={(ponto.local as string) ?? ""}
              placeholder="Aeroporto de Cusco (CUZ), desembarque"
              maxLength={200}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-primary-700">Horário</label>
            <input
              name="meeting_horario"
              defaultValue={(ponto.horario as string) ?? ""}
              placeholder="10h00 do dia 1"
              maxLength={100}
              className={campo}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Endereço</label>
          <input
            name="meeting_endereco"
            defaultValue={(ponto.endereco as string) ?? ""}
            maxLength={300}
            className={campo}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-primary-700">Instruções</label>
          <textarea
            name="meeting_instrucoes"
            defaultValue={instrucoes}
            rows={3}
            maxLength={1000}
            placeholder="Procure a placa NeoSenses. Traga o casaco na bagagem de mão: Cusco fica a 3.400 m."
            className={`resize-none ${campo}`}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar saída"}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-lg border border-border px-5 py-2 text-sm text-text-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function Datas({ experienceId, datas }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [editando, setEditando] = useState<string | "nova" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);

  function enviar(dados: FormData) {
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const r = await salvarData(dados);
      if (!r.success) {
        setErro(r.error ?? "Não foi possível salvar.");
        return;
      }
      setEditando(null);
      router.refresh();
    });
  }

  function remover(id: string, periodo: string) {
    if (
      !window.confirm(
        `Excluir a saída de ${periodo}?\n\nSe já houver reserva, ela será arquivada em vez de excluída.`
      )
    ) {
      return;
    }
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const r = await excluirData(id, experienceId);
      if (!r.success) {
        setErro(r.error ?? "Não foi possível excluir.");
        return;
      }
      // `error` aqui carrega o aviso de que virou arquivamento.
      if (r.error) setAviso(r.error);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg text-primary-700">Saídas</h2>
          <p className="text-sm text-text-muted">
            Sem data futura, a página diz que ainda não há saída publicada.
          </p>
        </div>
        {editando !== "nova" && (
          <button
            type="button"
            onClick={() => setEditando("nova")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-700 transition hover:border-secondary-500"
          >
            + Nova saída
          </button>
        )}
      </div>

      {erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          {aviso}
        </p>
      )}

      {editando === "nova" && (
        <FormularioDeData
          experienceId={experienceId}
          aoEnviar={enviar}
          aoCancelar={() => setEditando(null)}
          pendente={pendente}
        />
      )}

      {datas.length === 0 && editando !== "nova" ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
          Nenhuma saída cadastrada.
        </p>
      ) : (
        <ul className="space-y-2">
          {datas.map((d) =>
            editando === d.id ? (
              <li key={d.id}>
                <FormularioDeData
                  experienceId={experienceId}
                  data={d}
                  aoEnviar={enviar}
                  aoCancelar={() => setEditando(null)}
                  pendente={pendente}
                />
              </li>
            ) : (
              <li
                key={d.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                  d.start_date < hoje ? "border-border bg-warm-gray/30 opacity-70" : "border-border bg-surface"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-primary-700">
                    {formatar(d.start_date)} a {formatar(d.end_date)}
                    {d.start_date < hoje && (
                      <span className="ml-2 text-xs font-normal text-text-muted">(passada)</span>
                    )}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span>
                      {d.spots_total === null
                        ? "vagas a confirmar"
                        : `${Math.max(0, d.spots_total - d.spots_taken)} de ${d.spots_total} vagas`}
                    </span>
                    {d.price && <span>R$ {Number(d.price).toLocaleString("pt-BR")}</span>}
                    <span>{d.status === "published" ? "no ar" : d.status}</span>
                    {!pontoPreenchido(d.meeting_point) && (
                      <span className="text-amber-700">sem ponto de encontro</span>
                    )}
                  </div>
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
                    onClick={() => remover(d.id, `${formatar(d.start_date)} a ${formatar(d.end_date)}`)}
                    disabled={pendente}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}
