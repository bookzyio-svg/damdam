/**
 * Vérifie l'en-tête d'autorisation des crons : `Authorization: Bearer <CRON_SECRET>`.
 * Tous les endpoints /api/cron/* l'utilisent (§12).
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export function cronUnauthorized() {
  return Response.json({ error: "Non autorisé" }, { status: 401 });
}
