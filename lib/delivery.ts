import { deliveryNumber } from "@/lib/utils/refs";

/**
 * Logique du transporteur maison (§8) — partagée entre la confirmation de
 * paiement (init) et le cron d'avancement automatique (Phase 7).
 */

export type DeliveryStep = {
  key: string;
  label: string;
  description?: string;
  autoAfterHours?: number;
  notifyCustomer?: boolean;
  order?: number;
};

/** Étapes par défaut si aucune n'est configurée dans les réglages. */
const DEFAULT_STEPS: DeliveryStep[] = [
  { key: "paiement_recu", label: "Paiement reçu", autoAfterHours: 0, notifyCustomer: true, order: 0 },
  { key: "preparation", label: "En préparation", autoAfterHours: 6, notifyCustomer: true, order: 1 },
  { key: "expedie", label: "Expédiée", autoAfterHours: 18, notifyCustomer: true, order: 2 },
  { key: "en_transit", label: "En transit", autoAfterHours: 24, notifyCustomer: true, order: 3 },
  { key: "en_livraison", label: "En cours de livraison", autoAfterHours: 24, notifyCustomer: true, order: 4 },
  { key: "livre", label: "Livré", autoAfterHours: 24, notifyCustomer: true, order: 5 },
];

type RawStep = {
  key?: string | null;
  label?: string | null;
  description?: string | null;
  autoAfterHours?: number | null;
  notifyCustomer?: boolean | null;
  order?: number | null;
};

/** Récupère les étapes triées par `order` (ou les étapes par défaut), normalisées. */
export function getDeliverySteps(settings: { deliverySteps?: RawStep[] | null }): DeliveryStep[] {
  const raw = settings.deliverySteps && settings.deliverySteps.length ? settings.deliverySteps : DEFAULT_STEPS;
  return [...raw]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s, i) => ({
      key: s.key || `etape_${i}`,
      label: s.label || s.key || `Étape ${i + 1}`,
      description: s.description ?? undefined,
      autoAfterHours: s.autoAfterHours ?? 0,
      notifyCustomer: s.notifyCustomer ?? true,
      order: s.order ?? i,
    }));
}

const HOUR = 3_600_000;

export type OrderStatusFromStep =
  | "preparing"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

/** Mapping étape de livraison → statut de commande. */
export function stepKeyToOrderStatus(key: string): OrderStatusFromStep | null {
  switch (key) {
    case "preparation":
      return "preparing";
    case "expedie":
      return "shipped";
    case "en_transit":
      return "in_transit";
    case "en_livraison":
      return "out_for_delivery";
    case "livre":
      return "delivered";
    default:
      return null;
  }
}

type TimelineEntry = { stepKey: string; label: string; note?: string; at: Date; notified: boolean };

/**
 * Construit l'objet `delivery` initial à la confirmation du paiement.
 *
 * Le paiement venant d'être confirmé, l'étape « Paiement reçu » est considérée
 * comme franchie : on démarre **directement à l'étape suivante** (« En
 * préparation »). La 1re étape est ajoutée à la timeline comme déjà faite.
 */
export function buildInitialDelivery(steps: DeliveryStep[], from: Date = new Date()) {
  const totalHours = steps.reduce((s, st) => s + (st.autoAfterHours ?? 0), 0);
  const startIndex = steps.length > 1 ? 1 : 0; // « préparation » si elle existe
  const startStep = steps[startIndex];

  const timeline: TimelineEntry[] = [];
  if (startIndex === 1) {
    // Étape paiement marquée comme franchie
    timeline.push({ stepKey: steps[0].key, label: steps[0].label, at: from, notified: true });
  }
  timeline.push({
    stepKey: startStep.key,
    label: startStep.label,
    note: startStep.description,
    at: from,
    notified: true, // notif couverte par l'email « paiement confirmé »
  });

  return {
    deliveryNumber: deliveryNumber(),
    currentStepKey: startStep.key,
    estimatedDelivery: new Date(from.getTime() + totalHours * HOUR),
    nextAutoAdvanceAt: nextAdvanceAt(steps, startIndex, from),
    timeline,
  };
}

/** Calcule la date du prochain avancement auto à partir d'une étape donnée. */
export function nextAdvanceAt(steps: DeliveryStep[], currentIndex: number, from: Date = new Date()): Date | undefined {
  const next = steps[currentIndex + 1];
  if (!next) return undefined;
  return new Date(from.getTime() + (next.autoAfterHours ?? 0) * HOUR);
}
