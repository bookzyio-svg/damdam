import { z } from "zod";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { checkRate, tooMany, isHoneypotFilled } from "@/lib/rate-limit";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** GET /api/newsletter — liste des abonnés (admin). */
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const subscribers = await NewsletterSubscriber.find({ active: true }).sort({ createdAt: -1 }).limit(5000).lean();
  return Response.json({ subscribers: serialize(subscribers), count: subscribers.length });
}

const bodySchema = z.object({
  email: z.string().email(),
  source: z.string().max(40).optional(),
  website: z.string().optional(), // honeypot
});

/** POST /api/newsletter — inscription à la newsletter (capture d'email). */
export async function POST(req: Request) {
  const rl = checkRate(req, "newsletter", 5, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const json = await req.json().catch(() => null);
  if (isHoneypotFilled((json as { website?: unknown })?.website)) {
    return Response.json({ ok: true }); // bot : faux succès
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }

  await connectDB();
  await NewsletterSubscriber.findOneAndUpdate(
    { email: parsed.data.email.toLowerCase() },
    { $set: { email: parsed.data.email.toLowerCase(), active: true, source: parsed.data.source || "site" } },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return Response.json({ ok: true });
}
