import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { requireAdmin } from "@/lib/auth-guard";
import { reviewCreateSchema } from "@/lib/validation/review";
import { serialize } from "@/lib/serialize";
import { checkRate, tooMany, isHoneypotFilled } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews
 *  - public : ?product=<id> → avis publiés du produit
 *  - admin  : ?status=pending|published|rejected|all → modération
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const status = searchParams.get("status");

  await connectDB();

  // Mode admin (liste de modération) si un statut est demandé
  if (status) {
    if (!(await requireAdmin())) {
      return Response.json({ error: "Non autorisé" }, { status: 401 });
    }
    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;
    if (product) filter.product = product;
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate("product", "title slug")
      .lean();
    return Response.json({ reviews: serialize(reviews) });
  }

  // Mode public : avis publiés d'un produit
  if (!product) {
    return Response.json({ error: "Paramètre product requis" }, { status: 400 });
  }
  const reviews = await Review.find({ product, status: "published" })
    .sort({ createdAt: -1 })
    .lean();
  return Response.json({ reviews: serialize(reviews) });
}

/** POST /api/reviews — dépôt d'avis depuis le storefront (mis en modération). */
export async function POST(req: Request) {
  const rl = checkRate(req, "review", 5, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const json = await req.json().catch(() => null);
  // Honeypot : on fait croire au bot que c'est passé, sans rien créer
  if (isHoneypotFilled((json as { website?: unknown })?.website)) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const parsed = reviewCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();
  const review = await Review.create({
    ...parsed.data,
    status: "pending", // modération avant publication
    verifiedPurchase: false,
  });

  return Response.json(
    { ok: true, review: serialize(review.toObject()) },
    { status: 201 },
  );
}
