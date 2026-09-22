"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";
import { t, formatCurrency, podeOtimizar } from "@/lib/utils";
import type { ExperienceWithRelations } from "@/types/models";
import type { I18nField } from "@/types/models";

interface ExperienceCardProps {
  experience: ExperienceWithRelations;
  locale?: string;
  index?: number;
}

export function ExperienceCard({ experience, locale = "pt", index = 0 }: ExperienceCardProps) {
  const title = t(experience.title as I18nField, locale);
  const description = t(experience.short_description as I18nField, locale);
  const slug = t(experience.slug as I18nField, locale);
  const categoryName = experience.category ? t(experience.category.name as I18nField, locale) : "";
  const destinationName = experience.destination ? t(experience.destination.name as I18nField, locale) : "";

  return (
    <motion.div
      data-anima=""
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/experiencias/${slug}`}
        className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-secondary-300/50 hover:shadow-card"
      >
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden">
          {experience.hero_image ? (
            <Image
              src={experience.hero_image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              unoptimized={!podeOtimizar(experience.hero_image)}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            /* Sem foto cadastrada, o cartão não finge ter uma.
             *
             * O ícone cinza de "imagem" que morava aqui lia como imagem
             * quebrada — num catálogo de viagem de quinze a quarenta mil
             * reais, parece site com defeito. Este bloco assume a falta: o
             * escuro da marca e o nome do lugar em display, que é a
             * informação que a foto daria de qualquer forma.
             *
             * Não é solução definitiva: quatro das jornadas B2C estão sem
             * `hero_image` no banco, e foto de verdade vende mais que
             * tipografia. É a rede para enquanto elas não chegam — e para o
             * dia em que alguém cadastrar uma jornada com pressa. */
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-primary-700">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-forest-700/60 via-transparent to-primary-800"
              />
              <span className="relative px-6 text-center font-heading text-lg leading-snug text-secondary-300/80">
                {destinationName || title}
              </span>
            </div>
          )}

          {/* Category badge */}
          {categoryName && (
            <span className="absolute left-3 top-3 rounded-full bg-warm-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-700 backdrop-blur-sm">
              {categoryName}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Location + Duration */}
          <div className="mb-2 flex items-center gap-3 text-xs text-text-muted">
            {destinationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {destinationName}
              </span>
            )}
            {experience.duration_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {experience.duration_days} dias
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 font-heading text-lg leading-snug text-primary-700 transition-colors group-hover:text-secondary-500">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-text-muted">
              {description}
            </p>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            {experience.price_from ? (
              <div>
                <span className="text-xs text-text-muted">A partir de</span>
                <p className="text-lg font-semibold text-secondary-500">
                  {formatCurrency(experience.price_from, experience.price_currency)}
                </p>
              </div>
            ) : (
              <span className="text-sm italic text-text-muted">Consulte</span>
            )}
            <span className="text-sm font-medium text-secondary-500 transition-transform group-hover:translate-x-1">
              Conhecer →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Destination Card
interface DestinationCardProps {
  name: string;
  image?: string;
  href: string;
  experienceCount?: number;
  index?: number;
}

export function DestinationCard({ name, image, href, experienceCount, index = 0 }: DestinationCardProps) {
  return (
    <motion.div
      data-anima=""
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={href}
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={!podeOtimizar(image)}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-600 to-primary-800" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:from-black/60" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
          <h3 className="font-heading text-2xl text-white">{name}</h3>
          {experienceCount !== undefined && (
            <p className="mt-1 text-sm text-white/70">
              {experienceCount} {experienceCount === 1 ? "experiência" : "experiências"}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Testimonial Card
interface TestimonialCardProps {
  name: string;
  location?: string;
  quote: string;
  rating?: number;
  photo?: string;
  experienceTitle?: string;
}

export function TestimonialCard({ name, location, quote, rating, photo, experienceTitle }: TestimonialCardProps) {
  return (
    <div className="flex flex-col rounded-xl bg-warm-gray/50 p-8">
      {/* Stars */}
      {rating && (
        <div className="mb-4 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < rating ? "text-secondary-500" : "text-border"}`}>
              ★
            </span>
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote className="mb-6 flex-1 font-heading text-lg italic leading-relaxed text-primary-700">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-border pt-5">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            width={40}
            height={40}
            unoptimized={!podeOtimizar(photo)}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-sm font-semibold text-secondary-700">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-primary-700">{name}</p>
          <p className="text-xs text-text-muted">
            {[location, experienceTitle].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}

// Facilitator Card
interface FacilitatorCardProps {
  name: string;
  photo?: string;
  specializations?: string[];
  shortBio?: string;
  href: string;
}

export function FacilitatorCard({ name, photo, specializations, shortBio, href }: FacilitatorCardProps) {
  return (
    <Link href={href} className="group block text-center">
      <div className="relative mx-auto mb-4 h-40 w-40 overflow-hidden rounded-full border-2 border-border transition-all duration-300 group-hover:border-secondary-400 group-hover:shadow-lg">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            fill
            sizes="160px"
            unoptimized={!podeOtimizar(photo)}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-warm-gray text-4xl text-text-muted/30">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <h3 className="font-heading text-xl text-primary-700 transition-colors group-hover:text-secondary-500">
        {name}
      </h3>
      {specializations && specializations.length > 0 && (
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-secondary-500">
          {specializations.slice(0, 2).join(" · ")}
        </p>
      )}
      {shortBio && (
        <p className="mx-auto mt-3 line-clamp-3 max-w-xs text-sm text-text-muted">
          {shortBio}
        </p>
      )}
    </Link>
  );
}
