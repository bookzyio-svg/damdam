import { formatPrice } from "@/lib/utils/money";
import { SITE_URL } from "@/lib/site-url";
import { emailLayout, bankBlock, itemsBlock, button } from "@/lib/email/render";

const MUTED = "#6B7280";
const LINE = "#E5E7EB";

type OrderLike = {
  orderNumber: string;
  paymentReference: string;
  customer?: { name?: string };
  items: { title: string; variantTitle?: string; quantity: number; price: number }[];
  subtotal: number;
  discountTotal?: number;
  shippingTotal?: number;
  total: number;
  delivery?: { deliveryNumber?: string };
};
type SettingsLike = {
  store?: { name?: string };
  bank?: { titulaire?: string; iban?: string; bic?: string; banque?: string; instructions?: string };
};

function totalsBlock(order: OrderLike): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;color:${MUTED};font-size:13px;">${label}</td><td style="padding:4px 0;text-align:right;font-size:${strong ? 15 : 13}px;font-weight:${strong ? 800 : 400};">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid ${LINE};padding-top:8px;">
    ${row("Sous-total", formatPrice(order.subtotal))}
    ${order.discountTotal ? row("Remise", "-" + formatPrice(order.discountTotal)) : ""}
    ${row("Livraison", order.shippingTotal ? formatPrice(order.shippingTotal) : "Offerte")}
    ${row("Total à payer", formatPrice(order.total), true)}
  </table>`;
}

export type EmailTemplate =
  | "order-received"
  | "unpaid-reminder"
  | "payment-confirmed"
  | "delivery-update"
  | "order-delivered"
  | "abandoned-cart"
  | "admin-new-order"
  | "admin-contact";

/** Construit { subject, html } pour un template donné. */
export function buildTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): { subject: string; html: string } {
  const settings = (data.settings as SettingsLike) ?? {};
  const order = (data.order as OrderLike) ?? ({} as OrderLike);
  const storeName = settings.store?.name || "Boutique high-tech";
  const orderUrl = `${SITE_URL}/commande/${order.orderNumber}`;

  switch (template) {
    case "order-received": {
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">Merci pour votre commande${order.customer?.name ? `, ${order.customer.name}` : ""} !</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 16px;">
          Votre commande <b>${order.orderNumber}</b> est bien enregistrée. Pour la valider,
          effectuez un virement bancaire avec les informations ci-dessous.
          <b>Elle sera expédiée dès réception du virement.</b>
        </p>
        ${itemsBlock(order.items)}
        ${totalsBlock(order)}
        ${bankBlock(settings.bank ?? {}, order.total, order.paymentReference)}
        <p style="margin:16px 0;">${button(orderUrl, "Voir ma commande")}</p>`;
      return {
        subject: `Commande ${order.orderNumber} reçue — instructions de virement`,
        html: emailLayout({ title: "Commande reçue", storeName, bodyHtml: body }),
      };
    }

    case "unpaid-reminder": {
      const dayIndex = Number(data.dayIndex ?? 1);
      const remaining = Math.max(0, 14 - dayIndex);
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">Votre commande vous attend</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 16px;">
          Nous n'avons pas encore reçu le virement pour votre commande <b>${order.orderNumber}</b>.
          Vos articles sont toujours réservés. Pour finaliser, il vous suffit d'effectuer le virement.
          ${remaining > 0 ? `<br/><b>Plus que ${remaining} jour${remaining > 1 ? "s" : ""}</b> avant l'annulation automatique de la commande.` : `<br/>Dernier rappel avant annulation.`}
        </p>
        ${bankBlock(settings.bank ?? {}, order.total, order.paymentReference)}
        <p style="margin:16px 0;">${button(orderUrl, "Régler ma commande")}</p>`;
      return {
        subject: `Rappel — virement en attente pour la commande ${order.orderNumber}`,
        html: emailLayout({ title: "Rappel de paiement", storeName, bodyHtml: body }),
      };
    }

    case "payment-confirmed": {
      const trackUrl = order.delivery?.deliveryNumber
        ? `${SITE_URL}/suivi/${order.delivery.deliveryNumber}`
        : orderUrl;
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">Paiement reçu ✅</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 16px;">
          Nous avons bien reçu votre virement pour la commande <b>${order.orderNumber}</b>.
          Votre commande est en préparation. Suivez sa livraison en temps réel ci-dessous.
        </p>
        ${itemsBlock(order.items)}
        ${totalsBlock(order)}
        <p style="margin:16px 0;">${button(trackUrl, "Suivre ma livraison")}</p>`;
      return {
        subject: `Paiement confirmé — commande ${order.orderNumber}`,
        html: emailLayout({ title: "Paiement confirmé", storeName, bodyHtml: body }),
      };
    }

    case "delivery-update": {
      const step = (data.step as { label?: string; note?: string; location?: { label?: string } }) ?? {};
      const trackUrl = order.delivery?.deliveryNumber
        ? `${SITE_URL}/suivi/${order.delivery.deliveryNumber}`
        : orderUrl;
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">📦 Mise à jour de votre livraison</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 4px;">Commande <b>${order.orderNumber}</b></p>
        <div style="border:1px solid ${LINE};border-radius:8px;padding:16px;margin:12px 0;background:#fafbfc;">
          <div style="font-size:16px;font-weight:800;">${step.label ?? "Mise à jour"}</div>
          ${step.note ? `<div style="font-size:13px;color:${MUTED};margin-top:4px;">${step.note}</div>` : ""}
          ${step.location?.label ? `<div style="font-size:13px;margin-top:6px;">📍 ${step.location.label}</div>` : ""}
        </div>
        <p style="margin:16px 0;">${button(trackUrl, "Suivre ma livraison en temps réel")}</p>`;
      return {
        subject: `Votre commande ${order.orderNumber} : ${step.label ?? "mise à jour"}`,
        html: emailLayout({ title: "Suivi de livraison", storeName, bodyHtml: body }),
      };
    }

    case "order-delivered": {
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">🎉 Votre commande a été livrée</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 16px;">
          La commande <b>${order.orderNumber}</b> a bien été livrée. Merci de votre confiance !
          N'hésitez pas à laisser un avis sur vos produits.
        </p>
        ${itemsBlock(order.items)}
        <p style="margin:16px 0;">${button(orderUrl, "Voir ma commande")}</p>`;
      return {
        subject: `Commande ${order.orderNumber} livrée — merci !`,
        html: emailLayout({ title: "Commande livrée", storeName, bodyHtml: body }),
      };
    }

    case "abandoned-cart": {
      const cart = (data.cart as { items?: OrderLike["items"]; subtotal?: number }) ?? {};
      const items = cart.items ?? [];
      const cartUrl = `${SITE_URL}/panier`;
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">Vous avez oublié quelque chose 🛒</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 16px;">
          Votre panier vous attend ! Les articles ci-dessous sont encore disponibles —
          finalisez votre commande avant qu'ils ne partent.
        </p>
        ${items.length ? itemsBlock(items) : ""}
        ${cart.subtotal ? `<div style="text-align:right;font-weight:800;margin-top:8px;">Total : ${formatPrice(cart.subtotal)}</div>` : ""}
        <p style="margin:16px 0;">${button(cartUrl, "Reprendre mon panier")}</p>
        <p style="font-size:12px;color:${MUTED};">Livraison suivie en temps réel · paiement par virement sécurisé · retour 14 j.</p>`;
      return {
        subject: "Votre panier vous attend — finalisez votre commande",
        html: emailLayout({ title: "Panier abandonné", storeName, bodyHtml: body }),
      };
    }

    case "admin-new-order": {
      const orderId = (data.order as { _id?: string })._id ?? "";
      const adminUrl = `${SITE_URL}/admin/commandes/${orderId}`;
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">🔔 Nouvelle commande à vérifier</h1>
        <p style="font-size:14px;color:${MUTED};margin:0 0 12px;">
          Commande <b>${order.orderNumber}</b> de <b>${order.customer?.name ?? ""}</b> —
          en attente du virement (réf. <b>${order.paymentReference}</b>).
        </p>
        ${itemsBlock(order.items)}
        ${totalsBlock(order)}
        <p style="margin:16px 0;">${button(adminUrl, "Ouvrir dans le back-office")}</p>
        <p style="font-size:12px;color:${MUTED};">Confirmez le paiement dès réception du virement pour démarrer la livraison.</p>`;
      return {
        subject: `Nouvelle commande ${order.orderNumber} — ${formatPrice(order.total)}`,
        html: emailLayout({ title: "Nouvelle commande", storeName, bodyHtml: body }),
      };
    }

    case "admin-contact": {
      const c = data as { name?: string; email?: string; subject?: string; message?: string };
      const body = `
        <h1 style="font-size:20px;margin:0 0 8px;">✉️ Nouveau message de contact</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr><td style="padding:4px 0;color:${MUTED};">De</td><td style="padding:4px 0;font-weight:bold;">${c.name ?? ""} &lt;${c.email ?? ""}&gt;</td></tr>
          <tr><td style="padding:4px 0;color:${MUTED};">Sujet</td><td style="padding:4px 0;font-weight:bold;">${c.subject ?? "(sans sujet)"}</td></tr>
        </table>
        <div style="margin-top:12px;border:1px solid ${LINE};border-radius:8px;padding:14px;background:#fafbfc;white-space:pre-line;font-size:14px;">${c.message ?? ""}</div>`;
      return {
        subject: `Contact : ${c.subject || "nouveau message"}`,
        html: emailLayout({ title: "Message de contact", storeName, bodyHtml: body }),
      };
    }
  }
}
