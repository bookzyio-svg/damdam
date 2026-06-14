"use client";

import { useEffect, useState } from "react";

/** Compte à rebours (flash deals). Affiche jj hh:mm:ss jusqu'à `endsAt`. */
export default function Countdown({
  endsAt,
  className = "",
}: {
  endsAt: string;
  className?: string;
}) {
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining <= 0) {
    return <span className={className}>Offre terminée</span>;
  }

  const s = Math.floor(remaining / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const Box = ({ v, label }: { v: string; label: string }) => (
    <span className="flex flex-col items-center">
      <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-sm font-bold text-white tabular-nums">
        {v}
      </span>
      <span className="mt-0.5 text-[10px] uppercase text-muted">{label}</span>
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {days > 0 ? <Box v={String(days)} label="j" /> : null}
      <Box v={pad(hours)} label="h" />
      <Box v={pad(minutes)} label="min" />
      <Box v={pad(seconds)} label="s" />
    </span>
  );
}
