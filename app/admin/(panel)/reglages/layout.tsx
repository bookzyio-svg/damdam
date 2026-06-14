import Link from "next/link";

/** Sous-navigation des réglages (onglets). */
const TABS = [
  { label: "Boutique", href: "/admin/reglages/boutique" },
  { label: "Bannières", href: "/admin/reglages/bannieres" },
  { label: "Paiement", href: "/admin/reglages/paiement" },
  { label: "Livraison", href: "/admin/reglages/livraison" },
  { label: "Chatbot", href: "/admin/reglages/chatbot" },
  { label: "Relances", href: "/admin/reglages/relances" },
  { label: "Légal", href: "/admin/reglages/legal" },
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
