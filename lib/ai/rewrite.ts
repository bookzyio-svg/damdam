import { generateText, parseJsonLoose } from "@/lib/ai/gemini";

export type RewrittenCopy = {
  title: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

/**
 * Réécriture IA des titres/descriptions + SEO avec le ton de la boutique (§10),
 * pour éviter le contenu dupliqué et différencier l'offre. Bascule de modèle
 * automatique en cas de quota/permission ; erreur claire en dernier recours.
 */
export async function rewriteProductCopy(
  input: { title: string; description?: string; brand?: string },
  storeTone?: string,
): Promise<RewrittenCopy> {
  const prompt = `Tu es rédacteur e-commerce pour une boutique française d'électroménager et high-tech.
Réécris le contenu du produit pour qu'il soit unique, vendeur, clair et optimisé SEO,
SANS inventer de caractéristiques techniques ni de prix. Conserve la marque et le modèle.
${storeTone ? `Ton de la boutique : ${storeTone}` : ""}

Renvoie UNIQUEMENT un JSON valide :
{
  "title": string,            // titre produit concis et vendeur (max ~70 caractères)
  "shortDescription": string, // accroche d'une phrase
  "description": string,      // description détaillée (3 à 5 phrases), en français
  "seoTitle": string,         // balise <title> SEO (max ~60 caractères, avec la marque)
  "seoDescription": string    // méta description SEO incitative (max ~155 caractères)
}

Produit d'origine :
Titre : ${input.title}
Marque : ${input.brand || "—"}
Description : ${input.description || "(aucune)"}`;

  const text = await generateText(prompt);
  const raw = parseJsonLoose<Partial<RewrittenCopy>>(text);

  return {
    title: raw.title?.trim() || input.title,
    shortDescription: raw.shortDescription?.trim() || "",
    description: raw.description?.trim() || input.description || "",
    seoTitle: raw.seoTitle?.trim() || "",
    seoDescription: raw.seoDescription?.trim() || "",
  };
}

export type ImproveTarget = "title" | "description" | "seo";

/** Amélioration IA ciblée d'un seul champ (titre, description, ou SEO). */
export async function improveProductField(
  input: { title: string; description?: string; brand?: string },
  target: ImproveTarget,
  storeTone?: string,
): Promise<Partial<RewrittenCopy>> {
  let instruction: string;
  let shape: string;
  if (target === "title") {
    instruction = "Réécris UNIQUEMENT le titre produit : concis, vendeur, max ~70 caractères. Conserve la marque et le modèle, n'invente rien.";
    shape = `{ "title": string }`;
  } else if (target === "description") {
    instruction = "Réécris l'accroche courte (1 phrase) et la description détaillée (3 à 5 phrases), uniques et vendeuses, sans inventer de caractéristiques ni de prix.";
    shape = `{ "shortDescription": string, "description": string }`;
  } else {
    instruction = "Génère le titre SEO (balise <title>, max ~60 caractères, avec la marque) et la méta description SEO incitative (max ~155 caractères).";
    shape = `{ "seoTitle": string, "seoDescription": string }`;
  }

  const prompt = `Tu es rédacteur e-commerce pour une boutique française d'électroménager et high-tech.
${instruction}
${storeTone ? `Ton de la boutique : ${storeTone}` : ""}

Renvoie UNIQUEMENT un JSON valide : ${shape}

Produit :
Titre : ${input.title}
Marque : ${input.brand || "—"}
Description : ${input.description || "(aucune)"}`;

  const text = await generateText(prompt);
  return parseJsonLoose<Partial<RewrittenCopy>>(text);
}
