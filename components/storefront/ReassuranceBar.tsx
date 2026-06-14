import { Truck, ShieldCheck, RotateCcw, Headset, Tag, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Bandeau de réassurance DÉFILANT en boucle (ticker) : livraison suivie ·
 * paiement virement sécurisé · retour 14 j · SAV réactif · meilleurs prix…
 * Le contenu est dupliqué pour un défilement sans couture (translateX -50 %).
 */
const ITEMS: { icon: LucideIcon; text: string }[] = [
  { icon: Truck, text: "Livraison suivie en temps réel" },
  { icon: ShieldCheck, text: "Paiement par virement sécurisé" },
  { icon: RotateCcw, text: "Retour sous 14 jours" },
  { icon: Headset, text: "SAV réactif 7j/7" },
  { icon: Tag, text: "Les meilleurs prix high-tech" },
  { icon: CreditCard, text: "Aucun compte requis" },
];

function Group() {
  return (
    <>
      {ITEMS.map((it, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1.5 px-6 text-xs font-medium text-ink sm:text-sm">
          <it.icon className="h-4 w-4 text-brand" />
          {it.text}
          <span className="ml-6 h-1 w-1 rounded-full bg-line" aria-hidden />
        </span>
      ))}
    </>
  );
}

export default function ReassuranceBar() {
  return (
    <div className="marquee border-b border-line bg-surface py-2" aria-label="Nos engagements">
      {/* Deux groupes identiques : la piste fait 200 % de large, on translate de -50 % */}
      <div className="marquee-track">
        <Group />
        <Group />
      </div>
    </div>
  );
}
