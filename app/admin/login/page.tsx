"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, LogIn, ShieldCheck } from "lucide-react";

/** Page de connexion du back-office (NextAuth credentials). */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants invalides.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const fieldCls =
    "w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink via-brand-dark to-brand px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        {/* En-tête de marque */}
        <div className="flex flex-col items-center gap-2 border-b border-line px-8 pb-6 pt-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-xl font-extrabold text-white">B</span>
          <h1 className="text-lg font-extrabold text-ink">Boutique <span className="text-brand">Admin</span></h1>
          <p className="text-sm text-muted">Connexion au back-office</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                placeholder="admin@boutique.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">Mot de passe</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-deal-soft px-3 py-2 text-sm font-medium text-deal">{error}</p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-brand w-full py-2.5">
            <LogIn className="h-4 w-4" /> {loading ? "Connexion…" : "Se connecter"}
          </button>

          <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Accès réservé · connexion sécurisée
          </p>
        </form>
      </div>
    </div>
  );
}
