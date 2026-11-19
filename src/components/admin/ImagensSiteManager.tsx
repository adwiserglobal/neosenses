"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Search, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EditorImagemUpload } from "@/components/admin/EditorImagemUpload";
import { prepararUploadImagemSite, salvarImagemDoSite } from "@/lib/actions/imagens";

export interface ImagemSiteItem {
  key: string;
  label: string;
  section: string;
  description: string;
  fallback: string;
  url: string;
  aspectRatio: number;
  alt: string;
}

export function ImagensSiteManager({ initialItems }: { initialItems: ImagemSiteItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busca, setBusca] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState("Todas");
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const secoes = useMemo(
    () => ["Todas", ...Array.from(new Set(items.map((item) => item.section)))],
    [items]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      const correspondeSecao = secaoAtiva === "Todas" || item.section === secaoAtiva;
      const correspondeBusca =
        !termo ||
        item.label.toLocaleLowerCase("pt-BR").includes(termo) ||
        item.description.toLocaleLowerCase("pt-BR").includes(termo);
      return correspondeSecao && correspondeBusca;
    });
  }, [items, busca, secaoAtiva]);

  async function processarImagem(chave: string, arquivo: File) {
    setErro("");
    setSucesso("");
    setEnviando(chave);

    try {
      const preparo = await prepararUploadImagemSite(chave, arquivo.name, arquivo.type, arquivo.size);
      if (!preparo.success || !preparo.bucket || !preparo.path || !preparo.token || !preparo.url) {
        throw new Error(preparo.error || "Não foi possível preparar o upload.");
      }

      const supabase = createClient();
      const upload = await supabase.storage
        .from(preparo.bucket)
        .uploadToSignedUrl(preparo.path, preparo.token, arquivo, {
          contentType: arquivo.type,
          cacheControl: "31536000",
        });

      if (upload.error) {
        console.error("[admin] upload de imagem do site:", upload.error.message);
        throw new Error("Não foi possível enviar a imagem. Tente novamente.");
      }

      const salvo = await salvarImagemDoSite(chave, preparo.url);
      if (!salvo.success) throw new Error(salvo.error || "Não foi possível publicar a imagem.");

      setItems((atuais) =>
        atuais.map((item) => (item.key === chave ? { ...item, url: preparo.url! } : item))
      );
      setSucesso("Imagem publicada. A página do site já foi atualizada.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível atualizar esta imagem.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e6d8c5] bg-[#fffaf2] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a17a39]">Biblioteca visual</p>
            <h1 className="mt-2 font-heading text-3xl text-[#42164a] sm:text-4xl">Imagens do site</h1>
            <p className="mt-2 text-sm leading-6 text-[#76685b]">
              Substitua as imagens institucionais sem mexer no código. Ao escolher uma foto,
              o NeoSenses Studio abre para ajustar o corte, brilho, contraste, saturação e filtros.
            </p>
          </div>
          <div className="flex h-16 items-center gap-3 rounded-xl border border-[#eadfce] bg-white px-4">
            <ImagePlus className="h-5 w-5 text-[#9b762e]" />
            <div>
              <p className="text-2xl font-semibold tabular-nums text-[#42164a]">{items.length}</p>
              <p className="text-xs text-[#796c60]">imagens editáveis</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a18c78]" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar imagem ou seção..."
              className="w-full rounded-xl border border-[#e4d8c8] bg-white py-3 pl-10 pr-4 text-sm text-[#463747] outline-none transition focus:border-[#a77a31] focus:ring-4 focus:ring-[#d5b46b]/15"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {secoes.map((secao) => (
              <button
                key={secao}
                type="button"
                onClick={() => setSecaoAtiva(secao)}
                aria-pressed={secaoAtiva === secao}
                className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                  secaoAtiva === secao
                    ? "border-[#4d145b] bg-[#4d145b] text-white"
                    : "border-[#e5d9c8] bg-white text-[#68594d] hover:border-[#b18b46]"
                }`}
              >
                {secao}
              </button>
            ))}
          </div>
        </div>
      </div>

      {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
      {sucesso && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="h-4 w-4" />{sucesso}</div>}

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9cbb8] bg-white/60 px-6 py-16 text-center text-sm text-[#786b5e]">
          Nenhuma imagem encontrada.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {filtradas.map((item) => (
            <article key={item.key} className="overflow-hidden rounded-2xl border border-[#e6d9c7] bg-white shadow-[0_8px_24px_rgba(49,25,35,0.045)]">
              <div className="relative overflow-hidden bg-[#eee3d4]" style={{ aspectRatio: String(item.aspectRatio) }}>
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1536px) 30vw, (min-width: 640px) 45vw, 100vw"
                  quality={80}
                  unoptimized={item.url.startsWith("https://") && !item.url.includes(".supabase.co/")}
                  className="object-cover"
                />
                {enviando === item.key && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#241627]/60 text-sm font-semibold text-white backdrop-blur-[2px]">
                    Publicando imagem...
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a17a39]">{item.section}</p>
                    <h2 className="mt-1 font-heading text-xl leading-tight text-[#42164a]">{item.label}</h2>
                  </div>
                  {item.url !== item.fallback && (
                    <span className="shrink-0 rounded-full bg-[#f3eddf] px-2.5 py-1 text-[10px] font-semibold text-[#82652d]">Personalizada</span>
                  )}
                </div>
                <p className="min-h-[2.5rem] text-xs leading-5 text-[#786b5f]">{item.description}</p>

                <EditorImagemUpload
                  aspectRatio={item.aspectRatio}
                  disabled={enviando !== null}
                  onProcessed={(arquivo) => processarImagem(item.key, arquivo)}
                  triggerClassName="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4d145b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#381044] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    {enviando === item.key ? "Enviando..." : "Substituir e editar"}
                  </span>
                </EditorImagemUpload>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs leading-5 text-[#807366]">
        As capas de experiências, destinos e artigos também usam o NeoSenses Studio nas respectivas telas de edição.
        Esta biblioteca reúne as imagens fixas das páginas institucionais e da Home.
      </p>
    </div>
  );
}
