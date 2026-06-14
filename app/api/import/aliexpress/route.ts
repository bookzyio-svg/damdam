import { z } from "zod";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { importFromAliExpress } from "@/lib/import/aliexpress";
import { createDrafts } from "@/lib/import/createDraft";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ input: z.string().min(4) });

/**
 * POST /api/import/aliexpress — import par ID/lien produit via l'API officielle
 * dropshipping. Crée un brouillon (§10).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Lien ou ID requis" }, { status: 400 });
  }

  try {
    const product = await importFromAliExpress(parsed.data.input);
    const result = await createDrafts([product], { type: "aliexpress", ref: parsed.data.input });
    return Response.json({ ok: true, found: 1, ...result });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Échec de l'import" }, { status: 422 });
  }
}
