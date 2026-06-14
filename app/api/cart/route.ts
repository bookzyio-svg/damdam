import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { checkRate, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  variantTitle: z.string().optional(),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
  image: z.string().optional(),
});

const bodySchema = z.object({
  token: z.string().min(8),
  email: z.string().email().optional(),
  items: z.array(itemSchema),
  subtotal: z.number().int().min(0),
});

/**
 * POST /api/cart — upsert du panier persistant (pour la relance panier
 * abandonné §12). Public : identifié par un token client opaque.
 */
export async function POST(req: Request) {
  const rl = checkRate(req, "cart", 40, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Données invalides" }, { status: 400 });
  }
  const { token, email, items, subtotal } = parsed.data;

  await connectDB();

  // Panier vidé → on le nettoie (sauf s'il a déjà été converti en commande)
  if (items.length === 0) {
    await Cart.findOneAndUpdate(
      { token },
      { $set: { items: [], subtotal: 0, lastActivityAt: new Date() } },
    );
    return Response.json({ ok: true });
  }

  await Cart.findOneAndUpdate(
    { token },
    {
      $set: {
        token,
        items: items.map((i) => ({
          productId: i.productId,
          title: i.title,
          variantTitle: i.variantTitle,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        subtotal,
        ...(email ? { email } : {}),
        lastActivityAt: new Date(),
        recovered: false,
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return Response.json({ ok: true });
}
