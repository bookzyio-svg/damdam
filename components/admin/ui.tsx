"use client";

import { cn } from "@/lib/utils/cn";

/* ============================================================
   Primitives UI du back-office (formulaires de réglages).
   ============================================================ */

export function Card({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
      {title ? (
        <header className="mb-5 border-b border-line pb-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink transition focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:bg-surface";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(inputBase, "min-h-[120px] resize-y", props.className)}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm font-medium text-ink"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}

/** Barre de sauvegarde : bouton + message de statut. */
export function SaveBar({
  saving,
  status,
}: {
  saving: boolean;
  status: { type: "idle" | "ok" | "error"; message?: string };
}) {
  return (
    <div className="mt-6 flex items-center gap-4 border-t border-line pt-4">
      <button type="submit" disabled={saving} className="btn-brand">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
      {status.type === "ok" ? (
        <span className="text-sm font-medium text-stock">
          ✓ {status.message || "Enregistré"}
        </span>
      ) : null}
      {status.type === "error" ? (
        <span className="text-sm font-medium text-deal">
          ✕ {status.message || "Erreur"}
        </span>
      ) : null}
    </div>
  );
}
