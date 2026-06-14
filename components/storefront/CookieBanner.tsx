"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/** Bandeau cookies basique (§14) — consentement stocké en localStorage. */
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("bh_cookies_ok")) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-4 shadow-2xl backdrop-blur">
      <div className="container-site flex flex-col items-center gap-3 text-sm sm:flex-row">
        <p className="flex-1 text-ink">
          Nous utilisons des cookies essentiels au bon fonctionnement du site (panier, session).{" "}
          <Link href="/confidentialite" className="text-brand underline">En savoir plus</Link>.
        </p>
        <button
          onClick={() => { localStorage.setItem("bh_cookies_ok", "1"); setShow(false); }}
          className="btn-brand shrink-0"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
