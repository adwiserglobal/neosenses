import type { Metadata } from "next";
import { MigratedExperiencePage } from "@/components/experiences/MigratedExperience";
import { migratedExperienceBySlug } from "@/content/migratedExperiences";

const experience = migratedExperienceBySlug["caminho-de-maria-madalena"];

export const metadata: Metadata = {
  title: "O Caminho de Maria Madalena",
  description: experience.summary,
  alternates: { canonical: "/experiencias/caminho-de-maria-madalena" },
  openGraph: { title: experience.title, description: experience.summary, images: [{ url: experience.hero }] },
};

export default function CaminhoDeMariaMadalenaPage() {
  return <MigratedExperiencePage experience={experience} />;
}
