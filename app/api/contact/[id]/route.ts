import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const patchSchema = z.object({ handled: z.boolean() });

/** PATCH /api/contact/[id] — marque traité / non traité (admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Données invalides" }, { status: 422 });

  await connectDB();
  const msg = await ContactMessage.findByIdAndUpdate(params.id, { $set: parsed.data }, { new: true }).lean();
  if (!msg) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ message: serialize(msg) });
}

/** DELETE /api/contact/[id] (admin). */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  await ContactMessage.findByIdAndDelete(params.id);
  return Response.json({ ok: true });
}
