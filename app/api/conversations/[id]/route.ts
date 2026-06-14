import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ChatConversation } from "@/lib/models/ChatConversation";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** GET /api/conversations/[id] — détail (et marque comme lu). */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const conv = await ChatConversation.findByIdAndUpdate(params.id, { $set: { unread: false } }, { new: true }).lean();
  if (!conv) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ conversation: serialize(conv) });
}

const patchSchema = z.object({
  mode: z.enum(["bot", "human"]).optional(),
  status: z.enum(["open", "closed"]).optional(),
});

/** PATCH /api/conversations/[id] — reprise en main / clôture. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Données invalides" }, { status: 422 });

  await connectDB();
  const conv = await ChatConversation.findByIdAndUpdate(params.id, { $set: parsed.data }, { new: true }).lean();
  if (!conv) return Response.json({ error: "Introuvable" }, { status: 404 });
  return Response.json({ conversation: serialize(conv) });
}
