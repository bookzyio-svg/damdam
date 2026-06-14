import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Garde d'authentification pour les routes API d'administration.
 * Renvoie la session si l'utilisateur est un admin connecté, sinon `null`.
 *
 *   const session = await requireAdmin();
 *   if (!session) return unauthorized();
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

/** Réponse 401 standard. */
export function unauthorized() {
  return Response.json({ error: "Non autorisé" }, { status: 401 });
}
