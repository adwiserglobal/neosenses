"use client";

/**
 * Questionário do Journey Builder.
 *
 * Um passo por vez, com o progresso visível. Formulário longo numa página só
 * é formulário abandonado no meio — e aqui a pergunta que mais importa (o que
 * trouxe a pessoa até aqui) está no segundo passo, quando ela já se
 * comprometeu com o primeiro.
 *
 * A validação daqui é conveniência para quem preenche. A que vale roda no
 * servidor, com a mesma lista de perguntas.
 */

import { useRef, useState } from "react";
import { PASSOS, validarRespostas, type Pergunta, type Respostas } from "@/lib/journey/perguntas";
import type { Roteiro } from "@/lib/journey/roteiro";

interface Props {
  aoConcluir: (roteiro: Roteiro, token: string | null) => void;
}

function idDeSessao(): string {
  if (typeof window === "undefined") return "";
  const chave = "neosenses_session_id";
  let id = localStorage.getItem(chave);
  if (id) return id;
  id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(chave, id);
  return id;
}

export function Questionario({ aoConcluir }: Props) {
  // Âncora para a rolagem entre passos. Antes era `window.scrollTo({ top: 0 })`,
  // que joga a pessoa no topo absoluto da página — ela reencontra o cabeçalho e
  // o texto de abertura, e precisa rolar de volta até onde estava. Alinhar pelo
  // começo do questionário mantém a barra de progresso e o título do passo no
  // primeiro campo de visão, que é o que diz "andou".
  const inicio = useRef<HTMLDivElement>(null);
  const [passoAtual, setPassoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [errosDoPasso, setErrosDoPasso] = useState<Record<string, string>>({});
  const [gerando, setGerando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const passo = PASSOS[passoAtual];
  const ultimo = passoAtual === PASSOS.length - 1;

  function responder(id: string, valor: string | string[]) {
    setRespostas((r) => ({ ...r, [id]: valor }));
    setErrosDoPasso((e) => {
      if (!e[id]) return e;
      const novo = { ...e };
      delete novo[id];
      return novo;
    });
  }

  function alternarMultipla(pergunta: Pergunta, valor: string) {
    const atual = (respostas[pergunta.id] as string[]) ?? [];
    const jaTem = atual.includes(valor);

    if (jaTem) {
      responder(pergunta.id, atual.filter((v) => v !== valor));
      return;
    }
    // No limite, a nova escolha substitui a mais antiga em vez de ser
    // ignorada em silêncio — clicar e nada acontecer parece defeito.
    const proximo = pergunta.maximo && atual.length >= pergunta.maximo ? atual.slice(1) : atual;
    responder(pergunta.id, [...proximo, valor]);
  }

  /** Valida só as perguntas deste passo, para não apontar erro lá na frente. */
  function passoValido(): boolean {
    const todos = validarRespostas(respostas);
    const idsDoPasso = new Set(passo.perguntas.map((p) => p.id));
    const daqui = todos.filter((e) => idsDoPasso.has(e.pergunta));

    if (daqui.length === 0) {
      setErrosDoPasso({});
      return true;
    }

    setErrosDoPasso(Object.fromEntries(daqui.map((e) => [e.pergunta, e.mensagem])));

    // Leva a pessoa até o primeiro campo com problema. O erro costumava
    // aparecer acima da dobra e o botão "Continuar" dava a impressão de estar
    // quebrado — a tela não mudava nada de visível.
    requestAnimationFrame(() => {
      const alvo = document.getElementById(`pergunta-${daqui[0].pergunta}`);
      alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
      (alvo?.querySelector("button, textarea") as HTMLElement | null)?.focus();
    });

    return false;
  }

  /**
   * Leva ao começo do questionário, não ao topo da página.
   *
   * O `scroll-mt-28` na âncora é o que abre espaço para o cabeçalho, que é
   * `fixed top-0` — sem ele o `block: "start"` encosta o título do passo
   * embaixo do menu e a primeira linha some. Medido: para a 112 px do topo,
   * 40 px livres abaixo do menu.
   *
   * Sem `behavior` aqui de propósito: o `scroll-behavior: smooth` do
   * globals.css vence o que for passado por JavaScript, então declarar um
   * valor daria a impressão de controlar algo que não se controla daqui. A
   * exceção para `prefers-reduced-motion` vive no CSS, junto com a regra que
   * ela desfaz.
   */
  function irParaOInicio() {
    inicio.current?.scrollIntoView({ block: "start" });
  }

  function avancar() {
    if (!passoValido()) return;
    setPassoAtual((p) => Math.min(p + 1, PASSOS.length - 1));
    irParaOInicio();
  }

  function voltar() {
    setErrosDoPasso({});
    setPassoAtual((p) => Math.max(0, p - 1));
    irParaOInicio();
  }

  async function gerar() {
    if (!passoValido()) return;

    setGerando(true);
    setErroGeral(null);

    try {
      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas, sessionId: idDeSessao() }),
      });
      const dados = await res.json();

      if (!dados.success) {
        setErroGeral(dados.error ?? "Não consegui montar o roteiro agora.");
        return;
      }
      aoConcluir(dados.roteiro, dados.token ?? null);
    } catch (err) {
      console.error("[questionário] falha ao gerar:", err);
      setErroGeral("Não consegui falar com o servidor. Verifique sua conexão e tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div ref={inicio} className="mx-auto max-w-2xl scroll-mt-28">
      {/* Progresso */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between text-xs text-text-muted">
          <span>
            Passo {passoAtual + 1} de {PASSOS.length}
          </span>
          <span>{Math.round(((passoAtual + 1) / PASSOS.length) * 100)}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-warm-gray"
          role="progressbar"
          aria-valuenow={passoAtual + 1}
          aria-valuemin={1}
          aria-valuemax={PASSOS.length}
          aria-label="Progresso do questionário"
        >
          <div
            className="h-full rounded-full bg-secondary-600 hover:bg-secondary-700 transition-all duration-500"
            style={{ width: `${((passoAtual + 1) / PASSOS.length) * 100}%` }}
          />
        </div>
      </div>

      <header className="mb-8">
        <h2 className="font-heading text-2xl text-primary-700 md:text-3xl">{passo.titulo}</h2>
        <p className="mt-1 text-text-muted">{passo.subtitulo}</p>
      </header>

      <div className="space-y-10">
        {passo.perguntas.map((pergunta) => (
          <fieldset key={pergunta.id} id={`pergunta-${pergunta.id}`}>
            <legend className="mb-1 font-medium text-primary-700">
              {pergunta.titulo}
              {!pergunta.obrigatoria && (
                <span className="ml-2 text-xs font-normal text-text-muted">opcional</span>
              )}
            </legend>
            {pergunta.ajuda && <p className="mb-3 text-sm text-text-muted">{pergunta.ajuda}</p>}

            {errosDoPasso[pergunta.id] && (
              <p role="alert" className="mb-3 text-sm text-red-600">
                {errosDoPasso[pergunta.id]}
              </p>
            )}

            {pergunta.tipo === "texto" ? (
              <textarea
                value={(respostas[pergunta.id] as string) ?? ""}
                onChange={(e) => responder(pergunta.id, e.target.value)}
                placeholder={pergunta.placeholder}
                maxLength={pergunta.maxCaracteres ?? 400}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm transition-colors focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {pergunta.opcoes!.map((opcao) => {
                  const multipla = pergunta.tipo === "escolha_multipla";
                  const valor = respostas[pergunta.id];
                  const marcado = multipla
                    ? ((valor as string[]) ?? []).includes(opcao.valor)
                    : valor === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() =>
                        multipla ? alternarMultipla(pergunta, opcao.valor) : responder(pergunta.id, opcao.valor)
                      }
                      aria-pressed={marcado}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        marcado
                          ? "border-secondary-500 bg-secondary-50 ring-1 ring-secondary-500"
                          : "border-border bg-surface hover:border-secondary-300"
                      }`}
                    >
                      <span
                        className={`block text-sm font-medium ${
                          marcado ? "text-primary-700" : "text-text-primary"
                        }`}
                      >
                        {opcao.rotulo}
                      </span>
                      {opcao.detalhe && (
                        <span className="mt-0.5 block text-xs text-text-muted">{opcao.detalhe}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {pergunta.tipo === "escolha_multipla" && pergunta.maximo && (
              <p className="mt-2 text-xs text-text-muted">
                {((respostas[pergunta.id] as string[]) ?? []).length} de {pergunta.maximo}
              </p>
            )}
          </fieldset>
        ))}
      </div>

      {erroGeral && (
        <div role="alert" className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erroGeral}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        <button
          type="button"
          onClick={voltar}
          disabled={passoAtual === 0 || gerando}
          className="text-sm font-medium text-text-muted transition hover:text-primary-700 disabled:invisible"
        >
          ← Voltar
        </button>

        {ultimo ? (
          <button
            type="button"
            onClick={gerar}
            disabled={gerando}
            className="rounded-lg bg-secondary-600 hover:bg-secondary-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
          >
            {gerando ? "Montando seu roteiro…" : "Montar meu roteiro"}
          </button>
        ) : (
          <button
            type="button"
            onClick={avancar}
            className="rounded-lg bg-primary-700 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-800"
          >
            Continuar →
          </button>
        )}
      </div>

      {gerando && (
        <p className="mt-4 text-center text-sm text-text-muted">
          Isso leva alguns segundos. Estamos cruzando o que você contou com as jornadas abertas.
        </p>
      )}
    </div>
  );
}
