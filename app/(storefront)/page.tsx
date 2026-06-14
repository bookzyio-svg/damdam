import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getHomeData, type ProductCardData } from "@/lib/storefront/queries";
import { getSettings } from "@/lib/settings";
import { NAV_CATEGORIES } from "@/lib/navigation";
import { categoryIcon } from "@/components/storefront/categoryIcons";
import FlashDealsSection from "@/components/storefront/FlashDealsSection";
import ProductGrid from "@/components/storefront/ProductGrid";
import HeroCarousel, { type Slide } from "@/components/storefront/HeroCarousel";
import NewsletterForm from "@/components/storefront/NewsletterForm";

// Bannières par défaut si l'admin n'en a pas encore configuré (Réglages → Bannières).
const DEFAULT_SLIDES: Slide[] = [
  {
    title: "L'électroménager & la high-tech au meilleur prix",
    subtitle: "Livraison suivie en temps réel · paiement sécurisé · retour 14 jours.",
    ctaText: "Voir les promotions",
    ctaHref: "/c/promotions",
  },
];

export const dynamic = "force-dynamic";

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-lg font-bold text-ink md:text-xl">{title}</h2>
      {href ? (
        <Link href={href} className="flex items-center gap-0.5 text-sm font-semibold text-brand hover:underline">
          Tout voir <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}

async function HomeContent() {
  // Résilient à un hoquet de base de données (build/prod) : on dégrade
  // proprement vers une page vide plutôt que de faire échouer le rendu.
  let flashDeals: ProductCardData[] = [];
  let featured: ProductCardData[] = [];
  let bestSellers: ProductCardData[] = [];
  let newest: ProductCardData[] = [];
  let categories: { name: string; slug: string; imageUrl?: string }[] = [];
  let settings: { homeBanners?: Slide[] } = {};
  try {
    const [home, s] = await Promise.all([getHomeData(), getSettings()]);
    flashDeals = home.flashDeals;
    featured = home.featured;
    bestSellers = home.bestSellers;
    newest = home.newest;
    categories = home.categories as { name: string; slug: string; imageUrl?: string }[];
    settings = s as unknown as { homeBanners?: Slide[] };
  } catch (e) {
    console.error("[home] données indisponibles:", e);
  }

  // Bannières configurées par l'admin (avec image), sinon repli par défaut
  const configured = (settings.homeBanners ?? [])
    .map((b) => ({
      imageUrl: b.imageUrl || "",
      title: b.title || "",
      subtitle: b.subtitle || "",
      ctaText: b.ctaText || "",
      ctaHref: b.ctaHref || "",
    }))
    .filter((b) => b.imageUrl || b.title);
  const slides: Slide[] = configured.length ? configured : DEFAULT_SLIDES;

  const catTiles: { label: string; slug: string; imageUrl?: string }[] =
    categories.length > 0
      ? categories.map((c) => ({ label: c.name, slug: c.slug, imageUrl: c.imageUrl }))
      : NAV_CATEGORIES.map((c) => ({ label: c.label, slug: c.slug }));

  const empty = bestSellers.length === 0 && flashDeals.length === 0 && featured.length === 0;

  return (
    <div className="bg-bg">
      {/* HERO — pleine largeur (bord à bord) */}
      <HeroCarousel slides={slides} fullBleed />

      <div className="container-site space-y-8 py-6">
        {/* CATÉGORIES — cartes avec image */}
        <section>
          <SectionHeader title="Parcourir par catégorie" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {catTiles.map((c) => {
              const Icon = categoryIcon(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/c/${c.slug}`}
                  className="group overflow-hidden rounded-xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand/10 via-surface to-surface">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-10 w-10 text-brand/70 transition group-hover:scale-110" />
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-2.5 text-center text-sm font-semibold text-ink transition group-hover:text-brand">
                    {c.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FLASH DEALS */}
        <FlashDealsSection deals={flashDeals} />

        {/* BEST-SELLERS */}
        {bestSellers.length ? (
          <section>
            <SectionHeader title="Meilleures ventes" href="/c/promotions" />
            <ProductGrid products={bestSellers} />
          </section>
        ) : null}

        {/* BANNIÈRES PROMO SECONDAIRES */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Link href="/c/promotions" className="group relative flex flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-br from-deal to-[#b3261a] p-7 text-white">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <span className="text-sm font-bold uppercase tracking-wide text-white/80">Bons plans</span>
            <span className="mt-1 text-2xl font-extrabold">Jusqu&apos;à -50 %</span>
            <span className="mt-1 text-sm text-white/90">Sur une sélection high-tech</span>
            <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-md bg-white px-4 py-2 text-sm font-bold text-deal">Voir les promos <ChevronRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/c/electromenager" className="group relative flex flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ink to-[#2a2f3a] p-7 text-white">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
            <span className="text-sm font-bold uppercase tracking-wide text-white/60">Équipez votre maison</span>
            <span className="mt-1 text-2xl font-extrabold">Électroménager</span>
            <span className="mt-1 text-sm text-white/80">Livraison suivie partout en Europe</span>
            <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-md bg-white px-4 py-2 text-sm font-bold text-ink">Découvrir <ChevronRight className="h-4 w-4" /></span>
          </Link>
        </section>

        {/* NOUVEAUTÉS */}
        {newest.length ? (
          <section>
            <SectionHeader title="Nouveautés" />
            <ProductGrid products={newest} />
          </section>
        ) : null}

        {/* COUPS DE CŒUR */}
        {featured.length ? (
          <section>
            <SectionHeader title="Nos coups de cœur" />
            <ProductGrid products={featured} />
          </section>
        ) : null}

        {/* NEWSLETTER */}
        <section className="overflow-hidden rounded-xl bg-gradient-to-r from-brand to-brand-dark p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold">Ne ratez aucune bonne affaire</h2>
          <p className="mx-auto mt-1 max-w-md text-white/90">Recevez nos meilleures offres et nos ventes flash en exclusivité.</p>
          <div className="mt-5 flex justify-center">
            <NewsletterForm variant="dark" source="home" />
          </div>
        </section>

        {empty ? (
          <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            Aucun produit publié pour le moment. Ajoutez des produits depuis le back-office
            (<Link href="/360-pilotage/produits/nouveau" className="text-brand underline">/360-pilotage/produits/nouveau</Link>) et passez-les en statut « Actif ».
          </p>
        ) : null}
      </div>
    </div>
  );
}
