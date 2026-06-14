import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { reviewAdminCreateSchema } from "@/lib/validation/review";
import { recomputeProductRating } from "@/lib/reviews";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** POST /api/reviews/admin — ajout manuel d'un avis (admin, publié par défaut). */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = reviewAdminCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  await connectDB();
  const review = await Review.create(parsed.data);
  if (review.status === "published") await recomputeProductRating(parsed.data.product);

  return Response.json({ ok: true, review: serialize(review.toObject()) }, { status: 201 });
}
