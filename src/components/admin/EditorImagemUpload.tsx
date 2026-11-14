"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  Check,
  Crop,
  ImagePlus,
  Move,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  X,
  ZoomIn,
} from "lucide-react";

type Ponto = { x: number; y: number };
type Dimensoes = { width: number; height: number };
type Filtro = "original" | "neoimagens" | "dourado" | "terra" | "cinema";

type ReceitaFiltro = {
  nome: string;
  descricao: string;
  css: string;
  overlay: string | null;
};

const FILTROS: Record<Filtro, ReceitaFiltro> = {
  original: {
    nome: "Original",
    descricao: "Cores naturais",
    css: "",
    overlay: null,
  },
  neoimagens: {
    nome: "Neoimagens",
    descricao: "Terrosos, areia e dourado",
    css: "sepia(0.24) saturate(1.12) contrast(1.05) hue-rotate(-7deg)",
    overlay: "rgba(190, 145, 69, 0.16)",
  },
  dourado: {
    nome: "Dourado suave",
    descricao: "Luz quente e delicada",
    css: "sepia(0.16) saturate(1.08) brightness(1.035)",
    overlay: "rgba(220, 177, 97, 0.12)",
  },
  terra: {
    nome: "Terra",
    descricao: "Argila e tons naturais",
    css: "sepia(0.28) saturate(0.92) contrast(1.06)",
    overlay: "rgba(128, 82, 51, 0.13)",
  },
  cinema: {
    nome: "Cinema",
    descricao: "Contraste e sombras suaves",
    css: "contrast(1.13) saturate(0.88) brightness(0.96)",
    overlay: "rgba(42, 38, 31, 0.07)",
  },
};

interface Props {
  children: ReactNode;
  aspectRatio: number;
  onProcessed: (arquivo: File) => void | Promise<void>;
  disabled?: boolean;
  triggerClassName?: string;
  accept?: string;
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

function criarFiltro(brilho: number, contraste: number, saturacao: number, filtro: Filtro) {
  return [
    `brightness(${brilho / 100})`,
    `contrast(${contraste / 100})`,
    `saturate(${saturacao / 100})`,
    FILTROS[filtro].css,
  ].filter(Boolean).join(" ");
}

function lerImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error("Não foi possível abrir esta imagem."));
    imagem.src = src;
  });
}

function exportarBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

