import { Timer } from "lucide-react";
import Countdown from "@/components/storefront/Countdown";
import ProductGrid from "@/components/storefront/ProductGrid";
import type { ProductCardData } from "@/lib/storefront/queries";

/**
 * Bannière flash deals avec compte à rebours (§3). Le countdown porte sur la
 * première offre qui se termine.
 */
export default function FlashDealsSection({ deals }: { deals: ProductCardData[] }) {
  if (deals.length === 0) return null;
  const nextEnd = deals
    .map((d) => d.flashDeal?.endsAt)
    .filter(Boolean)
    .sort()[0] as string | undefined;

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-deal/30 bg-deal-soft">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-deal/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-lg font-extrabold text-deal">
            <Timer className="h-5 w-5" /> Ventes flash
          </span>
          <span className="hidden text-sm text-muted sm:inline">Dépêchez-vous, les stocks partent vite</span>
        </div>
        {nextEnd ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">Se termine dans</span>
            <Countdown endsAt={nextEnd} />
          </div>
        ) : null}
      </header>
      <div className="p-4">
        <ProductGrid products={deals} />
      </div>
    </section>
  );
}
