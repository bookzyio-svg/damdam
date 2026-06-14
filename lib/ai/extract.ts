import { generateText, parseJsonLoose } from "@/lib/ai/gemini";
import { eurosToCents } from "@/lib/utils/money";
import type { NormalizedProduct } from "@/lib/import/createDraft";

/**
 * Extraction d'un produit depuis du HTML quelconque via Gemini (§10) — secours
 * quand ni JSON-LD ni Open Graph ne suffisent. Utilise la bascule de modèle
 * (quota/permission) ; en cas d'indisponibilité IA, lève une erreur claire que
 * la route d'import remonte à l'admin.
 */
export async function extractProductFromHtml(html: string, sourceUrl?: string): Promise<NormalizedProduct> {
  // On réduit le HTML pour limiter les tokens (on garde le début, souvent le plus utile)
  const trimmed = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").slice(0, 24000);

  const prompt = `Tu es un extracteur de fiches produit e-commerce. À partir du HTML ci-dessous,
renvoie UNIQUEMENT un objet JSON valide (sans texte autour) avec ces clés :
{
  "title": string,
  "price": number,            // prix de vente en EUROS (nombre, ex 129.99)
  "compareAtPrice": number|null, // prix barré en euros si présent
  "description": string,
  "brand": string|null,
  "images": string[],         // URLs absolues des images produit
  "specs": [{"label": string, "value": string}],
  "variants": [{"title": string}]
}
Si une information est absente, mets une valeur vide ou null. Ne devine pas de prix.
${sourceUrl ? `URL source : ${sourceUrl}` : ""}

HTML:
${trimmed}`;

  const text = await generateText(prompt);
  const raw = parseJsonLoose<{
    title?: string;
    price?: number;
    compareAtPrice?: number | null;
    description?: string;
    brand?: string | null;
    images?: string[];
    specs?: { label: string; value: string }[];
    variants?: { title: string }[];
  }>(text);

  if (!raw.title || !raw.price) {
    throw new Error("Extraction IA : titre ou prix introuvable.");
  }

  return {
    title: raw.title,
    description: raw.description || "",
    price: eurosToCents(raw.price),
    compareAtPrice: raw.compareAtPrice ? eurosToCents(raw.compareAtPrice) : null,
    brand: raw.brand || undefined,
    images: (raw.images || []).filter((u) => /^https?:\/\//i.test(u)),
    specs: raw.specs || [],
    variants: raw.variants?.length ? raw.variants.map((v) => ({ title: v.title })) : undefined,
  };
}
