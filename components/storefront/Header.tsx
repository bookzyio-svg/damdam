import Link from "next/link";
import Image from "next/image";
import { Search, Truck, ShoppingCart } from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/navigation";
import CartCountBadge from "@/components/storefront/CartCountBadge";

/**
 * Header orienté recherche (§3) : logo + grosse barre de recherche avec
 * sélecteur de catégorie + bouton ; à droite suivi / panier. Sticky.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/40 bg-brand text-white">
      <div className="container-site flex items-center gap-3 py-3 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="Accueil">
          <Image src="/logo.png" alt="Boutique" width={176} height={55} priority className="h-9 w-auto sm:h-10" />
        </Link>

        {/* Barre de recherche avec sélecteur de catégorie */}
        <form
          action="/recherche"
          className="hidden flex-1 items-stretch overflow-hidden rounded-md bg-white text-ink sm:flex"
        >
          <select
            name="categorie"
            aria-label="Catégorie"
            className="shrink-0 border-r border-line bg-surface px-3 text-sm text-ink focus:outline-none"
            defaultValue=""
          >
            <option value="">Toutes catégories</option>
            {NAV_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            name="q"
            placeholder="Rechercher un produit, une marque…"
            className="min-w-0 flex-1 px-3 py-2.5 text-sm focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Rechercher"
            className="flex shrink-0 items-center gap-1.5 bg-star px-4 text-sm font-bold text-ink hover:brightness-95"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Rechercher</span>
          </button>
        </form>

        {/* Liens suivi / panier */}
        <nav className="ml-auto flex items-center gap-3 text-sm sm:gap-5">
          <Link href="/suivi" className="hidden flex-col items-center leading-tight hover:text-star md:flex">
            <Truck className="h-5 w-5" />
            <span className="text-[11px]">Suivi</span>
          </Link>
          <Link href="/panier" className="relative flex flex-col items-center leading-tight hover:text-star">
            <span className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-2 -top-2">
                <CartCountBadge />
              </span>
            </span>
            <span className="text-[11px] font-semibold">Panier</span>
          </Link>
        </nav>
      </div>

      {/* Recherche mobile */}
      <form action="/recherche" className="container-site flex pb-3 sm:hidden">
        <input
          type="search"
          name="q"
          placeholder="Rechercher un produit…"
          className="min-w-0 flex-1 rounded-l-md px-3 py-2 text-sm text-ink focus:outline-none"
        />
        <button type="submit" aria-label="Rechercher" className="rounded-r-md bg-star px-4 text-ink">
          <Search className="h-4 w-4" />
        </button>
      </form>
    </header>
  );
}