export function EditorImagemUpload({
  children,
  aspectRatio,
  onProcessed,
  disabled = false,
  triggerClassName = "block w-full text-left",
  accept = "image/jpeg,image/png,image/webp,image/avif",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; origemX: number; origemY: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [arquivoOriginal, setArquivoOriginal] = useState<File | null>(null);
  const [origem, setOrigem] = useState("");
  const [dimensoes, setDimensoes] = useState<Dimensoes | null>(null);
  const [stage, setStage] = useState<Dimensoes>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [posicao, setPosicao] = useState<Ponto>({ x: 0, y: 0 });
  const [brilho, setBrilho] = useState(100);
  const [contraste, setContraste] = useState(100);
  const [saturacao, setSaturacao] = useState(100);
  const [filtro, setFiltro] = useState<Filtro>("original");
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const receita = FILTROS[filtro];
  const filtroCSS = useMemo(
    () => criarFiltro(brilho, contraste, saturacao, filtro),
    [brilho, contraste, saturacao, filtro]
  );

  const fechar = useCallback((forcar = false) => {
    if (processando && !forcar) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setOrigem("");
    setArquivoOriginal(null);
    setDimensoes(null);
    setZoom(1);
    setPosicao({ x: 0, y: 0 });
    setBrilho(100);
    setContraste(100);
    setSaturacao(100);
    setFiltro("original");
    setErro("");
    setArrastando(false);
    dragRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }, [processando]);

  const encaixe = useMemo(() => {
    if (!dimensoes || !stage.width || !stage.height) return null;
    const escala = Math.max(stage.width / dimensoes.width, stage.height / dimensoes.height);
    return {
      width: dimensoes.width * escala,
      height: dimensoes.height * escala,
    };
  }, [dimensoes, stage]);

  useEffect(() => {
    if (!origem) return;
    let ativo = true;
    lerImagem(origem)
      .then((imagem) => {
        if (ativo) setDimensoes({ width: imagem.naturalWidth, height: imagem.naturalHeight });
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível abrir a imagem."));
    return () => { ativo = false; };
  }, [origem]);

  useEffect(() => {
    if (!origem || !stageRef.current) return;
    const elemento = stageRef.current;
    const medir = () => {
      const rect = elemento.getBoundingClientRect();
      setStage({ width: rect.width, height: rect.height });
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [origem]);

  useEffect(() => {
    if (!origem) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const teclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !processando) fechar();
    };
    window.addEventListener("keydown", teclado);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", teclado);
    };
  }, [origem, processando, fechar]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function selecionar(arquivo?: File) {
    if (!arquivo) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(arquivo.type)) {
      setErro("Escolha uma imagem JPG, PNG, WebP ou AVIF.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (arquivo.size > 25 * 1024 * 1024) {
      setErro("A imagem original deve ter até 25 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(arquivo);
    objectUrlRef.current = url;
    setArquivoOriginal(arquivo);
    setOrigem(url);
    setDimensoes(null);
    setZoom(1);
    setPosicao({ x: 0, y: 0 });
    setBrilho(100);
    setContraste(100);
    setSaturacao(100);
    setFiltro("original");
    setErro("");
  }

  function limitarPosicao(x: number, y: number, nivelZoom = zoom): Ponto {
    if (!encaixe || !stage.width || !stage.height) return { x, y };
    const limiteX = Math.max(0, (encaixe.width * nivelZoom - stage.width) / 2);
    const limiteY = Math.max(0, (encaixe.height * nivelZoom - stage.height) / 2);
    return {
      x: limitar(x, -limiteX, limiteX),
      y: limitar(y, -limiteY, limiteY),
    };
  }

  function iniciarArrasto(evento: PointerEvent<HTMLDivElement>) {
    if (evento.button !== 0) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    dragRef.current = {
      pointerId: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
      origemX: posicao.x,
      origemY: posicao.y,
    };
    setArrastando(true);
  }

  function moverImagem(evento: PointerEvent<HTMLDivElement>) {
    const inicio = dragRef.current;
    if (!inicio || inicio.pointerId !== evento.pointerId) return;
    setPosicao(limitarPosicao(
      inicio.origemX + evento.clientX - inicio.x,
      inicio.origemY + evento.clientY - inicio.y
    ));
  }

  function terminarArrasto(evento: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== evento.pointerId) return;
    dragRef.current = null;
    setArrastando(false);
  }

  function mudarZoom(valor: number) {
    setZoom(valor);
    setPosicao((atual) => limitarPosicao(atual.x, atual.y, valor));
  }

  function restaurar() {
    setZoom(1);
    setPosicao({ x: 0, y: 0 });
    setBrilho(100);
    setContraste(100);
    setSaturacao(100);
    setFiltro("original");
  }

  async function aplicar() {
    if (!origem || !arquivoOriginal || !dimensoes || !stage.width || !stage.height || !encaixe) return;
    setProcessando(true);
    setErro("");

    try {
      const imagem = await lerImagem(origem);
      const largura = Math.min(2400, Math.max(1600, Math.round(stage.width * 2)));
      const altura = Math.round(largura / aspectRatio);
      const escala = Math.max(largura / imagem.naturalWidth, altura / imagem.naturalHeight);
      const desenhoLargura = imagem.naturalWidth * escala * zoom;
      const desenhoAltura = imagem.naturalHeight * escala * zoom;
      const fatorSaida = largura / stage.width;

      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;
      const contexto = canvas.getContext("2d");
      if (!contexto) throw new Error("Seu navegador não conseguiu preparar a imagem.");

      contexto.filter = filtroCSS;
      contexto.drawImage(
        imagem,
        (largura - desenhoLargura) / 2 + posicao.x * fatorSaida,
        (altura - desenhoAltura) / 2 + posicao.y * fatorSaida,
        desenhoLargura,
        desenhoAltura
      );
      contexto.filter = "none";

      if (receita.overlay) {
        contexto.globalCompositeOperation = "soft-light";
        contexto.fillStyle = receita.overlay;
        contexto.fillRect(0, 0, largura, altura);
        contexto.globalCompositeOperation = "source-over";
      }

      let blob = await exportarBlob(canvas, "image/webp", 0.9);
      if (!blob) blob = await exportarBlob(canvas, "image/jpeg", 0.9);
      if (!blob) throw new Error("Não foi possível gerar a imagem editada.");

      for (const qualidade of [0.84, 0.78, 0.72, 0.66]) {
        if (blob.size <= 7.7 * 1024 * 1024) break;
        const comprimido = await exportarBlob(canvas, blob.type || "image/webp", qualidade);
        if (comprimido) blob = comprimido;
      }
      if (blob.size > 8 * 1024 * 1024) {
        throw new Error("A imagem ficou acima de 8 MB mesmo após a otimização. Reduza a área do corte ou escolha outra foto.");
      }

      const tipo = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/png" ? "png" : "webp";
      const nomeBase = arquivoOriginal.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 70) || "imagem";
      const final = new File([blob], `${nomeBase}-neo.${tipo}`, {
        type: blob.type || "image/webp",
        lastModified: Date.now(),
      });

      await onProcessed(final);
      fechar(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível aplicar os ajustes.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="contents">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(evento) => selecionar(evento.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setErro(""); inputRef.current?.click(); }}
        className={triggerClassName}
      >
        {children}
      </button>
      {erro && !origem && (
        <p role="alert" className="mt-2 text-xs text-red-700">{erro}</p>
      )}

      {origem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#1d1420]/75 p-3 backdrop-blur-sm sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-imagem-titulo"
            className="my-auto w-full max-w-6xl overflow-hidden rounded-[26px] border border-[#e7d9c2] bg-[#fcf8f0] shadow-[0_30px_100px_rgba(0,0,0,0.42)]"
          >
            <header className="flex items-center justify-between gap-4 border-b border-[#e8ddca] px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a17a39]">NeoSenses Studio</p>
                <h2 id="editor-imagem-titulo" className="mt-1 font-heading text-xl text-[#4b174e] sm:text-2xl">
                  Ajustar imagem
                </h2>
                <p className="mt-1 text-xs text-[#796d61]">O resultado editado será salvo no site, não apenas na prévia.</p>
              </div>
              <button
                type="button"
                onClick={() => fechar()}
                disabled={processando}
                aria-label="Fechar editor de imagem"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2d4bf] bg-white text-[#5b4a3a] transition hover:bg-[#f4ecdf] disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 bg-[#211c20] p-4 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
                  <span className="inline-flex items-center gap-2"><Crop className="h-3.5 w-3.5" /> Corte {Math.round(aspectRatio * 100) / 100}:1</span>
                  <span className="inline-flex items-center gap-2"><Move className="h-3.5 w-3.5" /> Arraste a imagem para reposicionar</span>
                </div>
                <div
                  ref={stageRef}
                  className={`relative mx-auto w-full overflow-hidden rounded-xl bg-[#171317] touch-none ${arrastando ? "cursor-grabbing" : "cursor-grab"}`}
                  style={{ aspectRatio: String(aspectRatio) }}
                  onPointerDown={iniciarArrasto}
                  onPointerMove={moverImagem}
                  onPointerUp={terminarArrasto}
                  onPointerCancel={terminarArrasto}
                >
                  {dimensoes && encaixe && (
                    <>
                      <img
                        src={origem}
                        alt="Prévia da imagem em edição"
                        draggable={false}
                        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                        style={{
                          width: encaixe.width,
                          height: encaixe.height,
                          transform: `translate(calc(-50% + ${posicao.x}px), calc(-50% + ${posicao.y}px)) scale(${zoom})`,
                          filter: filtroCSS,
                        }}
                      />
                      {receita.overlay && (
                        <div className="pointer-events-none absolute inset-0" style={{ background: receita.overlay, mixBlendMode: "soft-light" }} />
                      )}
                      <div className="pointer-events-none absolute inset-0 border border-white/20" />
                    </>
                  )}
                  {!dimensoes && <div className="absolute inset-0 animate-pulse bg-white/5" />}
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-white/70">
                  <ZoomIn className="h-4 w-4 shrink-0" />
                  <span className="w-12">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => mudarZoom(Number(e.target.value))}
                    className="min-w-0 flex-1 accent-[#d2a653]"
                    aria-label="Zoom da imagem"
                  />
                  <span className="w-12 text-right tabular-nums">{zoom.toFixed(2)}×</span>
                </div>
              </div>

              <aside className="space-y-5 p-5 sm:p-6">
                <section>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#4b174e]">
                    <ImagePlus className="h-4 w-4 text-[#a17a39]" />
                    Filtros
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FILTROS) as Filtro[]).map((chave) => (
                      <button
                        key={chave}
                        type="button"
                        aria-pressed={filtro === chave}
                        onClick={() => setFiltro(chave)}
                        className={`rounded-xl border p-3 text-left transition ${filtro === chave
                          ? "border-[#a77b31] bg-[#f5ecd9] ring-2 ring-[#c8a35b]/20"
                          : "border-[#e7dccb] bg-white hover:border-[#c9b28b]"}`}
                      >
                        <span
                          className="mb-2 block h-7 rounded-md"
                          style={{
                            background: chave === "neoimagens"
                              ? "linear-gradient(120deg,#79533c,#c29a50,#e4d3a4)"
                              : chave === "dourado"
                                ? "linear-gradient(120deg,#90734b,#d6b66d,#f0dfb4)"
                                : chave === "terra"
                                  ? "linear-gradient(120deg,#573b2c,#a76e4c,#d4b08c)"
                                  : chave === "cinema"
                                    ? "linear-gradient(120deg,#29272a,#8a8175,#c8c0b2)"
                                    : "linear-gradient(120deg,#879a86,#d5d2c4,#6f8aa5)",
                          }}
                        />
                        <span className="block text-xs font-semibold text-[#493947]">{FILTROS[chave].nome}</span>
                        <span className="mt-0.5 block text-[10px] leading-tight text-[#8a7a6c]">{FILTROS[chave].descricao}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 border-t border-[#e9dfd0] pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#4b174e]">
                    <SlidersHorizontal className="h-4 w-4 text-[#a17a39]" />
                    Ajustes de imagem
                  </div>
                  {([
                    { label: "Brilho", value: brilho, setter: setBrilho, icon: Sun },
                    { label: "Contraste", value: contraste, setter: setContraste, icon: SlidersHorizontal },
                    { label: "Saturação", value: saturacao, setter: setSaturacao, icon: Sun },
                  ] as const).map((item) => {
                    const Icon = item.icon;
                    return (
                      <label key={item.label} className="block">
                        <span className="mb-2 flex items-center justify-between text-xs font-medium text-[#635348]">
                          <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#a17a39]" />{item.label}</span>
                          <span className="tabular-nums text-[#8b7968]">{item.value}%</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          step={1}
                          value={item.value}
                          onChange={(e) => item.setter(Number(e.target.value))}
                          className="w-full accent-[#9a6a24]"
                          aria-label={item.label}
                        />
                      </label>
                    );
                  })}
                </section>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9dfd0] pt-4">
                  <button
                    type="button"
                    onClick={restaurar}
                    disabled={processando}
                    className="inline-flex items-center gap-2 text-xs font-medium text-[#7e6d5d] underline underline-offset-4 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                  </button>
                  <span className="text-[10px] text-[#998b7b]">Saída otimizada em WebP</span>
                </div>
              </aside>
            </div>

            {erro && (
              <div role="alert" className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
                {erro}
              </div>
            )}

            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e8ddca] bg-[#f8f2e8] px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => fechar()}
                disabled={processando}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-[#746457] transition hover:bg-white/70 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={aplicar}
                disabled={processando || !dimensoes}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4d145b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641770] disabled:cursor-wait disabled:opacity-55"
              >
                {processando ? "Aplicando ajustes..." : <><Check className="h-4 w-4" /> Aplicar e usar imagem</>}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
