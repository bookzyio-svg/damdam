"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavList from "@/components/admin/adminNav";

/** Bouton + tiroir de navigation pour le back-office sur mobile. */
export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(true)} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink">
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-ink text-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 text-lg font-extrabold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">B</span>
                Boutique<span className="-ml-1 text-brand">.</span>
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
