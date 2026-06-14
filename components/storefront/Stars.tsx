import { cn } from "@/lib/utils/cn";

/** Étoiles d'avis (ambre) — affiche une note sur 5 avec demi-précision visuelle. */
export default function Stars({
  rating = 0,
  count,
  size = "sm",
}: {
  rating?: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("leading-none", size === "md" ? "text-base" : "text-sm")} aria-label={`${rating}/5`}>
        <span className="text-star">{"★".repeat(full)}</span>
        <span className="text-line">{"★".repeat(5 - full)}</span>
      </span>
      {count != null ? (
        <span className={cn("text-muted", size === "md" ? "text-sm" : "text-xs")}>
          ({count})
        </span>
      ) : null}
    </span>
  );
}
