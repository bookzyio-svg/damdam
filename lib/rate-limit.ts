/**
 * Rate-limiting simple en mémoire (par instance serverless) + helpers anti-spam.
 *
 * Suffisant pour bloquer le spam/abus basique. Pour une protection forte et
 * distribuée, brancher un store partagé (Upstash/Redis) — l'API reste la même.
 */

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

/** Renvoie { ok } selon un quota `limit` par fenêtre `windowMs` pour une clé. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** IP cliente (derrière proxy Vercel) — best effort. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Réponse 429 standard. */
export function tooMany(retryAfter: number) {
  return Response.json(
    { error: "Trop de requêtes. Réessayez dans un instant." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/** Helper combiné : applique un quota pour une action + l'IP. */
export function checkRate(req: Request, action: string, limit: number, windowMs: number) {
  return rateLimit(`${action}:${clientIp(req)}`, limit, windowMs);
}

/**
 * Honeypot : si le champ piège (souvent nommé "website"/"company") est rempli,
 * c'est très probablement un bot.
 */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
