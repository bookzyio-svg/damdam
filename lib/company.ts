/**
 * Informations légales de l'entreprise — source unique pour le footer et les
 * pages légales (mentions, CGV, confidentialité, rétractation).
 * Données issues de l'INSEE / INPI (SIRENE & RNE).
 */
export const COMPANY = {
  name: "DAMDAM ELECTROMENAGER",
  legalForm: "SAS (société par actions simplifiée)",
  capital: "2 000 €",
  siren: "930 300 264",
  siret: "930 300 264 00015",
  rcs: "Caen",
  ape: "4754Z — Commerce de détail d'appareils électroménagers en magasin spécialisé",
  vat: "FR23 930 300 264",
  director: "Damien LAIR",
  directorTitle: "Président",
  email: "support@damdam.fr",
  address: {
    line1: "4 rue de la Villa Romaine",
    postalCode: "14460",
    city: "Colombelles",
    country: "France",
  },
  addressInline: "4 rue de la Villa Romaine, 14460 Colombelles, France",
  // Hébergeur du site (à ajuster selon votre hébergeur réel)
  host: {
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
    url: "https://vercel.com",
  },
  lastUpdate: "14 juin 2026",
};

const C = COMPANY;

/* ---------------------------------------------------------------- */
/* Mentions légales                                                  */
/* ---------------------------------------------------------------- */
export const MENTIONS_LEGALES = `Dernière mise à jour : ${C.lastUpdate}

1. ÉDITEUR DU SITE
Le présent site est édité par :
${C.name}
Forme juridique : ${C.legalForm} au capital de ${C.capital}
Siège social : ${C.addressInline}
SIREN : ${C.siren}
SIRET (siège) : ${C.siret}
RCS : ${C.rcs} ${C.siren}
Numéro de TVA intracommunautaire : ${C.vat}
Code APE/NAF : ${C.ape}
Adresse e-mail : ${C.email}

2. DIRECTEUR DE LA PUBLICATION
${C.director}, en qualité de ${C.directorTitle}.

3. HÉBERGEUR
${C.host.name}
${C.host.address}
${C.host.url}

4. PROPRIÉTÉ INTELLECTUELLE
L'ensemble des éléments du site (textes, visuels, logo, marque, mise en page) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite préalable de ${C.name}, est interdite et susceptible de constituer une contrefaçon.
Les marques et logos des produits cités appartiennent à leurs titulaires respectifs.

5. DONNÉES PERSONNELLES
Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité. Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition que vous pouvez exercer à l'adresse ${C.email}.

6. MÉDIATION DE LA CONSOMMATION
Conformément à l'article L.612-1 du Code de la consommation, en cas de litige non résolu avec notre service client, le consommateur peut recourir gratuitement à un médiateur de la consommation. Les coordonnées du médiateur seront communiquées sur simple demande à ${C.email}.

7. CONTACT
Pour toute question, écrivez-nous à ${C.email}.`;

/* ---------------------------------------------------------------- */
/* Conditions Générales de Vente                                     */
/* ---------------------------------------------------------------- */
export const CGV = `Dernière mise à jour : ${C.lastUpdate}

ARTICLE 1 — OBJET ET CHAMP D'APPLICATION
Les présentes Conditions Générales de Vente (CGV) régissent les ventes conclues sur le site avec ${C.name} (${C.legalForm}, SIRET ${C.siret}), ci-après « le Vendeur ». Toute commande implique l'acceptation sans réserve des présentes CGV.

ARTICLE 2 — PRODUITS
Les produits proposés sont des appareils électroménagers et high-tech, neufs ou reconditionnés selon l'état indiqué sur chaque fiche produit. Les photographies et descriptifs sont fournis à titre indicatif et le plus fidèlement possible.

ARTICLE 3 — PRIX
Les prix sont indiqués en euros (€), toutes taxes comprises (TTC). Le Vendeur se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés sur la base des tarifs en vigueur au moment de la validation de la commande.

ARTICLE 4 — COMMANDE
Le client valide sa commande après avoir vérifié le contenu de son panier et renseigné ses informations de livraison. La vente est considérée comme ferme après confirmation et réception du paiement.

ARTICLE 5 — PAIEMENT PAR VIREMENT BANCAIRE
Le règlement s'effectue exclusivement par virement bancaire. Après validation de la commande, les coordonnées bancaires (IBAN/BIC) et la référence à indiquer sont communiquées au client par e-mail et sur la page de confirmation.
La commande est préparée et expédiée dès réception effective du virement sur le compte du Vendeur. À défaut de réception du paiement, la commande pourra être annulée et les articles remis en vente.

ARTICLE 6 — LIVRAISON
Les produits sont livrés à l'adresse indiquée par le client lors de la commande. Les délais de livraison sont précisés lors de la commande et courent à compter de la réception du paiement. Le suivi de la livraison est accessible en ligne à tout moment.
En cas de retard anormal, le client est invité à contacter ${C.email}.

ARTICLE 7 — DROIT DE RÉTRACTATION
Conformément aux articles L.221-18 et suivants du Code de la consommation, le client dispose d'un délai de quatorze (14) jours pour se rétracter, sans avoir à justifier de motif. Les modalités sont détaillées dans notre page « Droit de rétractation ».

ARTICLE 8 — GARANTIES LÉGALES
Tous les produits bénéficient de la garantie légale de conformité (articles L.217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil). En cas de défaut, le client peut obtenir la réparation ou le remplacement du produit, puis le cas échéant son remboursement, dans les conditions prévues par la loi.
Pour toute mise en œuvre d'une garantie, contactez ${C.email}.

ARTICLE 9 — SERVICE APRÈS-VENTE
Le Vendeur assure une activité de réparation et de conseil sur les appareils électroménagers. Pour toute demande de SAV, de diagnostic ou de réparation, écrivez à ${C.email}.

ARTICLE 10 — RESPONSABILITÉ
La responsabilité du Vendeur ne saurait être engagée pour les dommages résultant d'une mauvaise utilisation du produit ou d'un cas de force majeure.

ARTICLE 11 — MÉDIATION ET LITIGES
En cas de litige, le client s'adresse en priorité au service client à ${C.email}. À défaut de solution amiable, il peut recourir gratuitement à un médiateur de la consommation. Les présentes CGV sont soumises au droit français.`;

