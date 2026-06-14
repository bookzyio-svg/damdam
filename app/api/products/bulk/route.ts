import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

const objectId = /^[0-9a-fA-F]{24}$/;

const bodySchema = z.object({
  ids: z.array(z.string().regex(objectId)).min(1).max(500),
  status: z.enum(["active", "draft", "archived"]).optional(),
  category: z.string().regex(objectId).nullable().optional(),
  action: z.enum(["update", "delete"]).optional().default("update"),
});

/**
 * POST /api/products/bulk — actions par lot (admin) :
 *  - { ids, status }            → change le statut de tous (publication immédiate)
 *  - { ids, category }          → assigne/retire la catégorie de tous
 *  - { ids, action: "delete" }  → supprime tous
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide", details: parsed.error.flatten() }, { status: 400 });
  }
  const { ids, status, category, action } = parsed.data;

  await connectDB();

  if (action === "delete") {
    const res = await Product.deleteMany({ _id: { $in: ids } });
    return Response.json({ ok: true, deleted: res.deletedCount ?? 0 });
  }

  const set: Record<string, unknown> = {};
  if (status !== undefined) set.status = status;
  if (category !== undefined) set.category = category || null;
  if (Object.keys(set).length === 0) {
    return Response.json({ error: "Aucune modification fournie" }, { status: 400 });
  }

  const res = await Product.updateMany({ _id: { $in: ids } }, { $set: set });
  return Response.json({ ok: true, modified: res.modifiedCount ?? 0 });
}
