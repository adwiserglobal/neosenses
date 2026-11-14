import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { emailInternoAutorizado } from "@/lib/auth/access";
import { PrimeiroAcessoForm } from "@/components/auth/PrimeiroAcessoForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Defina sua senha | NeoSenses",
  robots: { index: false, follow: false },
};

export default async function PrimeiroAcessoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !emailInternoAutorizado(user.email)) {
    redirect("/login?erro=sem-permissao");
  }

  if (user.app_metadata?.neosenses_force_password_change !== true) {
    redirect("/admin");
  }

  return <PrimeiroAcessoForm />;
}
