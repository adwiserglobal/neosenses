import type { Metadata } from "next";
import { MigratedExperiencePage } from "@/components/experiences/MigratedExperience";
import { migratedExperienceBySlug } from "@/content/migratedExperiences";

const experience = migratedExperienceBySlug["tailandia-iluminada"];

export const metadata: Metadata = {
  title: "Tailândia Iluminada",
  description: experience.summary,
  alternates: { canonical: "/experiencias/tailandia-iluminada" },
  openGraph: { title: experience.title, description: experience.summary, images: [{ url: experience.hero }] },
};

export default function TailandiaIluminadaPage() {
  return <MigratedExperiencePage experience={experience} />;
}
