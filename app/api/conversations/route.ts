import { connectDB } from "@/lib/db";
import { ChatConversation } from "@/lib/models/ChatConversation";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** GET /api/conversations — liste des conversations du chatbot (admin). */
export async function GET(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const status = searchParams.get("status");

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (mode && mode !== "all") filter.mode = mode;
  if (status && status !== "all") filter.status = status;

  const convs = await ChatConversation.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
  const list = convs.map((c) => ({
    _id: c._id,
    sessionId: c.sessionId,
    customerEmail: c.customerEmail,
    mode: c.mode,
    status: c.status,
    unread: c.unread,
    lastMessage: c.messages?.[c.messages.length - 1]?.content?.slice(0, 80) ?? "",
    messageCount: c.messages?.length ?? 0,
    updatedAt: c.updatedAt,
  }));

  return Response.json({ conversations: serialize(list) });
}
