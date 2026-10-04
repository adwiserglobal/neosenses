import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { usuarioAtual } from "@/lib/actions/auth";
import { EditorBlog } from "@/components/admin/EditorBlog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar artigo · NeoSenses", robots: { index: false } };

export default async function EditarArtigo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = createAdminClient();
  const [artigo, categorias, perfil] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("blog_categories").select("id, name").order("sort_order"),
    usuarioAtual(),
  ]);
  if (artigo.error || !artigo.data) notFound();
  return <EditorBlog artigo={artigo.data} categorias={categorias.data ?? []} podeExcluir={perfil?.role === "admin"} />;
}
