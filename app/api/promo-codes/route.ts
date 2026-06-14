import { connectDB } from "@/lib/db";
import { PromoCode } from "@/lib/models/PromoCode";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { promoCreateSchema } from "@/lib/validation/promo";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** GET /api/promo-codes — liste (admin). */
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const codes = await PromoCode.find().sort({ createdAt: -1 }).lean();
  return Response.json({ codes: serialize(codes) });
}

/** POST /api/promo-codes — création (admin). */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = promoCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  await connectDB();
  const code = parsed.data.code.trim().toUpperCase();
  if (await PromoCode.exists({ code })) {
    return Response.json({ error: "Ce code existe déjà." }, { status: 409 });
  }

  const created = await PromoCode.create({ ...parsed.data, code });
  return Response.json({ code: serialize(created.toObject()) }, { status: 201 });
}
