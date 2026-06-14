import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/** GET /api/newsletter/export — export CSV des abonnés (admin). */
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const subs = await NewsletterSubscriber.find({ active: true }).sort({ createdAt: -1 }).lean();

  const rows = [
    "email,source,date",
    ...subs.map((s) => `${s.email ?? ""},${s.source ?? ""},${s.createdAt ? new Date(s.createdAt).toISOString() : ""}`),
  ];
  const csv = rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
