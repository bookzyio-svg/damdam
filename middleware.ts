import { withAuth } from "next-auth/middleware";

/**
 * Protège tout /admin/** sauf /admin/login.
 * `withAuth` redirige vers la page de connexion (authOptions.pages.signIn)
 * si aucun token JWT valide n'est présent.
 */
export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  // /admin EXACT (le tableau de bord) + tout /admin/** SAUF la page de login.
  // Sans la 1re entrée, /admin (racine) n'était pas protégé → faille corrigée.
  matcher: ["/admin", "/admin/((?!login).*)"],
};
