import type { Metadata } from "next";
import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";
import { CartProvider } from "@/components/cart/CartProvider";
import Header from "@/components/storefront/Header";
import CategoryNav from "@/components/storefront/CategoryNav";
import Footer from "@/components/storefront/Footer";
import NotFoundProducts from "@/components/storefront/NotFoundProducts";
import { NAV_CATEGORIES } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Page introuvable (404)",
  robots: { index: false },
};

/** 404 maison : message rassurant + accès catégories + sélection de produits. */
export default function NotFound() {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-bg">
        <Header />
        <CategoryNav />

        <main className="flex-1">
          <div className="container-site py-12 lg:py-16">
            {/* Bloc message */}
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-7xl font-extrabold tracking-tight text-brand">404</p>
              <h1 className="mt-3 text-2xl font-bold text-ink md:text-3xl">
                Oups, cette page est introuvable
              </h1>
              <p className="mt-2 text-muted">
                Le lien est peut-être erroné ou le produit n&apos;existe plus. Pas de panique,
                voici par où continuer.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/" className="btn-brand inline-flex items-center gap-2">
                  <Home className="h-4 w-4" /> Retour à l&apos;accueil
                </Link>
                <Link href="/recherche" className="btn-outline inline-flex items-center gap-2">
                  <Search className="h-4 w-4" /> Rechercher un produit
                </Link>
              </div>
            </div>

            {/* Boutons catégories */}
            <div className="mx-auto mt-10 max-w-3xl">
              <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-muted">
                Explorer les rayons
              </h2>
              <div className="flex flex-wrap justify-center gap-2.5">
                {NAV_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/c/${c.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
                  >
                    {c.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Produits populaires */}
            <section className="mt-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Nos produits populaires</h2>
                <Link href="/recherche" className="text-sm font-medium text-brand hover:underline">
                  Tout voir →
                </Link>
              </div>
              <NotFoundProducts />
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
