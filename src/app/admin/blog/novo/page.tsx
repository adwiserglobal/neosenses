import { createAdminClient } from "@/lib/supabase/server";
import { EditorBlog } from "@/components/admin/EditorBlog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo artigo · NeoSenses", robots: { index: false } };

export default async function NovoArtigo() {
  const supabase = createAdminClient();
  const { data: categorias } = await supabase.from("blog_categories")
    .select("id, name").order("sort_order");
  return <EditorBlog categorias={categorias ?? []} />;
}
