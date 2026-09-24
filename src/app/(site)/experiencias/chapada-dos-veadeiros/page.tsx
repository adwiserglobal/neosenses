import type { Metadata } from "next";
import { MigratedExperiencePage } from "@/components/experiences/MigratedExperience";
import { migratedExperienceBySlug } from "@/content/migratedExperiences";

const experience = migratedExperienceBySlug["chapada-dos-veadeiros"];

export const metadata: Metadata = {
  title: "Desvendando Shakti — Chapada dos Veadeiros",
  description: experience.summary,
  alternates: { canonical: "/experiencias/chapada-dos-veadeiros" },
  openGraph: { title: experience.title, description: experience.summary, images: [{ url: experience.hero }] },
};

export default function ChapadaDosVeadeirosPage() {
  return <MigratedExperiencePage experience={experience} />;
}
