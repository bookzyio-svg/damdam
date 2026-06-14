import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { getSettings } from "@/lib/settings";
import { validatePromo } from "@/lib/promo";

export type CheckoutInputItem = {
  productId: string;
  variantTitle?: string;
  quantity: number;
};

export type ComputedLine = {
  productId: string;
  title: string;
  variantTitle?: string;
  sku?: string;
  price: number; // centimes, prix unitaire faisant foi (serveur)
  quantity: number;
  image?: string;
  categoryId?: string | null;
};

export type ComputeResult = {
  ok: boolean;
  errors: string[];
  lines: ComputedLine[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  shippingEstimate: string;
  total: number;
  freeShipping: boolean;
  promo?: { code: string; type: "percentage" | "fixed"; value: number };
};

type ShippingZoneSetting = { postalCodePrefixes?: string[] | null; cost?: number | null; estimatedDays?: string | null };
type CountryRateSetting = { country?: string | null; cost?: number | null; estimatedDays?: string | null };
type ShippingSetting = {
  freeShippingThreshold?: number | null;
  flatRate?: number | null;
  zones?: ShippingZoneSetting[] | null;
  countryRates?: CountryRateSetting[] | null;
} | null;

/**
 * Frais de port + délai estimé selon les réglages :
 *  - hors France : forfait par pays (countryRates), sinon tarif forfaitaire ;
 *  - France : seuil de gratuité, puis zone par préfixe CP, puis forfait.
 */
function computeShipping(
  settings: { shipping?: ShippingSetting },
  subtotal: number,
  postalCode?: string,
  freeShipping?: boolean,
  country?: string,
): { cost: number; estimate: string } {
  const s = settings.shipping ?? {};

  // Livraison hors France : tarif + délai par pays (sinon forfait)
  if (country && country.trim() && country.trim().toLowerCase() !== "france") {
    const rate = (s.countryRates ?? []).find(
      (r) => (r.country ?? "").trim().toLowerCase() === country.trim().toLowerCase(),
    );
    return {
      cost: freeShipping ? 0 : rate ? rate.cost ?? 0 : s.flatRate ?? 0,
      estimate: (rate?.estimatedDays ?? "").trim(),
    };
  }

  // France
  let zoneEstimate = "";
  if (postalCode && s.zones?.length) {
    const zone = s.zones.find((z) =>
      (z.postalCodePrefixes ?? []).some((p) => postalCode.startsWith(p.trim())),
    );
    if (zone) {
      zoneEstimate = (zone.estimatedDays ?? "").trim();
      const threshold = s.freeShippingThreshold ?? 0;
      const free = freeShipping || (threshold > 0 && subtotal >= threshold);
      return { cost: free ? 0 : zone.cost ?? 0, estimate: zoneEstimate || "2 à 5 jours ouvrés" };
    }
  }

  const threshold = s.freeShippingThreshold ?? 0;
  const free = freeShipping || (threshold > 0 && subtotal >= threshold);
  return { cost: free ? 0 : s.flatRate ?? 0, estimate: zoneEstimate || "2 à 5 jours ouvrés" };
}

/**
 * Recalcule entièrement une commande côté serveur à partir des seuls IDs/quantités
 * fournis par le client (les prix client ne sont jamais utilisés).
 */
export async function computeOrder(input: {
  items: CheckoutInputItem[];
  postalCode?: string;
  country?: string;
  promoCode?: string;
  email?: string;
}): Promise<ComputeResult> {
  await connectDB();
  const errors: string[] = [];
  const lines: ComputedLine[] = [];

  if (!input.items?.length) {
    return emptyResult(["Panier vide"]);
  }

  const ids = input.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, status: "active" }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  for (const item of input.items) {
    const p = byId.get(item.productId);
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    if (!p) {
      errors.push("Un produit n'est plus disponible et a été retiré.");
      continue;
    }

    let price = p.price;
    let stock = p.stock ?? 0;
    let image = p.images?.[0]?.url;
    let sku = p.sku;

    if (item.variantTitle && p.hasVariants && p.variants?.length) {
      const v = p.variants.find((x) => x.title === item.variantTitle);
      if (v) {
        price = v.price ?? p.price;
        stock = v.stock ?? 0;
        image = v.image || image;
        sku = v.sku || sku;
      }
    }

    if (p.trackStock && qty > stock) {
      errors.push(
        stock > 0
          ? `Stock insuffisant pour « ${p.title} » (${stock} restant).`
          : `« ${p.title} » est en rupture de stock.`,
      );
      continue;
    }

    lines.push({
      productId: String(p._id),
      title: p.title,
      variantTitle: item.variantTitle,
      sku: sku || undefined,
      price,
      quantity: qty,
      image: image || undefined,
      categoryId: p.category ? String(p.category) : null,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  // Promo (optionnel)
  let discountTotal = 0;
  let freeShipping = false;
  let promo: ComputeResult["promo"];
  if (input.promoCode && lines.length) {
    const res = await validatePromo(input.promoCode, {
      subtotal,
      lines: lines.map((l) => ({ productId: l.productId, categoryId: l.categoryId, lineTotal: l.price * l.quantity })),
      email: input.email,
    });
    if (res.valid) {
      discountTotal = res.discountCents;
      freeShipping = res.freeShipping;
      promo = res.promo;
    } else {
      errors.push(`Code promo : ${res.reason}`);
    }
  }

  const settings = await getSettings();
  const shipping = computeShipping(settings.toObject(), subtotal, input.postalCode, freeShipping, input.country);
  const shippingTotal = shipping.cost;
  const total = Math.max(0, subtotal - discountTotal + shippingTotal);

  return {
    ok: errors.length === 0 && lines.length > 0,
    errors,
    lines,
    subtotal,
    discountTotal,
    shippingTotal,
    shippingEstimate: shipping.estimate,
    total,
    freeShipping,
    promo,
  };
}

function emptyResult(errors: string[]): ComputeResult {
  return {
    ok: false,
    errors,
    lines: [],
    subtotal: 0,
    discountTotal: 0,
    shippingTotal: 0,
    shippingEstimate: "",
    total: 0,
    freeShipping: false,
  };
}
