import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { categoryCreateSchema } from "@/lib/validation/category";
import { uniqueSlug, slugify } from "@/lib/utils/slug";

export const dynamic = "force-dynamic";

/** GET /api/categories — liste publique (triée par ordre puis nom). */
export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  return Response.json({ categories: JSON.parse(JSON.stringify(categories)) });
}

/** POST /api/categories — création (admin). */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = categoryCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await connectDB();
  const { name, parent, imageUrl, order } = parsed.data;
  const slug = await uniqueSlug(parsed.data.slug || slugify(name), async (s) =>
    Boolean(await Category.exists({ slug: s })),
  );

  const category = await Category.create({
    name,
    slug,
    parent: parent || null,
    imageUrl: imageUrl || undefined,
    order: order ?? 0,
  });

  return Response.json(
    { category: JSON.parse(JSON.stringify(category.toObject())) },
    { status: 201 },
  );
}
