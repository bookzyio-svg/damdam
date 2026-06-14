import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Client Gemini (serveur uniquement).
 *
 * Robustesse production :
 *  - le modèle est paramétrable via `GEMINI_MODEL` (défaut stable) ;
 *  - un modèle de secours `GEMINI_FALLBACK_MODEL` est utilisé automatiquement
 *    en cas d'erreur de quota (429) ou de permission (403) ;
 *  - sans clé API, les appels lèvent une erreur explicite (IA désactivée) — les
 *    appelants dégradent alors proprement (chatbot "indisponible", import en
 *    erreur claire).
 */

/** Modèle principal (paramétrable). Défaut : modèle rapide et stable. */
export function primaryModel(): string {
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

/** Modèle de secours (paramétrable). Défaut : variante allégée. */
export function fallbackModel(): string {
  return process.env.GEMINI_FALLBACK_MODEL || "gemini-1.5-flash-8b";
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Instancie un modèle Gemini par son nom. Lève si la clé API est absente. */
export function getGeminiModel(model: string = primaryModel()) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY manquant : fonctionnalité IA indisponible.");
  }
  return new GoogleGenerativeAI(key).getGenerativeModel({ model });
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Détecte une erreur récupérable par bascule de modèle (quota 429 / accès 403). */
export function isRecoverableGeminiError(err: any): boolean {
  const status = err?.status ?? err?.statusCode ?? err?.response?.status;
  if (status === 429 || status === 403) return true;
  const msg = String(err?.message || err || "");
  return /\b(429|403)\b|quota|rate limit|resource has been exhausted|permission|forbidden/i.test(msg);
}

/**
 * Exécute une opération Gemini avec bascule de modèle.
 * `fn(modelName)` est tenté sur le modèle principal puis, en cas d'erreur
 * récupérable (429/403), sur le modèle de secours. Toute autre erreur est
 * propagée immédiatement.
 */
export async function withModelFallback<T>(fn: (modelName: string) => Promise<T>): Promise<T> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY manquant : fonctionnalité IA indisponible.");
  }

  const models = [primaryModel(), fallbackModel()].filter((m, i, a) => a.indexOf(m) === i);
  let lastErr: any;

  for (const modelName of models) {
    try {
      return await fn(modelName);
    } catch (err) {
      lastErr = err;
      // Si l'erreur n'est pas un problème de quota/permission, inutile de basculer.
      if (!isRecoverableGeminiError(err)) throw err;
      console.warn(`[gemini] modèle "${modelName}" indisponible (quota/permission), bascule de secours…`);
    }
  }

  // Tous les modèles ont échoué sur une erreur récupérable.
  console.error("[gemini] tous les modèles indisponibles :", lastErr);
  throw new Error("Service IA momentanément indisponible (quota dépassé). Réessayez plus tard.");
}

/** Génération de texte « one-shot » avec bascule de modèle. */
export async function generateText(prompt: string): Promise<string> {
  return withModelFallback(async (modelName) => {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

/** Extrait un objet JSON d'une réponse LLM (gère les blocs ```json). */
export function parseJsonLoose<T = unknown>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const startArr = s.indexOf("[");
  const from = startArr !== -1 && (startArr < start || start === -1) ? startArr : start;
  if (from > 0) s = s.slice(from);
  return JSON.parse(s) as T;
}
