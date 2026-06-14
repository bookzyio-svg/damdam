import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Sécurité du back-office, en deux couches :
 *
 * 1) PORTAIL (HTTP Basic Auth) sur TOUT /admin, y compris /admin/login :
 *    sans l'identifiant/mot de passe d'accès, on ne voit même pas la page de
 *    connexion. Activé seulement si ADMIN_GATE_USER + ADMIN_GATE_PASSWORD sont
 *    définis (sinon on ne bloque pas, pour éviter de se verrouiller soi-même).
 *
 * 2) SESSION (NextAuth) : toute page /admin sauf /admin/login exige une session
 *    valide ; sinon redirection vers le login.
 */

const GATE_USER = process.env.ADMIN_GATE_USER;
const GATE_PASS = process.env.ADMIN_GATE_PASSWORD;

function gatePassed(req: NextRequest): boolean {
  // Portail désactivé tant qu'il n'est pas configuré (évite de tout verrouiller)
  if (!GATE_USER || !GATE_PASS) return true;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6)); // "user:pass"
    const i = decoded.indexOf(":");
    const user = decoded.slice(0, i);
    const pass = decoded.slice(i + 1);
    return user === GATE_USER && pass === GATE_PASS;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Portail Basic Auth sur tout /admin (login compris)
  if (!gatePassed(req)) {
    return new NextResponse("Authentification requise", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="DAMDAM Admin", charset="UTF-8"' },
    });
  }

  // 2) La page de login est accessible une fois le portail franchi
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 3) Le reste de /admin exige une session NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Tout le back-office, page de login incluse (le portail la protège aussi).
  matcher: ["/admin", "/admin/:path*"],
};
