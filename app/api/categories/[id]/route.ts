import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { categoryUpdateSchema } from "@/lib/validation/category";
import { uniqueSlug, slugify } from "@/lib/utils/slug";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/categories/[id] */
export async function GET(_req: Request, { params }: Ctx) {
  await connectDB();
  const category = await Category.findById(params.id).lean();
  if (!category) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ category: JSON.parse(JSON.stringify(category)) });
}

/** PATCH /api/categories/[id] — mise à jour (admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = categoryUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();
  const category = await Category.findById(params.id);
  if (!category) return Response.json({ error: "Introuvable" }, { status: 404 });

  const d = parsed.data;
  if (d.name !== undefined) category.name = d.name;
  if (d.parent !== undefined) category.parent = (d.parent as never) || null;
  if (d.imageUrl !== undefined) category.imageUrl = d.imageUrl || undefined;
  if (d.order !== undefined) category.order = d.order;

  // Slug : régénéré si demandé explicitement ou si le nom change sans slug fourni
  if (d.slug) {
    category.slug = await uniqueSlug(slugify(d.slug), async (s) =>
      Boolean(await Category.exists({ slug: s, _id: { $ne: category._id } })),
    );
  }

  await category.save();
  return Response.json({ category: JSON.parse(JSON.stringify(category.toObject())) });
}

/** DELETE /api/categories/[id] — refuse si des produits y sont rattachés. */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  await connectDB();
  const count = await Product.countDocuments({ category: params.id });
  if (count > 0) {
    return Response.json(
      { error: `Impossible : ${count} produit(s) rattaché(s) à cette catégorie.` },
      { status: 409 },
    );
  }
  // Réaffecte les sous-catégories à la racine
  await Category.updateMany({ parent: params.id }, { $set: { parent: null } });
  await Category.findByIdAndDelete(params.id);
  return Response.json({ ok: true });
}
