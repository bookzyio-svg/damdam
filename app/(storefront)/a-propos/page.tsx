import type { Metadata } from "next";
import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw, Headset } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "À propos" };

const VALUES = [
  { icon: Truck, title: "Livraison suivie", text: "Chaque commande est suivie en temps réel, de l'entrepôt à votre porte." },
  { icon: ShieldCheck, title: "Paiement sécurisé", text: "Règlement par virement bancaire : sûr, sans frais cachés." },
  { icon: RotateCcw, title: "Retour 14 jours", text: "Vous changez d'avis ? Retour simple et remboursement rapide." },
  { icon: Headset, title: "SAV à l'écoute", text: "Une équipe réactive pour vous accompagner avant et après l'achat." },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const name = settings.store?.name || "Boutique high-tech";
  const slogan = settings.store?.slogan || "L'électroménager et la high-tech au meilleur prix";

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand to-brand-dark py-14 text-white">
        <div className="container-site max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">À propos de {name}</h1>
          <p className="mt-3 text-white/90">{slogan}</p>
        </div>
      </section>

      <div className="container-site max-w-3xl space-y-10 py-12">
        <section className="space-y-4 text-ink">
          <h2 className="text-2xl font-bold">Notre mission</h2>
          <p className="leading-relaxed text-muted">
            {name} rend la high-tech et l&apos;électroménager <b>accessibles à tous</b>, avec des prix
            justes, une sélection rigoureuse et un service irréprochable. Téléviseurs, électroménager,
            audio, informatique, téléphonie : nous rassemblons les meilleures marques pour vous
            simplifier la vie, sans compromis sur la qualité ni sur la confiance.
          </p>
          <p className="leading-relaxed text-muted">
            Nous gérons notre <b>propre service de livraison</b> avec un suivi en temps réel, et nous
            privilégions le <b>paiement par virement</b> pour des transactions sûres et transparentes.
          </p>
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-bold">Nos engagements</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <v.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-bold text-ink">{v.title}</div>
                  <div className="text-sm text-muted">{v.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-8 text-center">
          <h2 className="text-xl font-bold">Une question ?</h2>
          <p className="mt-1 text-muted">Notre équipe vous répond avec plaisir.</p>
          <Link href="/contact" className="btn-brand mt-4">Nous contacter</Link>
        </section>
      </div>
    </div>
  );
}
