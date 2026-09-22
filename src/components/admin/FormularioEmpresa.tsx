"use client";

import { useState, useTransition } from "react";
import { salvarDadosDaEmpresa } from "@/lib/actions/admin";

interface Props {
  atuais: Record<string, string>;
}

const CAMPOS = [
  {
    chave: "empresa.razao_social",
    rotulo: "Razão social",
    ajuda: "Como está no cartão CNPJ. Aparece nos Termos de Uso.",
    exemplo: "NeoSenses Viagens e Turismo Ltda.",
  },
  {
    chave: "empresa.cnpj",
    rotulo: "CNPJ",
    ajuda: "Conferido pelos dígitos verificadores ao salvar. Enquanto vazio, os Termos omitem a linha.",
    exemplo: "00.000.000/0001-00",
  },
  {
    chave: "empresa.cadastur",
    rotulo: "Cadastur",
    ajuda:
      "Registro no Ministério do Turismo. Exibir o número é sinal de legitimidade para quem vai pagar adiantado por uma viagem.",
    exemplo: "00.000000.00-0",
  },
  {
    chave: "empresa.endereco",
    rotulo: "Endereço",
    ajuda: "Rodapé e Termos.",
    exemplo: "Rua, número – bairro, cidade – UF, CEP",
  },
  {
    chave: "empresa.fundacao",
    rotulo: "Ano de fundação",
    ajuda: "Aparece na página Sobre. Quanto tempo de estrada é argumento de confiança.",
    exemplo: "2019",
  },
  {
    chave: "site.email",
    rotulo: "E-mail de contato",
    ajuda: "Rodapé, Termos e resposta do Concierge.",
    exemplo: "contato@neosenses.com.br",
  },
  {
    chave: "site.whatsapp",
    rotulo: "WhatsApp",
    ajuda: "Só números, com país e DDD.",
    exemplo: "5511947188319",
  },
];

export function FormularioEmpresa({ atuais }: Props) {
  const [pendente, iniciar] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  function enviar(dados: FormData) {
    setErro(null);
    setCampoComErro(null);
    setSalvo(false);

    iniciar(async () => {
      const r = await salvarDadosDaEmpresa(dados);
      if (!r.success) {
        setErro(r.error ?? "Não foi possível salvar.");
        setCampoComErro(r.campo ?? null);
        return;
      }
      setSalvo(true);
    });
  }

  const faltando = CAMPOS.filter((c) => !atuais[c.chave]?.trim());

  return (
    <form action={enviar} className="space-y-5">
      {erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </p>
      )}
      {salvo && !erro && (
        <p role="status" className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Salvo. As páginas públicas já refletem a mudança.
        </p>
      )}

      {faltando.length > 0 && !salvo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">{faltando.length} campo(s) em branco</p>
          <p className="mt-0.5">
            {faltando.some((c) => c.chave === "empresa.cnpj")
              ? "Sem CNPJ, a página de Termos de Uso não identifica a empresa contratante."
              : "As páginas omitem o que estiver em branco."}
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        {CAMPOS.map((campo) => (
          <div key={campo.chave}>
            <label htmlFor={campo.chave} className="mb-1.5 block text-sm font-medium text-primary-700">
              {campo.rotulo}
            </label>
            <input
              id={campo.chave}
              name={campo.chave}
              defaultValue={atuais[campo.chave] ?? ""}
              placeholder={campo.exemplo}
              maxLength={300}
              aria-describedby={`${campo.chave}-ajuda`}
              className={`w-full rounded-lg border bg-warm-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                campoComErro === campo.chave
                  ? "border-red-400 focus:ring-red-500/20"
                  : "border-border focus:border-secondary-500 focus:ring-secondary-500/20"
              }`}
            />
            <p id={`${campo.chave}-ajuda`} className="mt-1 text-xs text-text-muted">
              {campo.ajuda}
            </p>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-primary-700 px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60"
      >
        {pendente ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
