"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

/** Pagination conservant les filtres courants dans l'URL. */
export default function Pagination({ page, pages }: { page: number; pages: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pages <= 1) return null;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Fenêtre de pages autour de la page courante
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  const nums = [];
  for (let i = start; i <= end; i += 1) nums.push(i);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn-outline px-3 py-1.5 text-sm">‹ Préc.</Link>
      ) : null}
      {nums.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={`min-w-9 rounded-md px-3 py-1.5 text-center text-sm font-semibold ${
            n === page ? "bg-brand text-white" : "border border-line bg-white hover:bg-surface"
          }`}
        >
          {n}
        </Link>
      ))}
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className="btn-outline px-3 py-1.5 text-sm">Suiv. ›</Link>
      ) : null}
    </nav>
  );
}
