import { formatPrice } from "@/lib/utils/money";

/** Couleurs de marque pour les emails (inline, compat clients mail). */
const BRAND = "#1B57E0";
const DEAL = "#E0301E";
const INK = "#181A20";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";

/** Enveloppe HTML responsive commune à tous les emails (§16). */
export function emailLayout(opts: {
  title: string;
  storeName?: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  const { title, storeName = "Boutique high-tech", bodyHtml, footerHtml } = opts;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head>
<body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid ${LINE};border-radius:10px;overflow:hidden;">
        <tr><td style="background:${BRAND};padding:18px 24px;color:#fff;font-size:20px;font-weight:800;">${storeName}</td></tr>
        <tr><td style="padding:24px;">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;">
          ${footerHtml ?? `${storeName} · Paiement par virement sécurisé · Retour sous 14 jours`}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Bloc « coordonnées bancaires » réutilisable (virement). */
export function bankBlock(bank: {
  titulaire?: string;
  iban?: string;
  bic?: string;
  banque?: string;
  instructions?: string;
}, amountCents: number, reference: string): string {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:6px 0;color:${MUTED};font-size:13px;">${label}</td><td style="padding:6px 0;font-size:13px;font-weight:bold;text-align:right;">${value}</td></tr>`
      : "";
  return `
  <div style="border:1px solid ${LINE};border-radius:8px;padding:16px;margin:16px 0;background:#fafbfc;">
    <div style="font-weight:bold;margin-bottom:8px;">Coordonnées pour le virement</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Titulaire", bank.titulaire)}
      ${row("IBAN", bank.iban)}
      ${row("BIC", bank.bic)}
      ${row("Banque", bank.banque)}
      <tr><td style="padding:6px 0;color:${MUTED};font-size:13px;">Montant exact</td><td style="padding:6px 0;font-size:15px;font-weight:800;color:${DEAL};text-align:right;">${formatPrice(amountCents)}</td></tr>
      <tr><td style="padding:6px 0;color:${MUTED};font-size:13px;">Référence (motif)</td><td style="padding:6px 0;font-size:15px;font-weight:800;text-align:right;">${reference}</td></tr>
    </table>
    <p style="margin:10px 0 0;font-size:12px;color:${MUTED};">
      ⚠️ Indiquez impérativement la référence <b>${reference}</b> dans le motif du virement.
      ${bank.instructions ? `<br/>${bank.instructions}` : ""}
    </p>
  </div>`;
}

/** Tableau récapitulatif des articles d'une commande. */
export function itemsBlock(
  items: { title: string; variantTitle?: string; quantity: number; price: number }[],
): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:13px;">${i.title}${i.variantTitle ? ` <span style="color:${MUTED}">(${i.variantTitle})</span>` : ""} × ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:13px;text-align:right;white-space:nowrap;">${formatPrice(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:6px;font-size:14px;">${label}</a>`;
}
