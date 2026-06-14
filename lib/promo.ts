import { connectDB } from "@/lib/db";
import { PromoCode } from "@/lib/models/PromoCode";
import { Order } from "@/lib/models/Order";

export type PromoLine = {
  productId: string;
  categoryId?: string | null;
  lineTotal: number; // centimes
};

export type PromoResult =
  | {
      valid: true;
      discountCents: number;
      freeShipping: boolean;
      promo: { code: string; type: "percentage" | "fixed"; value: number };
    }
  | { valid: false; reason: string };

/**
 * Valide un code promo et calcule la remise — TOUJOURS côté serveur (§11).
 */
export async function validatePromo(
  codeRaw: string,
  ctx: { subtotal: number; lines: PromoLine[]; email?: string },
): Promise<PromoResult> {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return { valid: false, reason: "Code requis" };

  await connectDB();
  const promo = await PromoCode.findOne({ code });
  if (!promo || !promo.active) return { valid: false, reason: "Code invalide" };

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) return { valid: false, reason: "Code pas encore actif" };
  if (promo.expiresAt && now > promo.expiresAt) return { valid: false, reason: "Code expiré" };

  if (promo.minOrderAmount && ctx.subtotal < promo.minOrderAmount) {
    return { valid: false, reason: "Montant minimum non atteint" };
  }

  if (promo.maxUses != null && (promo.usedCount ?? 0) >= promo.maxUses) {
    return { valid: false, reason: "Code épuisé" };
  }

  if (promo.perCustomerLimit != null && ctx.email) {
    const used = await Order.countDocuments({
      "promoCode.code": code,
      "customer.email": ctx.email.toLowerCase(),
    });
    if (used >= promo.perCustomerLimit) {
      return { valid: false, reason: "Limite d'utilisation atteinte" };
    }
  }

  // Détermine l'assiette éligible selon le ciblage
  let eligible = ctx.subtotal;
  if (promo.appliesTo === "categories") {
    const ids = (promo.categoryIds ?? []).map((x) => String(x));
    eligible = ctx.lines
      .filter((l) => l.categoryId && ids.includes(String(l.categoryId)))
      .reduce((s, l) => s + l.lineTotal, 0);
  } else if (promo.appliesTo === "products") {
    const ids = (promo.productIds ?? []).map((x) => String(x));
    eligible = ctx.lines
      .filter((l) => ids.includes(String(l.productId)))
      .reduce((s, l) => s + l.lineTotal, 0);
  }

  if (eligible <= 0 && !promo.freeShipping) {
    return { valid: false, reason: "Ce code ne s'applique pas à votre panier" };
  }

  let discountCents = 0;
  if (promo.type === "percentage") {
    discountCents = Math.round((eligible * (promo.value ?? 0)) / 100);
  } else {
    discountCents = Math.min(promo.value ?? 0, eligible);
  }
  discountCents = Math.max(0, Math.min(discountCents, ctx.subtotal));

  return {
    valid: true,
    discountCents,
    freeShipping: Boolean(promo.freeShipping),
    promo: { code, type: promo.type as "percentage" | "fixed", value: promo.value ?? 0 },
  };
}
