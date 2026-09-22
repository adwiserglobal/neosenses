"use client";

/**
 * "Quero esta data" na página da experiência.
 *
 * Até aqui, o único caminho para demonstrar interesse era o WhatsApp — o que
 * exige estar disposto a falar com alguém naquele momento. Boa parte do
 * público chega à noite, pesquisando em silêncio, e não vai puxar conversa.
 *
 * Quando a saída está lotada, o mesmo formulário vira lista de espera: o
 * texto muda, a intenção é registrada como demanda reprimida, e a pessoa sai
 * sabendo o que vai acontecer.
 */

import { useState, useTransition } from "react";
import { registrarInteresse } from "@/lib/actions/forms";
import type { ExperienceDate } from "@/types/models";

interface Props {
  experienciaId: string;
  titulo: string;
  datas: ExperienceDate[];
}

function periodo(d: ExperienceDate): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const ano = new Date(`${d.end_date}T12:00:00Z`).getFullYear();
  return `${fmt(d.start_date)} a ${fmt(d.end_date)} de ${ano}`;
}

function vagasDe(d: ExperienceDate): number | null {
  if (d.spots_total === null) return null;
  return Math.max(0, d.spots_total - d.spots_taken);
}

export function Interesse({ experienciaId, titulo, datas }: Props) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const [enviado, setEnviado] = useState<{ espera: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  // Pré-seleciona a primeira saída com vaga; se todas estiverem lotadas,
  // a primeira mesmo — é sobre ela que a lista de espera vai falar.
  const [dataId, setDataId] = useState<string>(() => {
    const comVaga = datas.find((d) => {
      const v = vagasDe(d);
      return v === null || v > 0;
    });
    return (comVaga ?? datas[0])?.id ?? "";
  });

  const escolhida = datas.find((d) => d.id === dataId);
  const vagas = escolhida ? vagasDe(escolhida) : null;
  const lotada = vagas === 0;

  function enviar(dados: FormData) {
    setErro(null);
    setCampoComErro(null);

    iniciar(async () => {
      try {
        const r = await registrarInteresse({
          nome: String(dados.get("nome") ?? ""),
          email: String(dados.get("email") ?? ""),
          telefone: String(dados.get("telefone") ?? ""),
          experienciaId,
          dataId: dataId || undefined,
          viajantes: Number(dados.get("viajantes") ?? 1),
          mensagem: String(dados.get("mensagem") ?? ""),
          armadilha: String(dados.get("site") ?? ""),
        });

        if (!r.success) {
          setErro(r.error ?? "Não foi possível registrar agora.");
          setCampoComErro(r.campo ?? null);
          return;
        }
        setEnviado({ espera: r.listaDeEspera ?? false });
      } catch (err) {
        console.error("[interesse] falha ao enviar:", err);
        setErro("Não consegui falar com o servidor. Tente pelo WhatsApp que respondemos na hora.");
      }
    });
  }

  if (enviado) {
    return (
      <div
        role="status"
        className="rounded-xl border border-success/30 bg-success/5 p-5 text-center"
      >
        <p className="font-heading text-lg text-primary-700">
          {enviado.espera ? "Você entrou na lista de espera" : "Recebemos seu interesse"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {enviado.espera
            ? "Se abrir vaga nesta saída — ou se abrirmos uma turma nova —, você é avisado antes de anunciarmos."
            : "Nossa equipe entra em contato em até um dia útil com os detalhes e as formas de pagamento."}
        </p>
      </div>
    );
  }

  const classe = (campo: string) =>
    `w-full rounded-lg border bg-warm-white px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
      campoComErro === campo
        ? "border-red-400 focus:ring-red-500/20"
        : "border-border focus:border-secondary-500 focus:ring-secondary-500/20"
    }`;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full rounded-lg bg-primary-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-800"
      >
        {lotada ? "Entrar na lista de espera" : "Quero esta data"}
      </button>
    );
  }

  return (
    <form action={enviar} className="space-y-3 rounded-xl border border-border bg-warm-white/50 p-4">
      <div>
        <h3 className="font-heading text-base text-primary-700">
          {lotada ? "Lista de espera" : "Quero esta data"}
        </h3>
        <p className="mt-0.5 text-xs text-text-muted">
          {lotada
            ? "Esta saída está lotada. Avisamos você se abrir vaga ou turma nova."
            : "Sem compromisso. A equipe retorna com detalhes e formas de pagamento."}
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {erro}
        </p>
      )}

      {/* Isca para robô: escondida do olho e do leitor de tela. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor={`site-${experienciaId}`}>Não preencha</label>
        <input id={`site-${experienciaId}`} name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {datas.length > 0 && (
        <div>
          <label htmlFor={`data-${experienciaId}`} className="mb-1 block text-xs font-medium text-primary-700">
            Qual saída
          </label>
          <select
            id={`data-${experienciaId}`}
            value={dataId}
            onChange={(e) => setDataId(e.target.value)}
            className={classe("data")}
          >
            {datas.map((d) => {
              const v = vagasDe(d);
              return (
                <option key={d.id} value={d.id}>
                  {periodo(d)}
                  {v === null ? "" : v === 0 ? " — esgotada" : ` — ${v} ${v === 1 ? "vaga" : "vagas"}`}
                </option>
              );
            })}
            <option value="">Ainda não sei / outra data</option>
          </select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`nome-${experienciaId}`} className="mb-1 block text-xs font-medium text-primary-700">
            Nome *
          </label>
          <input id={`nome-${experienciaId}`} name="nome" required maxLength={120} className={classe("name")} />
        </div>
        <div>
          <label htmlFor={`email-${experienciaId}`} className="mb-1 block text-xs font-medium text-primary-700">
            E-mail *
          </label>
          <input
            id={`email-${experienciaId}`}
            name="email"
            type="email"
            required
            maxLength={160}
            className={classe("email")}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`tel-${experienciaId}`} className="mb-1 block text-xs font-medium text-primary-700">
            WhatsApp
          </label>
          <input
            id={`tel-${experienciaId}`}
            name="telefone"
            type="tel"
            maxLength={30}
            placeholder="(11) 90000-0000"
            className={classe("phone")}
          />
        </div>
        <div>
          <label htmlFor={`viaj-${experienciaId}`} className="mb-1 block text-xs font-medium text-primary-700">
            Quantas pessoas
          </label>
          <input
            id={`viaj-${experienciaId}`}
            name="viajantes"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            className={classe("viajantes")}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`msg-${experienciaId}`} className="mb-1 block text-xs font-medium text-primary-700">
          Algo que devemos saber
        </label>
        <textarea
          id={`msg-${experienciaId}`}
          name="mensagem"
          rows={2}
          maxLength={2000}
          placeholder="Restrição alimentar, receio de altitude, primeira viagem em grupo…"
          className={`resize-none ${classe("mensagem")}`}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60"
        >
          {pendente ? "Enviando…" : lotada ? "Entrar na lista" : "Enviar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-text-muted underline underline-offset-4 hover:text-primary-700"
        >
          Cancelar
        </button>
      </div>

      <p className="text-[11px] leading-relaxed text-text-muted">
        Usamos seus dados só para falar sobre {titulo}. Não enviamos propaganda e não
        compartilhamos com ninguém.
      </p>
    </form>
  );
}
