import Link from "next/link";
import NavList from "@/components/admin/adminNav";

/** Sidebar du back-office (desktop) — sombre, icônes, état actif. */
export default function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start bg-ink text-white md:flex">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-4 text-lg font-extrabold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">B</span>
        Boutique<span className="-ml-1 text-brand">.</span>
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">Admin</span>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <NavList />
      </div>

      <div className="border-t border-white/10 px-5 py-3 text-[11px] text-white/40">
        © {new Date().getFullYear()} Boutique high-tech
      </div>
    </aside>
  );
}
