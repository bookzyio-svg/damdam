import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import ContactForm from "@/components/storefront/ContactForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const store = settings.store ?? {};
  const addr = store.address;

  return (
    <div className="container-site max-w-4xl py-10">
      <h1 className="mb-2 text-3xl font-bold">Contactez-nous</h1>
      <p className="mb-8 text-muted">Une question sur un produit, une commande ou une livraison ? Écrivez-nous.</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <ContactForm />

        <aside className="space-y-4 text-sm">
          {store.email ? (
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-brand" />
              <div><div className="font-semibold text-ink">Email</div><a href={`mailto:${store.email}`} className="text-muted hover:text-brand">{store.email}</a></div>
            </div>
          ) : null}
          {store.phone ? (
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-brand" />
              <div><div className="font-semibold text-ink">Téléphone</div><span className="text-muted">{store.phone}</span></div>
            </div>
          ) : null}
          {addr?.line1 ? (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-brand" />
              <div>
                <div className="font-semibold text-ink">Adresse</div>
                <div className="text-muted">{addr.line1}<br />{addr.postalCode} {addr.city}<br />{addr.country}</div>
              </div>
            </div>
          ) : null}
          <div className="rounded-lg bg-surface p-3 text-xs text-muted">
            Nous répondons généralement sous 24 h ouvrées.
          </div>
        </aside>
      </div>
    </div>
  );
}
