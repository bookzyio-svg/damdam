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
  // Tout /admin sauf la page de login (et les assets internes Next gérés ailleurs)
  matcher: ["/admin/((?!login).*)"],
};
