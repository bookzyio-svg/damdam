import SessionProvider from "@/components/admin/SessionProvider";

export const metadata = {
  title: "Back-office",
  robots: { index: false, follow: false },
};

/**
 * Layout racine du back-office : fournit le contexte de session NextAuth à
 * toutes les pages /admin (login compris). La « chrome » (sidebar) est gérée
 * par le sous-layout (panel) afin que la page de login reste plein écran.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
