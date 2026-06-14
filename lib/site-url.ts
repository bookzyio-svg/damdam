/**
 * URL publique du site, utilisable côté serveur (emails, liens de suivi).
 * On utilise NEXTAUTH_URL (variable serveur) plutôt que NEXT_PUBLIC_SITE_URL
 * pour respecter la convention « jamais de NEXT_PUBLIC_ dans un contexte serveur ».
 */
export const SITE_URL =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
