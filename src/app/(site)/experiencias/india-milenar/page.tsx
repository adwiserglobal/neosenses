import type { Metadata } from "next";
import { MigratedExperiencePage } from "@/components/experiences/MigratedExperience";
import { migratedExperienceBySlug } from "@/content/migratedExperiences";

const experience = migratedExperienceBySlug["india-milenar"];

export const metadata: Metadata = {
  title: "Índia Milenar — Uma Peregrinação pela Índia",
  description: experience.summary,
  alternates: { canonical: "/experiencias/india-milenar" },
  openGraph: { title: experience.title, description: experience.summary, images: [{ url: experience.hero }] },
};

export default function IndiaMilenarPage() {
  return <MigratedExperiencePage experience={experience} />;
}
