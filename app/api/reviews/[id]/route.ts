import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { reviewModerateSchema } from "@/lib/validation/review";
import { recomputeProductRating } from "@/lib/reviews";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** PATCH /api/reviews/[id] — modération (publier/rejeter) + recalcul note. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = reviewModerateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Statut invalide" }, { status: 422 });
  }

  await connectDB();
  const review = await Review.findById(params.id);
  if (!review) return Response.json({ error: "Introuvable" }, { status: 404 });

  review.status = parsed.data.status;
  await review.save();

  // Recalcule la note du produit (les avis publiés comptent seuls)
  if (review.product) await recomputeProductRating(review.product);

  return Response.json({ ok: true, review: serialize(review.toObject()) });
}

/** DELETE /api/reviews/[id] — suppression + recalcul note. */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  await connectDB();
  const review = await Review.findById(params.id);
  if (!review) return Response.json({ error: "Introuvable" }, { status: 404 });

  const productId = review.product;
  await review.deleteOne();
  if (productId) await recomputeProductRating(productId);

  return Response.json({ ok: true });
}
