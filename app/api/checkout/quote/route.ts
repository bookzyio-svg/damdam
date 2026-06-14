import { z } from "zod";
import { computeOrder } from "@/lib/checkout/compute";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantTitle: z.string().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .default([]),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  promoCode: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * POST /api/checkout/quote — devis (totaux + frais de port + remise) SANS créer
 * de commande. Utilisé par la page /checkout pour afficher le récapitulatif.
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  const result = await computeOrder(parsed.data);
  const settings = await getSettings();
  return Response.json({
    ...result,
    bankTransferNoticeThreshold: settings.bank?.transferNoticeThreshold ?? 50000,
  });
}
