"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, Truck, RotateCcw, AlertTriangle, Check, X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { lineKey } from "@/lib/cart/types";
import { formatPrice, discountPercent } from "@/lib/utils/money";
import AddressFields from "@/components/storefront/AddressFields";

type Quote = {
  ok: boolean;
  errors: string[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  promo?: { code: string };
  bankTransferNoticeThreshold?: number;
  shippingEstimate?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, clear, setQty, remove } = useCart();

  const [form, setForm] = useState({
    firstName: "", lastName: "",
    email: "", phone: "",
    line1: "", line2: "", city: "", postalCode: "", country: "France",
    customerNotes: "", acceptsMarketing: false,
  });
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // évite le flash "panier vide" après commande
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAccepted, setTransferAccepted] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const orderItems = items.map((i) => ({ productId: i.productId, variantTitle: i.variantTitle, quantity: i.quantity }));

  // Devis live (sous-total, port, remise) quand le CP / promo / panier change
  const fetchQuote = useCallback(async () => {
    if (orderItems.length === 0) { setQuote(null); return; }
    const res = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderItems,
        postalCode: form.postalCode || undefined,
        country: form.country || undefined,
        promoCode: appliedPromo || undefined,
        email: form.email || undefined,
      }),
    });
    setQuote(await res.json());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(orderItems), form.postalCode, form.country, form.email, appliedPromo]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 300);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  // Attache l'email au panier serveur dès sa saisie → permet la relance panier
  // abandonné (§12) si le client quitte le checkout sans finaliser.
  useEffect(() => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) || items.length === 0) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("bh_cart_token") : null;
    if (!token) return;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const t = setTimeout(() => {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: form.email,
          items: items.map((i) => ({
            productId: i.productId, title: i.title, variantTitle: i.variantTitle,
            price: i.price, quantity: i.quantity, image: i.image,
          })),
          subtotal,
        }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email, JSON.stringify(orderItems)]);

  // Pendant la redirection vers la confirmation : petit écran de transition
  // (sinon, vider le panier afficherait brièvement « panier vide »).
  if (redirecting) {
    return (
      <div className="container-site flex min-h-[50vh] flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
        <p className="text-sm font-medium text-muted">Validation de votre commande…</p>
      </div>
    );
  }

  if (ready && items.length === 0 && !redirecting) {
    return (
      <div className="container-site py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Votre panier est vide</h1>
        <Link href="/" className="btn-brand mt-4">Retour à la boutique</Link>
      </div>
    );
  }

  // Seuil au-delà duquel on affiche le rappel "paiement par virement" (défaut 500 €)
  const noticeThreshold = quote?.bankTransferNoticeThreshold ?? 50000;
  const currentTotal = quote?.total ?? items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Gros panier → on demande une acceptation explicite du paiement par virement
    if (noticeThreshold > 0 && currentTotal >= noticeThreshold && !transferAccepted) {
      setShowTransferModal(true);
      return;
    }
    await doSubmit();
  }

  async function doSubmit() {
    setSubmitting(true);
    setError(null);
    const cartToken = typeof window !== "undefined" ? localStorage.getItem("bh_cart_token") || undefined : undefined;
    const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ").trim();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderItems,
        customer: { name: fullName, email: form.email, phone: form.phone },
        shippingAddress: {
          line1: form.line1, line2: form.line2, city: form.city,
          postalCode: form.postalCode, country: form.country, phone: form.phone,
        },
        promoCode: appliedPromo || undefined,
        cartToken,
        customerNotes: form.customerNotes,
        acceptsMarketing: form.acceptsMarketing,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError((body.errors?.join(" ") || body.error) ?? "Erreur lors de la commande");
      return;
    }
    setRedirecting(true); // bascule sur l'écran de transition avant de vider le panier
    router.push(`/commande/${body.orderNumber}`);
    clear();
  }

  const inputCls = "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none";
  const labelCls = "mb-1 block text-xs font-semibold text-muted";

  const subtotalNow = quote?.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  const promoApplied = Boolean(appliedPromo && quote?.discountTotal);
  const promoError = quote?.errors.find((e) => /code promo/i.test(e));
  const stockErrors = (quote?.errors ?? []).filter((e) => !/code promo/i.test(e));

  return (
    <div className="bg-surface">
      <div className="container-site py-6 lg:py-8">
        {/* En-tête */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <Link href="/panier" className="text-sm font-medium text-brand hover:underline">← Retour au panier</Link>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Finaliser ma commande</h1>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-stock/10 px-3 py-1.5 text-sm font-semibold text-stock sm:flex">
            <Lock className="h-4 w-4" /> Paiement sécurisé
          </span>
        </div>

        {/* Étapes */}
        <ol className="mb-7 flex items-center gap-2 text-sm font-semibold">
          <li className="flex items-center gap-1.5 text-stock"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-stock text-white"><Check className="h-3.5 w-3.5" /></span> Panier</li>
          <span className="h-0.5 w-6 rounded bg-brand/40 sm:w-10" />
          <li className="flex items-center gap-1.5 text-brand"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">2</span> Informations</li>
          <span className="h-0.5 w-6 rounded bg-line sm:w-10" />
          <li className="flex items-center gap-1.5 text-muted"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-line text-ink">3</span> Paiement</li>
        </ol>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Coordonnées + livraison */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
                <StepBadge n={1} /> Vos coordonnées
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Prénom</label>
                  <input required placeholder="Jean" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nom de famille</label>
                  <input required placeholder="Dupont" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input required type="email" placeholder="jean.dupont@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input required placeholder="06 12 34 56 78" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">Votre reçu, votre numéro de suivi et le lien pour suivre votre livraison seront envoyés à cette adresse email.</p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
                <StepBadge n={2} /> Adresse de livraison
              </h2>
              <AddressFields
                values={{ line1: form.line1, line2: form.line2, postalCode: form.postalCode, city: form.city, country: form.country }}
                set={(k, v) => set(k, v)}
                inputCls={inputCls}
              />
              <div className="mt-3">
                <label className={labelCls}>Instructions de livraison (optionnel)</label>
                <textarea placeholder="Code d'accès, étage, point de retrait…" value={form.customerNotes} onChange={(e) => set("customerNotes", e.target.value)} className={`${inputCls} min-h-[64px]`} />
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.acceptsMarketing} onChange={(e) => set("acceptsMarketing", e.target.checked)} className="h-4 w-4 accent-brand" />
                Je souhaite recevoir les offres et nouveautés par email
              </label>
            </section>
          </div>

          {/* Récap (sticky desktop) */}
          <aside className="space-y-3 lg:sticky lg:top-4 lg:h-fit">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Récapitulatif</h2>

              {/* Articles avec vignettes + détails (condition, garantie, remise) */}
              <ul className="mb-4 space-y-4 border-b border-line pb-4">
                {items.map((i, idx) => {
                  const key = lineKey(i);
                  const off = discountPercent(i.price, i.compareAtPrice ?? undefined);
                  const max = i.maxStock && i.maxStock > 0 ? i.maxStock : Infinity;
                  return (
                    <li key={idx} className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                        {i.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.image} alt="" className="h-full w-full object-contain p-1" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="line-clamp-2 text-sm font-semibold text-ink">{i.title}</div>
                          <button type="button" onClick={() => remove(key)} aria-label="Retirer l'article" className="shrink-0 text-muted transition hover:text-deal"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {i.variantTitle ? <div className="mt-0.5 text-xs text-muted">{i.variantTitle}</div> : null}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
                          {i.condition ? <span>Condition : <b className="font-medium text-ink">{i.condition === "reconditionne" ? "Reconditionné" : "Neuf"}</b></span> : null}
                          <span>Garantie : <b className="font-medium text-ink">{i.condition === "reconditionne" ? "12 mois" : "2 ans"}</b></span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-lg border border-line">
                            <button type="button" onClick={() => setQty(key, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Diminuer" className="flex h-7 w-7 items-center justify-center text-ink transition hover:bg-surface disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                            <button type="button" onClick={() => setQty(key, i.quantity + 1)} disabled={i.quantity >= max} aria-label="Augmenter" className="flex h-7 w-7 items-center justify-center text-ink transition hover:bg-surface disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-ink">{formatPrice(i.price * i.quantity)}</div>
                            {i.compareAtPrice && i.compareAtPrice > i.price ? (
                              <div className="flex items-center justify-end gap-1.5 text-xs">
                                <span className="text-muted line-through">{formatPrice(i.compareAtPrice * i.quantity)}</span>
                                {off ? <span className="font-semibold text-deal">−{off}%</span> : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Code promo */}
              {promoApplied ? (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-stock/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-stock"><Check className="h-4 w-4" /> Code {quote?.promo?.code} appliqué</span>
                  <button type="button" onClick={() => { setAppliedPromo(""); setPromoInput(""); }} className="text-xs font-medium text-muted hover:text-deal">Retirer</button>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input placeholder="Code promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} className={inputCls} />
                    <button type="button" onClick={() => setAppliedPromo(promoInput.trim())} className="btn-outline shrink-0 px-4">Appliquer</button>
                  </div>
                  {appliedPromo && promoError ? <p className="mt-1.5 text-xs text-deal">{promoError.replace(/^code promo\s*:\s*/i, "")}</p> : null}
                </div>
              )}

              {/* Totaux */}
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd className="font-medium">{formatPrice(subtotalNow)}</dd></div>
                {quote?.discountTotal ? (
                  <div className="flex justify-between text-deal"><dt>Remise{quote.promo?.code ? ` (${quote.promo.code})` : ""}</dt><dd className="font-semibold">−{formatPrice(quote.discountTotal)}</dd></div>
                ) : null}
                <div className="flex justify-between"><dt className="text-muted">Livraison vers {form.country}</dt><dd className="font-medium">{quote ? (quote.shippingTotal ? formatPrice(quote.shippingTotal) : <span className="font-semibold text-stock">Offerte</span>) : "…"}</dd></div>
                {quote?.shippingEstimate ? (
                  <div className="flex justify-between text-xs text-muted"><dt>Délai estimé</dt><dd>{quote.shippingEstimate}</dd></div>
                ) : null}
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="text-base font-bold">Total</dt>
                  <dd className="price text-2xl">{quote ? formatPrice(quote.total) : "…"}</dd>
                </div>
                <div className="text-right text-xs text-muted">TVA incluse</div>
              </dl>

              {stockErrors.length ? (
                <ul className="mt-3 space-y-1 rounded-lg bg-deal-soft p-2.5 text-xs text-deal">
                  {stockErrors.map((e, i) => <li key={i} className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {e}</li>)}
                </ul>
              ) : null}
              {error ? <p className="mt-3 rounded-lg bg-deal-soft p-2.5 text-sm text-deal">{error}</p> : null}

              <button type="submit" disabled={submitting} className="btn-deal mt-4 w-full rounded-xl py-3.5 text-base">
                <Lock className="h-4 w-4" /> {submitting ? "Validation…" : "Valider ma commande"}
              </button>
              <p className="mt-2.5 text-center text-xs text-muted">Sans engagement. Vos données restent protégées.</p>
            </div>

            {/* Badges de confiance */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, text: "Paiement sécurisé" },
                { icon: Truck, text: "Livraison suivie" },
                { icon: RotateCcw, text: "Retour 14 jours" },
              ].map((b) => (
                <div key={b.text} className="flex flex-col items-center gap-1 rounded-xl border border-line bg-white p-3 text-center">
                  <b.icon className="h-5 w-5 text-brand" />
                  <span className="text-[11px] font-medium leading-tight text-ink">{b.text}</span>
                </div>
              ))}
            </div>
          </aside>
        </form>
      </div>

      {/* Modal "gros panier → paiement par virement" (style épuré, rassurant) */}
      {showTransferModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="animate-fade absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setShowTransferModal(false)} />

          <div className="relative w-full max-w-sm">
            {/* Bouton fermer (au cas où) */}
            <button
              onClick={() => setShowTransferModal(false)}
              aria-label="Fermer"
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="animate-pop rounded-3xl bg-white px-7 py-8 text-center shadow-2xl">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                <ShieldCheck className="h-8 w-8" />
              </span>

              <h3 className="mt-4 text-xl font-extrabold text-ink">Paiement 100% sécurisé</h3>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                Pour votre sécurité, les commandes à partir de{" "}
                <b className="text-ink">{formatPrice(noticeThreshold)}</b> sont réglées par{" "}
                <b className="text-ink">virement bancaire</b>. Aucune donnée de carte ne circule en ligne,
                et votre commande est expédiée dès réception du virement.
              </p>

              <div className="mt-5 flex items-center justify-center gap-6 text-xs font-medium text-ink">
                <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-stock" /> Données protégées</span>
                <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-stock" /> Expédition rapide</span>
              </div>

              <button
                onClick={() => { setTransferAccepted(true); setShowTransferModal(false); doSubmit(); }}
                className="btn-brand mt-7 w-full rounded-full py-3.5 text-base"
              >
                J&apos;accepte et je continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Pastille numérotée d'étape. */
function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
      {n}
    </span>
  );
}
