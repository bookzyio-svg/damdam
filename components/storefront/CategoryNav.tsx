import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/navigation";
import { categoryIcon } from "@/components/storefront/categoryIcons";

/**
 * Barre de navigation catégories sous le header (§3) — style "onglets" propre :
 * icône + libellé, soulignement au survol, « Promotions » en accent rouge.
 */
export default function CategoryNav() {
  return (
    <nav className="border-b border-line bg-white shadow-sm">
      <div className="container-site flex items-center gap-0.5 overflow-x-auto">
        {NAV_CATEGORIES.map((c) => {
          const Icon = categoryIcon(c.slug);
          const isPromo = c.slug === "promotions";
          return (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className={`group flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium transition hover:border-brand ${
                isPromo ? "text-deal hover:text-deal" : "text-ink hover:text-brand"
              }`}
            >
              <Icon className={`h-4 w-4 ${isPromo ? "text-deal" : "text-muted group-hover:text-brand"}`} />
              {c.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
