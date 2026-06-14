import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { rewriteProductCopy } from "@/lib/ai/rewrite";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productIds: z.array(z.string()).min(1).max(50),
});

/**
 * POST /api/import/rewrite — réécriture IA (Gemini) des titres/descriptions de
 * produits (anti-contenu dupliqué, SEO). L'admin relit puis publie (§10).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  if (!isGeminiConfigured()) {
    return Response.json({ error: "GEMINI_API_KEY manquant : réécriture IA indisponible." }, { status: 422 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Requête invalide" }, { status: 400 });

  await connectDB();
  const settings = await getSettings();
  const tone = settings.store?.slogan || settings.seo?.description || "";

  const rewritten: string[] = [];
  const errors: string[] = [];

  for (const id of parsed.data.productIds) {
    try {
      const product = await Product.findById(id);
      if (!product) { errors.push(`Produit ${id} introuvable`); continue; }
      const out = await rewriteProductCopy(
        { title: product.title, description: product.description ?? "", brand: product.brand ?? "" },
        tone,
      );
      product.title = out.title;
      product.shortDescription = out.shortDescription;
      product.description = out.description;
      if (out.seoTitle || out.seoDescription) {
        product.set("seo", { title: out.seoTitle, description: out.seoDescription });
      }
      await product.save();
      rewritten.push(id);
    } catch (e) {
      errors.push(`${id} : ${e instanceof Error ? e.message : "erreur"}`);
    }
  }

  return Response.json({ ok: true, rewritten: rewritten.length, errors });
}
