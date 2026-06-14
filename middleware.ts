import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Sécurité du back-office, en deux couches :
 *
 * 1) PORTAIL (HTTP Basic Auth) sur TOUT /360-pilotage, y compris /360-pilotage/login :
 *    sans l'identifiant/mot de passe d'accès, on ne voit même pas la page de
 *    connexion. Activé seulement si ADMIN_GATE_USER + ADMIN_GATE_PASSWORD sont
 *    définis (sinon on ne bloque pas, pour éviter de se verrouiller soi-même).
 *
 * 2) SESSION (NextAuth) : toute page /360-pilotage sauf /360-pilotage/login exige une session
 *    valide ; sinon redirection vers le login.
 */

function gatePassed(req: NextRequest): boolean {
  // On nettoie les espaces/retours à la ligne parasites des variables d'env
  const expectedUser = (process.env.ADMIN_GATE_USER || "").trim();
  const expectedPass = (process.env.ADMIN_GATE_PASSWORD || "").trim();
  // Portail désactivé tant qu'il n'est pas configuré (évite de tout verrouiller)
  if (!expectedUser || !expectedPass) return true;

  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    // Décodage base64 -> octets -> UTF-8 (gère les accents/caractères spéciaux)
    const b64 = header.slice(6).trim();
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes); // "user:pass"
    const i = decoded.indexOf(":");
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    return user === expectedUser && pass === expectedPass;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Portail Basic Auth sur tout /360-pilotage (login compris)
  if (!gatePassed(req)) {
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accès restreint</title></head><body style="font-family:system-ui,sans-serif;display:flex;min-height:90vh;align-items:center;justify-content:center;text-align:center;color:#1f2937"><div><h1 style="font-size:20px;margin:0 0 8px">Accès restreint</h1><p style="color:#6b7280;margin:0">Cette zone est réservée. Rechargez la page pour saisir vos identifiants.</p></div></body></html>`;
    return new NextResponse(html, {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="DAMDAM Admin", charset="UTF-8"',
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  // 2) La page de login est accessible une fois le portail franchi
  if (pathname === "/360-pilotage/login") {
    return NextResponse.next();
  }

  // 3) Le reste de /360-pilotage exige une session NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/360-pilotage/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Tout le back-office, page de login incluse (le portail la protège aussi).
  matcher: ["/360-pilotage", "/360-pilotage/:path*"],
};
