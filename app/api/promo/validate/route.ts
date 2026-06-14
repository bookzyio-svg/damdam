import { z } from "zod";
import { computeOrder } from "@/lib/checkout/compute";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantTitle: z.string().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  email: z.string().email().optional(),
});

/**
 * POST /api/promo/validate — valide un code et renvoie la remise calculée.
 * Recalcul systématique côté serveur (§11).
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ valid: false, error: "Requête invalide" }, { status: 400 });
  }

  const result = await computeOrder({
    items: parsed.data.items,
    promoCode: parsed.data.code,
    email: parsed.data.email,
  });

  const promoError = result.errors.find((e) => e.startsWith("Code promo"));
  if (!result.promo) {
    return Response.json({
      valid: false,
      error: promoError ? promoError.replace("Code promo : ", "") : "Code invalide",
    });
  }

  return Response.json({
    valid: true,
    code: result.promo.code,
    discount: result.discountTotal,
    freeShipping: result.freeShipping,
    subtotal: result.subtotal,
    shipping: result.shippingTotal,
    total: result.total,
  });
}
