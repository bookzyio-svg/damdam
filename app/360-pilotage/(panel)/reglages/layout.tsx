import Link from "next/link";

/** Sous-navigation des réglages (onglets). */
const TABS = [
  { label: "Boutique", href: "/360-pilotage/reglages/boutique" },
  { label: "Bannières", href: "/360-pilotage/reglages/bannieres" },
  { label: "Paiement", href: "/360-pilotage/reglages/paiement" },
  { label: "Livraison", href: "/360-pilotage/reglages/livraison" },
  { label: "Chatbot", href: "/360-pilotage/reglages/chatbot" },
  { label: "Relances", href: "/360-pilotage/reglages/relances" },
  { label: "Légal", href: "/360-pilotage/reglages/legal" },
];

export default function ReglagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">Réglages</h1>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-brand"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
