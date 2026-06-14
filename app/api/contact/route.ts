import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email/send";
import { checkRate, tooMany, isHoneypotFilled } from "@/lib/rate-limit";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** GET /api/contact — liste des messages (admin). */
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean();
  return Response.json({ messages: serialize(messages) });
}

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().max(160).optional().default(""),
  message: z.string().min(5).max(4000),
  website: z.string().optional(), // honeypot
});

/** POST /api/contact — message de contact (stocké + envoyé au gérant). */
export async function POST(req: Request) {
  const rl = checkRate(req, "contact", 3, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const json = await req.json().catch(() => null);
  if (isHoneypotFilled((json as { website?: unknown })?.website)) {
    return Response.json({ ok: true }); // bot : faux succès
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Formulaire invalide" }, { status: 400 });
  }
  const { name, email, subject, message } = parsed.data;

  await connectDB();
  await ContactMessage.create({ name, email, subject, message });

  const settings = await getSettings();
  const to = settings.store?.email;
  if (to) {
    await sendEmail({ to, template: "admin-contact", data: { name, email, subject, message, settings: settings.toObject() } }).catch(() => {});
  }

  return Response.json({ ok: true });
}
