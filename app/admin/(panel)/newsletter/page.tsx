import { Download } from "lucide-react";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  await connectDB();
  const subs = serialize(
    await NewsletterSubscriber.find({ active: true }).sort({ createdAt: -1 }).limit(2000).lean(),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <a href="/api/newsletter/export" className="btn-outline">
          <Download className="h-4 w-4" /> Exporter en CSV
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Email</th>
              <th className="p-3">Source</th>
              <th className="p-3">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted">Aucun abonné.</td></tr>
            ) : (
              subs.map((s: { _id: string; email: string; source?: string; createdAt?: string }) => (
                <tr key={s._id} className="border-b border-line/60">
                  <td className="p-3 font-medium text-ink">{s.email}</td>
                  <td className="p-3 text-muted">{s.source ?? "—"}</td>
                  <td className="p-3 text-muted">{s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{subs.length} abonné(s)</p>
    </div>
  );
}
