"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

const HERO_MARROCOS =
  "https://upload.wikimedia.org/wikipedia/commons/b/be/Agafay.jpg";

interface Props {
  index?: number;
}

/**
 * Card de transição para a landing de Marrocos.
 *
 * A experiência original ainda vive numa landing independente. Mantemos o
 * card separado dos dados do Supabase para ela aparecer no catálogo sem
 * inventar preço, duração, categoria ou disponibilidade que não estejam
 * cadastrados no banco principal.
 */
export function MarrocosExperienceCard({ index = 0 }: Props) {
  return (
    <motion.div
      data-anima=""
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href="/experiencias/marrocos-com-neosenses"
        className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-secondary-300/50 hover:shadow-card"
      >
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={HERO_MARROCOS}
            alt="Paisagem do deserto de Agafay, no Marrocos"
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-warm-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-700 backdrop-blur-sm">
            Jornada internacional
          </span>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3" />
            Marrocos
          </div>

          <h3 className="mb-2 font-heading text-lg leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
            Marrocos com NeoSenses
          </h3>

          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-text-muted">
            Conheça a experiência completa da NeoSenses no Marrocos.
          </p>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm italic text-text-muted">Consulte</span>
            <span className="text-sm font-medium text-secondary-500 transition-transform group-hover:translate-x-1">
              Conhecer →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
