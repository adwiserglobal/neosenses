"use client";

/**
 * Cadastro de destino com assistente de IA.
 *
 * O fluxo é: a pessoa digita o lugar, a IA monta o rascunho, ela revisa e
 * salva. A revisão não é formalidade — os campos que a conferência marcou
 * aparecem destacados, e é exatamente neles que o modelo erra.
 *
 * Nada é salvo pelo assistente. Ele preenche o formulário; quem grava é a
 * pessoa, no botão do fim.
 */

import { useState, useTransition } from "react";
import { sugerirDestino, sugerirImagens, salvarDestino } from "@/lib/actions/destinos";
import type { Ressalva, SugestaoDestino } from "@/lib/ai/destino";
import type { ImagemEncontrada } from "@/lib/ai/imagens";

interface Props {
  /** Preenchido quando é edição. */
  inicial?: Partial<SugestaoDestino> & { id?: string; heroImage?: string | null; ativo?: boolean };
}

const CLIMAS = [
  "tropical", "equatorial", "subtropical", "temperado", "mediterraneo",
  "desertico", "semiarido", "montanha", "frio", "polar",
];

export function FormularioDestino({ inicial }: Props) {
  const [pendente, iniciar] = useTransition();
  const [consultando, setConsultando] = useState(false);

  const [lugar, setLugar] = useState("");
  const [contexto, setContexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const [ficha, setFicha] = useState<Partial<SugestaoDestino>>(inicial ?? {});
  const [ressalvas, setRessalvas] = useState<Ressalva[]>([]);
  const [veioDaIA, setVeioDaIA] = useState(false);

  const [imagens, setImagens] = useState<ImagemEncontrada[]>([]);
  const [buscandoFotos, setBuscandoFotos] = useState(false);
  const [erroFotos, setErroFotos] = useState<string | null>(null);
  // Todas marcadas por padrão: quem procurou quer as fotos. Desmarcar é o
  // caso raro.
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());

  const escolhidas = imagens.filter((i) => !descartadas.has(i.url));

  const marcado = (campo: string) => ressalvas.find((r) => r.campo === campo);

  function campo<K extends keyof SugestaoDestino>(nome: K, valor: SugestaoDestino[K]) {
    setFicha((f) => ({ ...f, [nome]: valor }));
    // Editar o campo resolve a ressalva dele: quem mexeu, conferiu.
    setRessalvas((r) => r.filter((x) => x.campo !== nome));
  }

  async function consultar() {
    setErro(null);
    setErroFotos(null);
    setConsultando(true);
    setBuscandoFotos(true);

    // As duas buscas são independentes: a ficha vem da IA, as fotos do
    // Wikimedia. Em série, a pessoa esperaria a soma das duas por nada.
    const pedidoFicha = sugerirDestino(lugar, contexto);
    const pedidoFotos = sugerirImagens(lugar);

    try {
      const r = await pedidoFicha;
      if (!r.success || !r.sugestao) {
        setErro(r.error ?? "Não consegui montar a ficha.");
      } else {
        setFicha(r.sugestao);
        setRessalvas(r.ressalvas ?? []);
        setVeioDaIA(true);
      }
    } finally {
      setConsultando(false);
    }

    try {
      const f = await pedidoFotos;
      if (f.success && f.imagens?.length) {
        setImagens(f.imagens);
        setDescartadas(new Set());
      } else {
        setErroFotos(f.error ?? "Não achei fotos para este termo.");
      }
    } finally {
      setBuscandoFotos(false);
    }
  }

  /** Procura fotos de novo, com outro termo, sem refazer a ficha. */
  async function reprocurarFotos(termo: string) {
    setErroFotos(null);
    setBuscandoFotos(true);
    try {
      const f = await sugerirImagens(termo);
      if (f.success && f.imagens?.length) {
        setImagens(f.imagens);
        setDescartadas(new Set());
      } else {
        setErroFotos(f.error ?? "Não achei fotos para este termo.");
      }
    } finally {
      setBuscandoFotos(false);
    }
  }

  function enviar(dados: FormData) {
    setErro(null);
    setSalvo(false);
    iniciar(async () => {
      const r = await salvarDestino(dados);
      if (r.success) setSalvo(true);
      else setErro(r.error ?? "Não consegui salvar.");
    });
  }

  const rotulo = "mb-1 block text-sm font-medium text-primary-700";
  const entrada =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20";
  const atencao = "border-amber-400 bg-amber-50/60";

  return (
    <div className="space-y-8">
      {/* ── Assistente ────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-heading text-lg text-primary-700">Começar pelo nome do lugar</h2>
        <p className="mt-1 text-sm text-text-muted">
          A IA monta o rascunho e você revisa. Ela roda só agora, no cadastro — o
          site não chama IA nenhuma para mostrar o destino depois.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="lugar" className={rotulo}>
              Lugar
            </label>
            <input
              id="lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Kyoto, Japão"
              className={entrada}
            />
            <p className="mt-1 text-xs text-text-muted">
              Com o país junto o acerto é bem maior — há uma Santarém no Pará e outra em Portugal.
            </p>
          </div>

          <div>
            <label htmlFor="contexto" className={rotulo}>
              Contexto <span className="font-normal text-text-muted">opcional</span>
            </label>
            <textarea
              id="contexto"
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              rows={2}
              placeholder="O que a viagem faz por lá: templos budistas, retiro de silêncio, caminhada…"
              className={`${entrada} resize-none`}
            />
          </div>

          <button
            type="button"
            onClick={consultar}
            disabled={consultando || lugar.trim().length < 2}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {consultando ? "Pesquisando…" : "Montar rascunho"}
          </button>
        </div>
      </section>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {ressalvas.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            {ressalvas.length === 1
              ? "Um campo precisa da sua conferência"
              : `${ressalvas.length} campos precisam da sua conferência`}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {ressalvas.map((r) => (
              <li key={r.campo}>
                <strong>{r.campo}</strong>: {r.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Ficha ─────────────────────────────────────────────────────── */}
      <form action={enviar} className="space-y-5">
        {inicial?.id && <input type="hidden" name="id" value={inicial.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome" className={rotulo}>
              Nome do destino *
            </label>
            <input
              id="nome"
              name="nome"
              required
              value={ficha.nome ?? ""}
              onChange={(e) => campo("nome", e.target.value)}
              className={entrada}
            />
          </div>

          <div>
            <label htmlFor="pais" className={rotulo}>
              País *
            </label>
            <input
              id="pais"
              name="pais"
              required
              value={ficha.pais ?? ""}
              onChange={(e) => campo("pais", e.target.value)}
              className={entrada}
            />
            <input type="hidden" name="paisCodigo" value={ficha.paisCodigo ?? ""} />
            <p className="mt-1 text-xs text-text-muted">
              Se ainda não existir, é criado junto.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="descricao" className={rotulo}>
            Descrição
            {marcado("descricao") && <span className="ml-2 text-xs text-amber-700">conferir</span>}
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={3}
            value={ficha.descricao ?? ""}
            onChange={(e) => campo("descricao", e.target.value)}
            className={`${entrada} resize-none ${marcado("descricao") ? atencao : ""}`}
          />
          <p className="mt-1 text-xs text-text-muted">
            É o que o Concierge lê para falar deste lugar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="latitude" className={rotulo}>
              Latitude
              {marcado("latitude") && <span className="ml-2 text-xs text-amber-700">conferir</span>}
              {marcado("coordenadas") && (
                <span className="ml-2 text-xs text-amber-700">conferir</span>
              )}
            </label>
            <input
              id="latitude"
              name="latitude"
              inputMode="decimal"
              value={ficha.latitude ?? ""}
              onChange={(e) => campo("latitude", Number(e.target.value) || null)}
              className={`${entrada} ${marcado("latitude") || marcado("coordenadas") ? atencao : ""}`}
            />
          </div>
          <div>
            <label htmlFor="longitude" className={rotulo}>
              Longitude
              {marcado("longitude") && (
                <span className="ml-2 text-xs text-amber-700">conferir</span>
              )}
            </label>
            <input
              id="longitude"
              name="longitude"
              inputMode="decimal"
              value={ficha.longitude ?? ""}
              onChange={(e) => campo("longitude", Number(e.target.value) || null)}
              className={`${entrada} ${marcado("longitude") || marcado("coordenadas") ? atencao : ""}`}
            />
          </div>
          <div>
            <label htmlFor="altitudeM" className={rotulo}>
              Altitude (m)
              {marcado("altitude") && <span className="ml-2 text-xs text-amber-700">conferir</span>}
            </label>
            <input
              id="altitudeM"
              name="altitudeM"
              inputMode="numeric"
              value={ficha.altitudeM ?? ""}
              onChange={(e) => campo("altitudeM", Number(e.target.value) || null)}
              className={`${entrada} ${marcado("altitude") ? atencao : ""}`}
            />
            <p className="mt-1 text-xs text-text-muted">
              Acima de 2500 m muda a preparação.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="climaTipo" className={rotulo}>
              Clima
            </label>
            <select
              id="climaTipo"
              name="climaTipo"
              value={ficha.climaTipo ?? ""}
              onChange={(e) => campo("climaTipo", e.target.value || null)}
              className={`${entrada} ${marcado("climaTipo") ? atencao : ""}`}
            >
              <option value="">—</option>
              {CLIMAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tempMinC" className={rotulo}>
              Mín. °C
            </label>
            <input
              id="tempMinC"
              name="tempMinC"
              inputMode="numeric"
              value={ficha.tempMinC ?? ""}
              onChange={(e) => campo("tempMinC", Number(e.target.value) || null)}
              className={`${entrada} ${marcado("tempMinC") || marcado("temperatura") ? atencao : ""}`}
            />
          </div>
          <div>
            <label htmlFor="tempMaxC" className={rotulo}>
              Máx. °C
            </label>
            <input
              id="tempMaxC"
              name="tempMaxC"
              inputMode="numeric"
              value={ficha.tempMaxC ?? ""}
              onChange={(e) => campo("tempMaxC", Number(e.target.value) || null)}
              className={`${entrada} ${marcado("tempMaxC") || marcado("temperatura") ? atencao : ""}`}
            />
          </div>
          <div>
            <label htmlFor="estacaoChuvosa" className={rotulo}>
              Chuva
            </label>
            <input
              id="estacaoChuvosa"
              name="estacaoChuvosa"
              placeholder="dez-mar"
              value={ficha.estacaoChuvosa ?? ""}
              onChange={(e) => campo("estacaoChuvosa", e.target.value || null)}
              className={entrada}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="timezone" className={rotulo}>
              Fuso horário
              {marcado("timezone") && <span className="ml-2 text-xs text-amber-700">conferir</span>}
            </label>
            <input
              id="timezone"
              name="timezone"
              placeholder="America/Sao_Paulo"
              value={ficha.timezone ?? ""}
              onChange={(e) => campo("timezone", e.target.value || null)}
              className={`${entrada} ${marcado("timezone") ? atencao : ""}`}
            />
          </div>
          <div>
            <label htmlFor="heroImage" className={rotulo}>
              Imagem de capa
            </label>
            <input
              id="heroImage"
              name="heroImage"
              placeholder="/images/destinations/kyoto.jpg"
              defaultValue={inicial?.heroImage ?? ""}
              className={entrada}
            />
          </div>
        </div>

        {/* ── Fotos ─────────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-base text-primary-700">
                Fotos do lugar
                {escolhidas.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-text-muted">
                    {escolhidas.length} selecionada{escolhidas.length > 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              <p className="mt-1 text-xs text-text-muted">
                Do Wikimedia Commons, só licenças que permitem uso comercial. A página
                alterna entre elas — por isso três, e não uma.
              </p>
            </div>
            <button
              type="button"
              onClick={() => reprocurarFotos(lugar || ficha.nome || "")}
              disabled={buscandoFotos || !(lugar || ficha.nome)}
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:border-secondary-400 disabled:opacity-50"
            >
              {buscandoFotos ? "Procurando…" : imagens.length ? "Procurar outras" : "Procurar fotos"}
            </button>
          </div>

          {erroFotos && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {erroFotos} Você também pode preencher a imagem de capa à mão, acima.
            </p>
          )}

          {imagens.length > 0 && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {imagens.map((img) => {
                  const fora = descartadas.has(img.url);
                  return (
                    <div
                      key={img.url}
                      className={`overflow-hidden rounded-lg border transition ${
                        fora ? "border-border opacity-40" : "border-secondary-400"
                      }`}
                    >
                      {/* next/image exigiria cadastrar upload.wikimedia.org em
                          remotePatterns; como a origem vem de busca e pode
                          variar, <img> é o que não quebra. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.titulo}
                        className="h-28 w-full object-cover"
                        loading="lazy"
                      />
                      <div className="space-y-1.5 p-2">
                        <p className="text-[11px] leading-snug text-text-muted">
                          {img.autor} · {img.licenca}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDescartadas((d) => {
                                const novo = new Set(d);
                                if (novo.has(img.url)) novo.delete(img.url);
                                else novo.add(img.url);
                                return novo;
                              })
                            }
                            className="text-[11px] font-medium text-primary-700 underline underline-offset-2"
                          >
                            {fora ? "usar" : "descartar"}
                          </button>
                          {img.paginaFonte && (
                            <a
                              href={img.paginaFonte}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-text-muted underline underline-offset-2"
                            >
                              origem
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-text-muted">
                O crédito de cada foto é gravado junto com ela e aparece no site.
                Licença livre exige atribuição — sem o nome do autor, a foto não
                entra.
              </p>
            </>
          )}

          <input type="hidden" name="galeria" value={JSON.stringify(escolhidas)} />
        </section>

        {/* ── O que a IA sugeriu e não vai para o banco ─────────────────── */}
        {veioDaIA && (ficha.copy || ficha.fotoSugerida || (ficha.avisos?.length ?? 0) > 0) && (
          <section className="rounded-xl border border-dashed border-border bg-warm-white p-5">
            <h3 className="font-heading text-base text-primary-700">
              Sugestões para você aproveitar
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Não são salvas automaticamente. Copie o que servir.
            </p>

            {ficha.copy && (
              <div className="mt-4">
                <p className={rotulo}>
                  Texto para a página
                  {marcado("copy") && (
                    <span className="ml-2 text-xs text-amber-700">
                      contém promessa — revise antes de usar
                    </span>
                  )}
                </p>
                <textarea
                  readOnly
                  rows={4}
                  value={ficha.copy}
                  className={`${entrada} resize-none bg-warm-gray/30 ${marcado("copy") ? atencao : ""}`}
                />
              </div>
            )}

            {ficha.fotoSugerida && (
              <div className="mt-4">
                <p className={rotulo}>Foto de capa</p>
                <p className="text-sm text-text-primary">{ficha.fotoSugerida}</p>
                {(ficha.fotoBusca?.length ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-text-muted">
                    Termos de busca: {ficha.fotoBusca!.join(" · ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-text-muted">
                  A IA não gera nem baixa a imagem — licença de foto se resolve com
                  gente. Coloque o arquivo em <code>public/images/destinations/</code>.
                </p>
              </div>
            )}

            {(ficha.avisos?.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className={rotulo}>Cuidados para quem vai</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">
                  {ficha.avisos!.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-text-muted">
                  Viram guia de viagem em Conteúdo, não campo do destino.
                </p>
              </div>
            )}
          </section>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={inicial?.ativo ?? true}
            className="h-4 w-4 rounded border-border"
          />
          Visível no site
        </label>

        <div className="flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-secondary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-secondary-700 disabled:opacity-50"
          >
            {pendente ? "Salvando…" : inicial?.id ? "Salvar alterações" : "Cadastrar destino"}
          </button>
          {salvo && <span className="text-sm text-green-700">Salvo.</span>}
        </div>
      </form>
    </div>
  );
}
