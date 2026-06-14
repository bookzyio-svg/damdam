import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

// Inter partout (§3) — utilitaire, dense, rassurant
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DAMDAM Électroménager — Électroménager neuf & reconditionné, TV & High-Tech",
    template: "%s · DAMDAM Électroménager",
  },
  description:
    "DAMDAM Électroménager : gros et petit électroménager, TV, audio et high-tech, neufs et reconditionnés. Livraison suivie en temps réel, paiement sécurisé, retour 14 jours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
