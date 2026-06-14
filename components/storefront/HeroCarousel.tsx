"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
};

/**
 * Carrousel de bannières d'accueil — images plein cadre qui défilent
 * automatiquement (5 s), avec flèches et points. Pause au survol ; respecte
 * `prefers-reduced-motion` (pas d'auto-défilement).
 */
export default function HeroCarousel({ slides, fullBleed = false }: { slides: Slide[]; fullBleed?: boolean }) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current) setIndex((p) => (p + 1) % n);
    }, 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  const go = (i: number) => setIndex(((i % n) + n) % n);

  return (
    <div
      className={`relative overflow-hidden bg-ink ${fullBleed ? "" : "rounded-xl border border-line"}`}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {/* Piste */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => {
          const content = (
            <>
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imageUrl} alt={s.title || "Bannière"} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand to-brand-dark" />
              )}
              {/* Voile pour la lisibilité du texte */}
              {(s.title || s.subtitle || s.ctaText) && (
                <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/35 to-transparent" />
              )}
              <div className="absolute inset-0 flex items-center">
                <div className={fullBleed ? "container-site" : "px-6 md:px-12"}>
                  <div className="flex max-w-xl flex-col gap-2 text-white">
                    {s.title ? <h2 className="text-2xl font-extrabold leading-tight md:text-4xl lg:text-5xl">{s.title}</h2> : null}
                    {s.subtitle ? <p className="max-w-md text-sm text-white/90 md:text-lg">{s.subtitle}</p> : null}
                    {s.ctaText ? (
                      <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-5 py-2.5 text-sm font-bold text-brand shadow-sm transition group-hover:bg-white/90">
                        {s.ctaText} <ChevronRight className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          );
          return (
            <div key={i} className={`relative w-full shrink-0 ${fullBleed ? "h-[240px] sm:h-[340px] md:h-[420px] lg:h-[460px]" : "h-[220px] sm:h-[300px] md:h-[380px]"}`}>
              {s.ctaHref ? (
                <Link href={s.ctaHref} className="group block h-full w-full">{content}</Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {/* Flèches */}
      {n > 1 ? (
        <>
          <button onClick={() => go(index - 1)} aria-label="Précédent" className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow hover:bg-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(index + 1)} aria-label="Suivant" className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow hover:bg-white">
            <ChevronRight className="h-5 w-5" />
          </button>
          {/* Points */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Aller à la bannière ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
