import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/navigation";
import NewsletterForm from "@/components/storefront/NewsletterForm";
import { COMPANY } from "@/lib/company";

/** Pied de page avec liens légaux (§14), catégories et newsletter. */
export default function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      {/* Bandeau newsletter */}
      <div className="border-b border-line">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div>
            <div className="font-bold text-ink">Restez informé des meilleures offres</div>
            <div className="text-sm text-muted">Recevez nos offres en exclusivité. Désinscription en un clic.</div>
          </div>
          <NewsletterForm source="footer" />
        </div>
      </div>

      <div className="container-site grid grid-cols-2 gap-8 py-10 text-sm md:grid-cols-4">
        <div>
          <div className="mb-3 font-bold text-ink">Catégories</div>
          <ul className="space-y-1.5 text-muted">
            {NAV_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/c/${c.slug}`} className="hover:text-brand">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 font-bold text-ink">Aide & contact</div>
          <ul className="space-y-1.5 text-muted">
            <li><Link href="/suivi" className="hover:text-brand">Suivre ma commande</Link></li>
            <li><Link href="/contact" className="hover:text-brand">Nous contacter</Link></li>
            <li><Link href="/a-propos" className="hover:text-brand">À propos</Link></li>
            <li><a href={`mailto:${COMPANY.email}`} className="hover:text-brand">{COMPANY.email}</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-bold text-ink">Informations légales</div>
          <ul className="space-y-1.5 text-muted">
            <li><Link href="/mentions-legales" className="hover:text-brand">Mentions légales</Link></li>
            <li><Link href="/cgv" className="hover:text-brand">CGV</Link></li>
            <li><Link href="/confidentialite" className="hover:text-brand">Confidentialité</Link></li>
            <li><Link href="/retractation" className="hover:text-brand">Rétractation (14 j)</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-bold text-ink">Paiement & livraison</div>
          <p className="text-muted">
            Paiement sécurisé par virement bancaire. Livraison suivie en temps réel,
            expédition dès réception du virement.
          </p>
        </div>
      </div>
      {/* Identité légale de l'entreprise (confiance) */}
      <div className="border-t border-line">
        <div className="container-site py-5 text-center text-xs leading-relaxed text-muted">
          <p className="font-semibold text-ink">{COMPANY.name}</p>
          <p className="mt-1">
            {COMPANY.legalForm} · SIRET {COMPANY.siret} · TVA {COMPANY.vat}
          </p>
          <p>{COMPANY.addressInline} · <a href={`mailto:${COMPANY.email}`} className="hover:text-brand">{COMPANY.email}</a></p>
          <p className="mt-3">© {new Date().getFullYear()} {COMPANY.name} — Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
