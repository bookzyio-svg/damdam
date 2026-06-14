"use client";

import { signOut, useSession } from "next-auth/react";
import { ExternalLink, LogOut } from "lucide-react";
import AdminMobileNav from "@/components/admin/AdminMobileNav";

/** Barre supérieure du back-office : lien boutique + utilisateur + déconnexion. */
export default function AdminTopbar() {
  const { data: session } = useSession();
  const name = session?.user?.name || "Administrateur";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <AdminMobileNav />
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
        >
          <ExternalLink className="h-4 w-4" /> Voir la boutique
        </a>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {initial}
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-semibold text-ink">{name}</div>
            {session?.user?.role ? (
              <div className="text-[11px] uppercase tracking-wide text-muted">{session.user.role}</div>
            ) : null}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/360-pilotage/login" })}
          aria-label="Déconnexion"
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-deal hover:text-deal"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
