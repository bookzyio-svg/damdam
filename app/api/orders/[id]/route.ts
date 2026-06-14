import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/orders/[id] — détail complet (admin). */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const order = await Order.findById(params.id).lean();
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ order: serialize(order) });
}

const patchSchema = z.object({
  adminNotes: z.string().max(2000).optional(),
});

/** PATCH /api/orders/[id] — notes internes (admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Données invalides" }, { status: 422 });
  }

  await connectDB();
  const order = await Order.findByIdAndUpdate(
    params.id,
    { $set: parsed.data },
    { new: true },
  ).lean();
  if (!order) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ order: serialize(order) });
}
