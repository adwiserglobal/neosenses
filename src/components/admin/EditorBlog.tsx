"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CorpoArtigo } from "@/components/blog/CorpoArtigo";
import { excluirArtigoBlog, salvarArtigoBlog } from "@/lib/actions/blog";
import { t } from "@/lib/utils";
import type { BlogPost, I18nField } from "@/types/models";

type Categoria = { id: string; name: unknown };
type ResultadoIA = {
  titulo: string; resumo: string; texto: string;
  geracao: Record<string, unknown>;
};
type Props = { artigo?: BlogPost | null; categorias: Categoria[]; podeExcluir?: boolean };

const campo = "w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-200/50";
const rotulo = "mb-2 block text-xs font-semibold uppercase tracking-[0.11em] text-primary-700";

export function EditorBlog({ artigo, categorias, podeExcluir = false }: Props) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(t(artigo?.title as I18nField, "pt"));
  const [slug, setSlug] = useState(t(artigo?.slug as I18nField, "pt"));
  const [resumo, setResumo] = useState(t(artigo?.excerpt as I18nField, "pt"));
  const [conteudo, setConteudo] = useState(t(artigo?.content as I18nField, "pt"));
  const [capa, setCapa] = useState(artigo?.featured_image || "");
  const [creditoCapa, setCreditoCapa] = useState(artigo?.featured_credit || "");
  const [categoriaId, setCategoriaId] = useState(artigo?.category_id || "");
  const [destaque, setDestaque] = useState(artigo?.is_featured ?? false);
  const [situacao, setSituacao] = useState(artigo?.status || "draft");
  const [geracao, setGeracao] = useState(artigo?.generation ? JSON.stringify(artigo.generation) : "");
  const [tema, setTema] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [previa, setPrevia] = useState(false);
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const capaRef = useRef<HTMLInputElement>(null);
  const corpoRef = useRef<HTMLInputElement>(null);
  const textoRef = useRef<HTMLTextAreaElement>(null);

  async function redigir(modo: "criar" | "revisar") {
    if (modo === "criar" && tema.trim().length < 5) return setErro("Descreva o assunto para a redatora.");
    if (modo === "revisar" && conteudo.trim().length < 20) return setErro("Escreva um texto antes de pedir uma revisão.");
    if (modo === "criar" && conteudo.trim() && !window.confirm("Substituir o texto atual pelo novo rascunho da IA?")) return;
    setErro(""); setAviso(""); setOcupado("ia");
    try {
      const response = await fetch("/api/admin/blog/redigir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo, tema, orientacoes, textoAtual: modo === "revisar" ? conteudo : "",
          tituloAtual: titulo,
        }),
      });
      const data = await response.json() as ResultadoIA & { error?: string; providersTried?: string };
      if (!response.ok) {
        const detalhe = data.providersTried ? ` Provedores tentados: ${data.providersTried}.` : "";
        throw new Error((data.error || "Não foi possível gerar o artigo.") + detalhe);
      }
      if (modo === "criar" || !titulo) setTitulo(data.titulo);
      setResumo(data.resumo);
      setConteudo(data.texto);
      setGeracao(JSON.stringify(data.geracao));
      setPrevia(false);
      setAviso("Rascunho pronto. Revise os fatos e a redação antes de publicar.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao chamar a redatora.");
    } finally { setOcupado(""); }
  }

  async function enviarImagem(file: File | null, destino: "capa" | "corpo") {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setErro("Escolha uma imagem JPG, PNG ou WebP com até 8 MB."); return;
    }
    setErro(""); setAviso(""); setOcupado(destino);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/blog/imagem", { method: "POST", body: form });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "O envio falhou.");
      if (destino === "capa") {
        setCapa(data.url);
        setAviso("Imagem de capa enviada.");
      } else {
        const legenda = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").slice(0, 100);
        const textoImagem = `\n\n![${legenda}](${data.url})\n\n`;
        const pos = textoRef.current?.selectionStart ?? conteudo.length;
        setConteudo((anterior) => anterior.slice(0, pos) + textoImagem + anterior.slice(pos));
        setAviso("Imagem inserida no artigo. Você pode editar a legenda no texto.");
      }
      setPrevia(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      if (capaRef.current) capaRef.current.value = "";
      if (corpoRef.current) corpoRef.current.value = "";
      setOcupado("");
    }
  }

  async function salvar(status: "draft" | "published" | "archived") {
    setErro(""); setAviso("");
    if (!titulo.trim()) return setErro("Informe o título.");
    if (status === "published") {
      if (resumo.trim().length < 20 || conteudo.trim().length < 150)
        return setErro("Antes de publicar, informe um resumo e revise o conteúdo completo.");
      if (!window.confirm("Você revisou os dados e autoriza a publicação deste artigo?")) return;
    }
    setOcupado("salvar");
    const form = new FormData();
    if (artigo?.id) form.set("id", artigo.id);
    form.set("title", titulo);
    form.set("slug", slug);
    form.set("excerpt", resumo);
    form.set("content", conteudo);
    form.set("featured_image", capa);
    form.set("featured_credit", creditoCapa);
    form.set("category_id", categoriaId);
    form.set("status", status);
    form.set("generation", geracao);
    if (destaque) form.set("is_featured", "on");
    try {
      const r = await salvarArtigoBlog(form);
      if (!r.success) throw new Error(r.error || "Não foi possível salvar.");
      setSituacao(status);
      if (r.slug) setSlug(r.slug);
      setAviso(status === "published"
        ? "Artigo publicado! Ele já pode aparecer no blog público."
        : "Artigo salvo com sucesso.");
      if (!artigo?.id && r.id) router.push(`/admin/blog/${r.id}`);
      router.refresh();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao salvar."); }
    finally { setOcupado(""); }
  }

  async function excluir() {
    if (!artigo || !podeExcluir || !window.confirm("Excluir permanentemente este artigo?")) return;
    setOcupado("excluir"); setErro("");
    try {
      const r = await excluirArtigoBlog(artigo.id);
      if (!r.success) throw new Error(r.error);
      router.push("/admin/blog");
      router.refresh();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao excluir."); }
    finally { setOcupado(""); }
  }

  const trabalhando = Boolean(ocupado);
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/blog" className="text-xs text-secondary-500 hover:underline">← Voltar aos artigos</Link>
          <h1 className="mt-2 font-heading text-3xl text-primary-700">{artigo ? "Editar artigo" : "Novo artigo"}</h1>
          <p className="mt-1 text-sm text-text-muted">Escreva do seu jeito. O site cuida da diagramação.</p>
        </div>
        <span className="rounded-full bg-secondary-50 px-4 py-2 text-xs font-semibold text-secondary-700">
          {situacao === "published" ? "No ar" : situacao === "archived" ? "Arquivado" : "Rascunho"}
        </span>
      </div>

      {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro}</div>}
      {aviso && <div role="status" className="rounded-lg border border-secondary-300 bg-secondary-50 p-4 text-sm text-primary-700">{aviso}</div>}

      <section className="rounded-2xl border border-secondary-300/45 bg-secondary-50/40 p-6 md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.17em] text-secondary-500">Sua redatora de IA</p>
        <h2 className="font-heading text-2xl text-primary-700">Sobre o que vamos escrever?</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="tema-ia" className={rotulo}>Assunto</label>
            <input id="tema-ia" className={campo} value={tema} onChange={(e) => setTema(e.target.value)} maxLength={500}
              placeholder="Ex.: Como uma viagem consciente pode transformar nosso olhar" />
          </div>
          <div>
            <label htmlFor="orientacoes-ia" className={rotulo}>O que a IA precisa saber? (opcional)</label>
            <textarea id="orientacoes-ia" className={campo} value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)}
              rows={3} maxLength={3000} placeholder="Conte sua ideia, os pontos principais, o tom e as informações que não podem faltar." />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={trabalhando} onClick={() => redigir("criar")}
              className="rounded-lg bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50">
              {ocupado === "ia" ? "Escrevendo…" : "Criar artigo com IA"}
            </button>
            <button type="button" disabled={trabalhando || conteudo.trim().length < 20} onClick={() => redigir("revisar")}
              className="rounded-lg border border-secondary-300 bg-surface px-6 py-3 text-sm font-semibold text-primary-700 hover:border-secondary-500 disabled:opacity-50">
              Melhorar meu texto
            </button>
          </div>
          <p className="text-xs leading-relaxed text-text-muted">A IA entrega somente um rascunho. Verifique datas, fatos e referências antes de publicar.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl text-primary-700">Seu artigo</h2>
          <button type="button" onClick={() => setPrevia((x) => !x)}
            className="rounded-lg border border-secondary-300 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-secondary-50">
            {previa ? "Voltar ao editor" : "Pré-visualizar"}
          </button>
        </div>
        {previa ? (
          <div className="rounded-xl border border-border bg-warm-white p-5 md:p-9">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary-500">Prévia do artigo</p>
            <h2 className="font-heading text-3xl leading-tight text-primary-700 md:text-4xl">{titulo || "Seu título"}</h2>
            {resumo && <p className="mt-4 text-base leading-relaxed text-text-muted">{resumo}</p>}
            {capa && <img src={capa} alt={titulo} className="my-7 aspect-video w-full rounded-xl object-cover" />}
            <div className="mt-7"><CorpoArtigo conteudo={conteudo} /></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="blog-titulo" className={rotulo}>Título *</label>
              <input id="blog-titulo" className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={180} placeholder="Título do artigo" />
            </div>
            <div>
              <label htmlFor="blog-resumo" className={rotulo}>Resumo para o blog e Google *</label>
              <textarea id="blog-resumo" className={campo} value={resumo} onChange={(e) => setResumo(e.target.value)} rows={3} maxLength={500}
                placeholder="Em duas frases, diga por que vale a pena ler." />
            </div>
            <div>
              <label className={rotulo}>Imagem de capa</label>
              {capa && <img src={capa} alt="Prévia da capa" className="mb-3 aspect-[16/7] w-full max-w-xl rounded-xl object-cover" />}
              <input ref={capaRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={trabalhando}
                onChange={(e) => enviarImagem(e.target.files?.[0] || null, "capa")} className="hidden" />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={trabalhando} onClick={() => capaRef.current?.click()}
                  className="rounded-lg border border-secondary-300 bg-secondary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 disabled:opacity-50">
                  {ocupado === "capa" ? "Enviando…" : capa ? "Trocar capa" : "Enviar foto de capa"}
                </button>
                {capa && <button type="button" onClick={() => setCapa("")} className="text-xs text-text-muted underline">Remover</button>}
                <span className="text-xs text-text-muted">JPG, PNG ou WebP · até 8 MB</span>
              </div>
              <input className={`mt-3 ${campo}`} value={creditoCapa} onChange={(e) => setCreditoCapa(e.target.value)}
                placeholder="Crédito da imagem (se necessário)" maxLength={300} aria-label="Crédito da imagem" />
            </div>
            <div>
              <label htmlFor="blog-conteudo" className={rotulo}>Texto completo *</label>
              <textarea ref={textoRef} id="blog-conteudo" className={`${campo} min-h-[400px] font-normal leading-[1.85]`}
                rows={19} value={conteudo} onChange={(e) => setConteudo(e.target.value)} maxLength={60000}
                placeholder="Escreva aqui ou peça um rascunho à redatora acima. Separe os parágrafos com uma linha em branco." />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <input ref={corpoRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={trabalhando}
                  onChange={(e) => enviarImagem(e.target.files?.[0] || null, "corpo")} className="hidden" />
                <button type="button" onClick={() => corpoRef.current?.click()} disabled={trabalhando}
                  className="rounded-lg border border-secondary-300 px-4 py-2 text-xs font-semibold text-primary-700 disabled:opacity-50">
                  {ocupado === "corpo" ? "Enviando…" : "+ Inserir imagem no texto"}
                </button>
                <span className="text-xs text-text-muted">Subtítulo: ## · Lista: - · Citação: &gt;</span>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="blog-categoria" className={rotulo}>Categoria (opcional)</label>
                <select id="blog-categoria" className={campo} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{t(c.name as I18nField, "pt")}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="blog-slug" className={rotulo}>Endereço do artigo (opcional)</label>
                <input id="blog-slug" className={campo} value={slug} onChange={(e) => setSlug(e.target.value)}
                  placeholder="Gerado automaticamente pelo título" />
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-primary-700">
              <input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} className="h-4 w-4 accent-primary-700" />
              Destacar no catálogo do blog
            </label>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-5">
        <button type="button" disabled={trabalhando} onClick={() => salvar("draft")}
          className="rounded-lg border border-primary-700 px-6 py-3 text-sm font-semibold text-primary-700 disabled:opacity-50">
          {ocupado === "salvar" ? "Salvando…" : "Salvar rascunho"}
        </button>
        <button type="button" disabled={trabalhando} onClick={() => salvar("published")}
          className="rounded-lg bg-primary-700 px-7 py-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
          Publicar artigo
        </button>
        {situacao === "published" && <button type="button" disabled={trabalhando} onClick={() => salvar("archived")}
          className="text-xs font-medium text-text-muted underline underline-offset-4">Retirar do ar</button>}
        {podeExcluir && artigo && <button type="button" disabled={trabalhando} onClick={excluir}
          className="ml-auto text-xs text-red-700 underline underline-offset-4 disabled:opacity-50">Excluir</button>}
      </div>
    </div>
  );
}
