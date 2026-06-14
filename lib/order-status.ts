/** Libellés et couleurs des statuts de commande (partagé admin / storefront). */
export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "En attente de virement", className: "bg-deal-soft text-deal" },
  paid: { label: "Payée", className: "bg-stock/15 text-stock" },
  preparing: { label: "En préparation", className: "bg-brand/10 text-brand" },
  shipped: { label: "Expédiée", className: "bg-brand/10 text-brand" },
  in_transit: { label: "En transit", className: "bg-brand/10 text-brand" },
  out_for_delivery: { label: "En livraison", className: "bg-brand/10 text-brand" },
  delivered: { label: "Livrée", className: "bg-stock/15 text-stock" },
  cancelled: { label: "Annulée", className: "bg-surface text-muted" },
  refunded: { label: "Remboursée", className: "bg-surface text-muted" },
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS[status]?.label ?? status;
}

/** Liste des statuts pour les filtres. */
export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, v]) => ({
  value,
  label: v.label,
}));
