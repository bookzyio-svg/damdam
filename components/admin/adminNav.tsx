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
      { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
      { label: "Commandes", href: "/admin/commandes", icon: ShoppingBag },
      { label: "Avis", href: "/admin/avis", icon: Star },
      { label: "Clients", href: "/admin/clients", icon: Users },
      { label: "Conversations", href: "/admin/conversations", icon: MessagesSquare },
      { label: "Messages", href: "/admin/messages", icon: Inbox },
      { label: "Newsletter", href: "/admin/newsletter", icon: Send },
    ],
  },
  {
    title: "Catalogue",
    links: [
      { label: "Produits", href: "/admin/produits", icon: Package },
      { label: "Catégories", href: "/admin/categories", icon: FolderTree },
      { label: "Import", href: "/admin/import", icon: Upload },
      { label: "Codes promo", href: "/admin/codes-promo", icon: Ticket },
    ],
  },
  {
    title: "Configuration",
    links: [{ label: "Réglages", href: "/admin/reglages", icon: Settings }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
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
