import { connectDB } from "@/lib/db";
import { PromoCode } from "@/lib/models/PromoCode";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { promoUpdateSchema } from "@/lib/validation/promo";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/promo-codes/[id] */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const code = await PromoCode.findById(params.id).lean();
  if (!code) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ code: serialize(code) });
}

/** PATCH /api/promo-codes/[id] */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = promoUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  await connectDB();
  const newCode = parsed.data.code.trim().toUpperCase();
  const clash = await PromoCode.findOne({ code: newCode, _id: { $ne: params.id } }).select("_id");
  if (clash) return Response.json({ error: "Ce code existe déjà." }, { status: 409 });

  const updated = await PromoCode.findByIdAndUpdate(
    params.id,
    { $set: { ...parsed.data, code: newCode } },
    { new: true },
  ).lean();
  if (!updated) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ code: serialize(updated) });
}

/** DELETE /api/promo-codes/[id] */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  await PromoCode.findByIdAndDelete(params.id);
  return Response.json({ ok: true });
}
