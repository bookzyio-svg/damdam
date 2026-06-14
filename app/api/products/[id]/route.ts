import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { productUpdateSchema } from "@/lib/validation/product";
import { uniqueSlug, slugify } from "@/lib/utils/slug";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/products/[id] */
export async function GET(_req: Request, { params }: Ctx) {
  await connectDB();
  const product = await Product.findById(params.id)
    .populate("category", "name slug")
    .lean();
  if (!product) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ product: serialize(product) });
}

/** PATCH /api/products/[id] — mise à jour (admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();
  const product = await Product.findById(params.id);
  if (!product) return Response.json({ error: "Introuvable" }, { status: 404 });

  const d = parsed.data;

  // Slug régénéré uniquement si fourni explicitement
  if (d.slug) {
    product.slug = await uniqueSlug(slugify(d.slug), async (s) =>
      Boolean(await Product.exists({ slug: s, _id: { $ne: product._id } })),
    );
  }

  // Champs simples : on assigne ce qui est présent
  const assignable = [
    "title", "brand", "description", "shortDescription", "contentBlocks", "specs", "images",
    "price", "compareAtPrice", "cost", "sku", "barcode", "trackStock", "stock",
    "condition", "hasVariants", "options", "variants", "tags", "flashDeal",
    "status", "featured", "seo",
  ] as const;
  for (const key of assignable) {
    if (d[key] !== undefined) product.set(key, d[key]);
  }
  if (d.category !== undefined) product.set("category", d.category || null);

  await product.save();
  return Response.json({ product: serialize(product.toObject()) });
}

/** DELETE /api/products/[id] */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  await Product.findByIdAndDelete(params.id);
  return Response.json({ ok: true });
}
