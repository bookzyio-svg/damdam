import { z } from "zod";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { importFromUrl } from "@/lib/import/scrape";
import { createDrafts } from "@/lib/import/createDraft";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  url: z.string().url(),
  useAI: z.boolean().optional().default(false),
});

/**
 * POST /api/import/url — import depuis un lien Shopify / WooCommerce / site
 * quelconque (JSON-LD, Open Graph, secours IA). Crée des brouillons (§10).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const products = await importFromUrl(parsed.data.url, { useAI: parsed.data.useAI });
    const result = await createDrafts(products, { type: "url", ref: parsed.data.url });
    return Response.json({ ok: true, found: products.length, ...result });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Échec de l'import" }, { status: 422 });
  }
}