/* ---------------------------------------------------------------- */
/* Politique de confidentialité                                      */
/* ---------------------------------------------------------------- */
export const CONFIDENTIALITE = `Dernière mise à jour : ${C.lastUpdate}

1. RESPONSABLE DU TRAITEMENT
Le responsable du traitement des données est ${C.name}, ${C.addressInline}. Contact : ${C.email}.

2. DONNÉES COLLECTÉES
Nous collectons les données que vous nous fournissez : nom, prénom, adresse postale, adresse e-mail, numéro de téléphone, contenu de la commande, ainsi que les données techniques nécessaires au bon fonctionnement du site.

3. FINALITÉS ET BASES LÉGALES
Vos données sont utilisées pour :
• Traiter et suivre vos commandes et livraisons (exécution du contrat) ;
• Vous contacter au sujet de votre commande (exécution du contrat) ;
• Vous envoyer des offres commerciales si vous y avez consenti (consentement) ;
• Respecter nos obligations légales et comptables (obligation légale).

4. DURÉE DE CONSERVATION
Les données liées aux commandes sont conservées pendant la durée nécessaire à la gestion de la relation commerciale et aux obligations légales (notamment comptables). Les données marketing sont conservées jusqu'au retrait de votre consentement.

5. DESTINATAIRES
Vos données sont destinées aux services internes de ${C.name} et à ses prestataires techniques (hébergement, e-mailing, transport). Elles ne sont jamais vendues à des tiers.

6. VOS DROITS
Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données. Vous pouvez les exercer à tout moment en écrivant à ${C.email}.
Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).

7. COOKIES
Le site utilise des cookies nécessaires à son fonctionnement et, le cas échéant, des cookies de mesure d'audience. Vous pouvez gérer vos préférences via le bandeau cookies et les réglages de votre navigateur.

8. CONTACT
Pour toute question relative à vos données personnelles : ${C.email}.`;

/* ---------------------------------------------------------------- */
/* Droit de rétractation                                             */
/* ---------------------------------------------------------------- */
export const RETRACTATION = `Dernière mise à jour : ${C.lastUpdate}

1. DÉLAI DE RÉTRACTATION
Conformément aux articles L.221-18 et suivants du Code de la consommation, vous disposez d'un délai de quatorze (14) jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motif ni à payer de pénalité.

2. COMMENT EXERCER VOTRE DROIT
Pour exercer ce droit, informez-nous de votre décision avant l'expiration du délai, par e-mail à ${C.email}, au moyen d'une déclaration dénuée d'ambiguïté. Vous pouvez utiliser le formulaire type ci-dessous (facultatif).

3. FORMULAIRE TYPE DE RÉTRACTATION
À l'attention de ${C.name}, ${C.addressInline} — ${C.email} :
« Je vous notifie par la présente ma rétractation du contrat portant sur la commande ci-dessous :
- Commandé le / reçu le : …
- Numéro de commande : …
- Nom du client : …
- Adresse du client : …
- Date : … »

4. RETOUR DES PRODUITS
Vous devez renvoyer le produit sans retard excessif et au plus tard quatorze (14) jours après nous avoir communiqué votre décision. Le produit doit être retourné complet, dans son emballage d'origine et en état de revente. Les frais de retour sont à votre charge, sauf indication contraire.

5. REMBOURSEMENT
Nous vous rembourserons l'intégralité des sommes versées, au plus tard quatorze (14) jours à compter de la récupération des biens ou de la preuve de leur expédition. Le remboursement est effectué par virement bancaire, sur le compte ayant servi au paiement.

6. EXCEPTIONS
Le droit de rétractation ne s'applique pas dans les cas prévus par l'article L.221-28 du Code de la consommation (notamment les biens descellés ne pouvant être renvoyés pour des raisons d'hygiène, ou nettement personnalisés).

Pour toute question : ${C.email}.`;
