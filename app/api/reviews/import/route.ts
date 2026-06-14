import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Product } from "@/lib/models/Product";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { parseSpreadsheet } from "@/lib/import/csv";
import { recomputeProductRating } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const SYN: Record<string, string[]> = {
  product: ["product", "produit", "slug", "product slug", "sku", "id", "produit slug"],
  author: ["author", "auteur", "nom", "name", "client"],
  rating: ["rating", "note", "stars", "étoiles", "etoiles"],
  title: ["title", "titre"],
  body: ["body", "avis", "commentaire", "comment", "review", "texte", "message"],
  status: ["status", "statut"],
};

function field(row: Record<string, string>, key: string): string {
  const keys = Object.keys(row);
  for (const syn of SYN[key]) {
    const k = keys.find((x) => x.toLowerCase() === syn) || keys.find((x) => x.toLowerCase().includes(syn));
    if (k && row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  return "";
}

/**
 * POST /api/reviews/import — import d'avis en masse via CSV/Excel (admin).
 * Colonnes : produit (slug ou ID), auteur, note (1-5), titre, avis, statut (optionnel).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Requête multipart invalide" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Aucun fichier" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows } = parseSpreadsheet(buffer);
  if (rows.length === 0) return Response.json({ error: "Fichier vide ou illisible" }, { status: 422 });

  await connectDB();

  // Cache de résolution produit (slug/id → _id)
  const slugCache = new Map<string, string | null>();
  async function resolveProductId(ref: string): Promise<string | null> {
    if (!ref) return null;
    if (OBJECT_ID.test(ref)) return ref;
    if (slugCache.has(ref)) return slugCache.get(ref)!;
    const p = await Product.findOne({ $or: [{ slug: ref }, { sku: ref }] }).select("_id").lean<{ _id: unknown }>();
    const id = p ? String(p._id) : null;
    slugCache.set(ref, id);
    return id;
  }

  let created = 0;
  const errors: string[] = [];
  const affected = new Set<string>();

  for (const row of rows) {
    const ref = field(row, "product");
    const productId = await resolveProductId(ref);
    if (!productId) { errors.push(`Produit introuvable : « ${ref || "?"} »`); continue; }

    const rating = Math.max(1, Math.min(5, parseInt(field(row, "rating"), 10) || 0));
    const body = field(row, "body");
    if (!rating || !body) { errors.push(`Ligne ignorée (note ou avis manquant) pour « ${ref} »`); continue; }

    const statusRaw = field(row, "status").toLowerCase();
    const status = (["pending", "published", "rejected"].includes(statusRaw) ? statusRaw : "published") as
      | "pending"
      | "published"
      | "rejected";

    try {
      await Review.create({
        product: productId,
        author: field(row, "author") || "Client",
        rating,
        title: field(row, "title"),
        body,
        status,
        verifiedPurchase: false,
      });
      created += 1;
      if (status === "published") affected.add(productId);
    } catch {
      errors.push(`Échec d'enregistrement pour « ${ref} »`);
    }
  }

  for (const pid of affected) await recomputeProductRating(pid);

  return Response.json({ ok: true, created, errors });
}
