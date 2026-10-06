"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
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
    grupo: "legal",
  },
  {
    chave: "empresa.cnpj",
    rotulo: "CNPJ",
    ajuda: "Conferido pelos dígitos verificadores ao salvar.",
    exemplo: "00.000.000/0001-00",
    grupo: "legal",
  },
  {
    chave: "empresa.cadastur",
    rotulo: "Cadastur",
    ajuda: "Registro no Ministério do Turismo exibido como prova institucional.",
    exemplo: "00.000000.00-0",
    grupo: "legal",
  },
  {
    chave: "empresa.fundacao",
    rotulo: "Ano de fundação",
    ajuda: "Aparece na página Sobre e reforça o histórico da empresa.",
    exemplo: "2019",
    grupo: "legal",
  },
  {
    chave: "empresa.endereco",
    rotulo: "Endereço",
    ajuda: "Usado no rodapé e nos Termos de Uso.",
    exemplo: "Rua, número – bairro, cidade – UF, CEP",
    grupo: "contato",
  },
  {
    chave: "site.email",
    rotulo: "E-mail de contato",
    ajuda: "Usado no rodapé, nos Termos e nos canais de contato.",
    exemplo: "contato@neosenses.com.br",
    grupo: "contato",
  },
  {
    chave: "site.whatsapp",
    rotulo: "WhatsApp",
    ajuda: "Informe somente números, incluindo país e DDD.",
    exemplo: "5511947188319",
    grupo: "contato",
  },
] as const;

const GRUPOS = [
  {
    id: "legal",
    titulo: "Identificação e registros",
    descricao: "Dados que sustentam a identificação formal da empresa.",
    Icone: Landmark,
  },
  {
    id: "contato",
    titulo: "Contato público",
    descricao: "Informações usadas para o visitante encontrar e falar com a NeoSenses.",
    Icone: Phone,
  },
] as const;

function IconeDoCampo({ chave }: { chave: string }) {
  const classe = "h-4 w-4";
  if (chave === "empresa.endereco") return <MapPin className={classe} aria-hidden="true" />;
  if (chave === "site.email") return <Mail className={classe} aria-hidden="true" />;
  if (chave === "site.whatsapp") return <Phone className={classe} aria-hidden="true" />;
  return <Building2 className={classe} aria-hidden="true" />;
}

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
    <form action={enviar} className="space-y-6">
      {erro && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{erro}</span>
        </div>
      )}

      {salvo && !erro && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Salvo. As páginas públicas já refletem a mudança.</span>
        </div>
      )}

      {faltando.length > 0 && !salvo && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#e5c66f] bg-[#fff7df] px-5 py-4 text-sm text-[#795814]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{faltando.length} campo{faltando.length === 1 ? "" : "s"} em branco</p>
            <p className="mt-0.5 text-[#876a2b]">
              O site omite automaticamente informações não preenchidas.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {GRUPOS.map(({ id, titulo, descricao, Icone }) => {
          const campos = CAMPOS.filter((campo) => campo.grupo === id);
          return (
            <section
              key={id}
              className="overflow-hidden rounded-[26px] border border-[#ddd0bd] bg-[#fffaf3] shadow-[0_18px_55px_rgba(67,42,29,0.06)]"
            >
              <header className="flex items-center gap-4 border-b border-[#e5d9c8] bg-[#f6eddf] px-6 py-5 md:px-7">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4d145b] text-white shadow-sm">
                  <Icone className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-xl text-[#4a174e]">{titulo}</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#7a685d]">{descricao}</p>
                </div>
              </header>

              <div className="grid gap-x-5 gap-y-6 p-6 md:grid-cols-2 md:p-7">
                {campos.map((campo) => (
                  <div
                    key={campo.chave}
                    className={campo.chave === "empresa.endereco" ? "md:col-span-2" : ""}
                  >
                    <label
                      htmlFor={campo.chave}
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#4a174e]"
                    >
                      <span className="text-[#a27419]">
                        <IconeDoCampo chave={campo.chave} />
                      </span>
                      {campo.rotulo}
                    </label>
                    <input
                      id={campo.chave}
                      name={campo.chave}
                      defaultValue={atuais[campo.chave] ?? ""}
                      placeholder={campo.exemplo}
                      maxLength={300}
                      aria-describedby={`${campo.chave}-ajuda`}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#352c28] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-[#a6978b] focus:ring-4 ${
                        campoComErro === campo.chave
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-[#d7c7b0] hover:border-[#bda882] focus:border-[#8d5a96] focus:ring-[#6d1f79]/8"
                      }`}
                    />
                    <p id={`${campo.chave}-ajuda`} className="mt-1.5 text-xs leading-relaxed text-[#88776b]">
                      {campo.ajuda}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-[#d8c9b4] bg-[#fffaf3]/95 p-4 shadow-[0_16px_50px_rgba(58,32,18,0.13)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#4a174e]">Publicação automática</p>
          <p className="mt-0.5 text-xs text-[#7f6e62]">
            Salvar atualiza os dados institucionais usados pelo site.
          </p>
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#4d145b] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(77,20,91,0.22)] transition hover:bg-[#60176e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {pendente ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
