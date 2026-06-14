import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { productCreateSchema } from "@/lib/validation/product";
import { uniqueSlug, slugify } from "@/lib/utils/slug";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET /api/products — liste paginée et filtrable (back-office).
 * Query : q, status, category, page, limit, sort
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const category = searchParams.get("category")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const sort = searchParams.get("sort") || "-createdAt";

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  return Response.json({
    products: serialize(items),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

/** POST /api/products — création (admin). */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = productCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();
  const data = parsed.data;
  const slug = await uniqueSlug(data.slug || slugify(data.title), async (s) =>
    Boolean(await Product.exists({ slug: s })),
  );

  const product = await Product.create({
    ...data,
    slug,
    category: data.category || null,
    compareAtPrice: data.compareAtPrice ?? undefined,
    cost: data.cost ?? undefined,
  });

  return Response.json({ product: serialize(product.toObject()) }, { status: 201 });
}
