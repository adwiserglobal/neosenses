import type { Metadata } from "next";
import { MigratedExperiencePage } from "@/components/experiences/MigratedExperience";
import { migratedExperienceBySlug } from "@/content/migratedExperiences";

const experience = migratedExperienceBySlug["machu-picchu-xamanico"];

export const metadata: Metadata = {
  title: "Machu Picchu Xamânico",
  description: experience.summary,
  alternates: { canonical: "/experiencias/machu-picchu-xamanico" },
  openGraph: { title: experience.title, description: experience.summary, images: [{ url: experience.hero }] },
};

export default function MachuPicchuXamanicoPage() {
  return <MigratedExperiencePage experience={experience} />;
}
