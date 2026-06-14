import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ChatConversation } from "@/lib/models/ChatConversation";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const bodySchema = z.object({ message: z.string().min(1).max(2000) });

/**
 * POST /api/conversations/[id]/reply — réponse manuelle d'un conseiller.
 * Bascule la conversation en mode humain et l'apparaît côté client comme un
 * message "assistant".
 */
export async function POST(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Message requis" }, { status: 422 });

  await connectDB();
  const conv = await ChatConversation.findById(params.id);
  if (!conv) return Response.json({ error: "Introuvable" }, { status: 404 });

  conv.messages.push({ role: "assistant", content: parsed.data.message, at: new Date() });
  conv.mode = "human";
  conv.unread = false;
  await conv.save();

  return Response.json({ ok: true, conversation: serialize(conv.toObject()) });
}
