import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { recomputeProductRating } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const objectId = /^[0-9a-fA-F]{24}$/;

const bodySchema = z.object({
  ids: z.array(z.string().regex(objectId)).min(1).max(300),
  status: z.enum(["pending", "published", "rejected"]).optional(),
  action: z.enum(["update", "delete"]).optional().default("update"),
});

/**
 * POST /api/reviews/bulk — modération par lot (admin) :
 *  - { ids, status }            → publie/rejette en masse
 *  - { ids, action: "delete" }  → supprime en masse
 * Recalcule ensuite la note des produits concernés.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { ids, status, action } = parsed.data;

  await connectDB();

  // Produits impactés (pour recalcul de la note après l'opération)
  const affected = await Review.find({ _id: { $in: ids } }).select("product").lean();
  const productIds = Array.from(new Set(affected.map((r) => String(r.product)).filter(Boolean)));

  let count = 0;
  if (action === "delete") {
    const res = await Review.deleteMany({ _id: { $in: ids } });
    count = res.deletedCount ?? 0;
  } else if (status) {
    const res = await Review.updateMany({ _id: { $in: ids } }, { $set: { status } });
    count = res.modifiedCount ?? 0;
  } else {
    return Response.json({ error: "Aucune action fournie" }, { status: 400 });
  }

  for (const pid of productIds) await recomputeProductRating(pid);

  return Response.json({ ok: true, count });
}
