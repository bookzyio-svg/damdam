"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Star,
  Users,
  MessagesSquare,
  Package,
  FolderTree,
  Upload,
  Ticket,
  Settings,
  Inbox,
  Send,
  type LucideIcon,
} from "lucide-react";

type NavLink = { label: string; href: string; icon: LucideIcon };
type NavSection = { title: string; links: NavLink[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Pilotage",
    links: [
      { label: "Tableau de bord", href: "/360-pilotage", icon: LayoutDashboard },
      { label: "Commandes", href: "/360-pilotage/commandes", icon: ShoppingBag },
      { label: "Avis", href: "/360-pilotage/avis", icon: Star },
      { label: "Clients", href: "/360-pilotage/clients", icon: Users },
      { label: "Conversations", href: "/360-pilotage/conversations", icon: MessagesSquare },
      { label: "Messages", href: "/360-pilotage/messages", icon: Inbox },
      { label: "Newsletter", href: "/360-pilotage/newsletter", icon: Send },
    ],
  },
  {
    title: "Catalogue",
    links: [
      { label: "Produits", href: "/360-pilotage/produits", icon: Package },
      { label: "Catégories", href: "/360-pilotage/categories", icon: FolderTree },
      { label: "Import", href: "/360-pilotage/import", icon: Upload },
      { label: "Codes promo", href: "/360-pilotage/codes-promo", icon: Ticket },
    ],
  },
  {
    title: "Configuration",
    links: [{ label: "Réglages", href: "/360-pilotage/reglages", icon: Settings }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/360-pilotage") return pathname === "/360-pilotage";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Liste de navigation partagée (sidebar desktop + tiroir mobile). */
export default function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {NAV_SECTIONS.map((s) => (
        <div key={s.title}>
          <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-white/40">{s.title}</div>
          <ul className="space-y-0.5">
            {s.links.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active ? "bg-brand text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <l.icon className="h-[18px] w-[18px]" />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
