import { z } from "zod";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { improveProductField } from "@/lib/ai/rewrite";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  brand: z.string().optional(),
  target: z.enum(["title", "description", "seo"]),
});

/**
 * POST /api/products/improve — améliore UN champ ciblé (titre, description ou
 * SEO) via l'IA, SANS sauver (le formulaire applique puis enregistre).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  if (!isGeminiConfigured()) {
    return Response.json({ error: "GEMINI_API_KEY manquant : amélioration IA indisponible." }, { status: 422 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const settings = await getSettings();
    const tone = settings.store?.slogan || settings.seo?.description || "";
    const { target, ...input } = parsed.data;
    const out = await improveProductField(input, target, tone);
    return Response.json({ ok: true, ...out });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Échec de l'amélioration" }, { status: 502 });
  }
}
