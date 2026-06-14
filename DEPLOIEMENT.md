# 🚀 Déploiement en production — Boutique high-tech

Runbook complet : variables d'environnement, seeds, déploiement Vercel (plan Pro)
et smoke-test post-déploiement.

---

## 1. Variables d'environnement

À définir dans **Vercel → Project → Settings → Environment Variables** (et en
local dans `.env.local`, jamais commité). Voir `.env.example` pour le gabarit.

### Base (obligatoire)

| Variable | Où l'obtenir |
|----------|--------------|
| `MONGODB_URI` | **MongoDB Atlas** → Cluster → *Connect* → *Drivers* → copier l'URI `mongodb+srv://user:pass@cluster/...`. Créez un utilisateur DB et ajoutez `0.0.0.0/0` (ou les IP Vercel) dans *Network Access*. Mettez un nom de base dans l'URI (ex. `/boutique`). |
| `NEXTAUTH_SECRET` | Générez-le : `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL **publique** du site en prod, ex. `https://boutique.tondomaine.fr`. **Sert aussi de base aux liens dans les emails et au suivi** (on n'utilise pas `NEXT_PUBLIC_` côté serveur). |
| `NEXT_PUBLIC_SITE_URL` | Même URL publique (usage client éventuel). |
| `CRON_SECRET` | Secret aléatoire : `openssl rand -hex 32`. Vercel l'envoie automatiquement en `Authorization: Bearer …` sur ses crons natifs. |

### Email — Resend

| Variable | Où l'obtenir |
|----------|--------------|
| `RESEND_API_KEY` | **resend.com** → API Keys → *Create*. |
| `RESEND_FROM` | Adresse d'expédition, ex. `"Boutique <commandes@tondomaine.fr>"`. **Le domaine doit être vérifié** (voir §4). |

### Images — Cloudinary

| Variable | Où l'obtenir |
|----------|--------------|
| `CLOUDINARY_CLOUD_NAME` | **cloudinary.com** → Dashboard → *Product Environment Credentials*. |
| `CLOUDINARY_API_KEY` | idem Dashboard. |
| `CLOUDINARY_API_SECRET` | idem Dashboard (à garder secret). |

### IA — Gemini

| Variable | Où l'obtenir |
|----------|--------------|
| `GEMINI_API_KEY` | **aistudio.google.com → Get API key**. |
| `GEMINI_MODEL` | Modèle principal. Défaut : `gemini-1.5-flash`. |
| `GEMINI_FALLBACK_MODEL` | Modèle de secours (bascule auto si quota **429** / accès **403**). Défaut : `gemini-1.5-flash-8b`. |

> Sans `GEMINI_API_KEY`, le **chatbot répond « indisponible momentanément »** et
> l'**import IA renvoie une erreur claire** — aucun crash.

### Import AliExpress (optionnel)

| Variable | Où l'obtenir |
|----------|--------------|
| `ALIEXPRESS_APP_KEY` / `ALIEXPRESS_APP_SECRET` | **AliExpress Open Platform** (programme dropshipping). Sans clés, l'onglet AliExpress renvoie un message explicite. |

### Seed admin (pour `npm run seed:admin`)

| Variable | Rôle |
|----------|------|
| `SEED_ADMIN_EMAIL` | Email du compte `owner`. |
| `SEED_ADMIN_PASSWORD` | Mot de passe initial (à changer ensuite). |
| `SEED_ADMIN_NAME` | Nom affiché. |

### WhatsApp (phase 2 — laisser vide)
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.

---

## 2. Initialisation des données (seeds)

À lancer **une fois** la base accessible (en local avec `.env.local` rempli, ou
via un job ponctuel). **Ordre impératif :**

```bash
npm run seed:admin      # 1) crée le compte admin "owner" (SEED_ADMIN_*)
npm run seed:settings   # 2) initialise le singleton Settings (étapes de livraison, délais, défauts)
```

> `seed:settings` est idempotent. Ensuite, complétez dans **/admin/reglages** :
> Paiement (IBAN/BIC/titulaire), Livraison (zones, frais), Légal (4 pages).

---

## 3. Resend — vérifier le domaine d'envoi (IMPORTANT)

Pour que les emails (instructions de virement, suivi de livraison, relances)
**n'arrivent pas en spam** :

1. resend.com → **Domains** → *Add Domain* (ex. `tondomaine.fr`).
2. Ajoutez chez votre registrar/DNS les enregistrements fournis :
   - **SPF** (TXT)
   - **DKIM** (CNAME/TXT)
   - **DMARC** recommandé (TXT `_dmarc`).
3. Attendez la propagation puis cliquez **Verify**.
4. `RESEND_FROM` doit utiliser **ce domaine vérifié** (ex. `commandes@tondomaine.fr`).

> Tant que le domaine n'est pas vérifié, n'utilisez `onboarding@resend.dev` que
> pour des tests — la délivrabilité réelle sera mauvaise.

---

## 4. Déploiement sur Vercel (plan Pro)

1. **Importez le repo** dans Vercel (*New Project*). Framework détecté : Next.js.
2. **Environment Variables** : collez toutes les variables du §1 (scopes
   *Production* + *Preview*).
3. **Deploy**. Build attendu : `next build` (déjà validé localement).
4. **Crons natifs** : ils sont déclarés dans **`vercel.json`** à la racine et
   **s'enregistrent automatiquement au déploiement** (plan Pro requis pour ces
   cadences). Cadences (UTC) :

   | Cron | Schedule | Rôle |
   |------|----------|------|
   | `/api/cron/delivery-advance` | `*/5 * * * *` | avancement auto de la livraison |
   | `/api/cron/delivery-notify` | `*/5 * * * *` | emails de mise à jour de livraison |
   | `/api/cron/abandoned-carts` | `*/30 * * * *` | relance panier abandonné |
   | `/api/cron/unpaid-orders` | `0 8 * * *` | relance virement (1×/jour, 08:00 UTC) |

   Vercel envoie `Authorization: Bearer $CRON_SECRET` automatiquement ; chaque
   route **renvoie 401** sans ce header. Vérifiez l'onglet **Vercel → Crons**
   après déploiement.

5. **Domaine** : *Settings → Domains* → ajoutez votre domaine, puis mettez
   `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` à cette URL et **redeployez**.

> Test manuel d'un cron (doit répondre 401 sans secret, 200 avec) :
> ```bash
> curl -i https://VOTRE-SITE/api/cron/unpaid-orders                       # → 401
> curl -i -H "Authorization: Bearer $CRON_SECRET" https://VOTRE-SITE/api/cron/unpaid-orders  # → 200
> ```

---

## 5. Smoke-test post-déploiement

À dérouler **dans l'ordre** sur l'environnement de production :

1. **Catalogue** : créer/activer au moins 1 produit (`/admin/produits` → statut
   *Actif*) ; vérifier qu'il s'affiche sur l'accueil et sur sa fiche.
2. **Commande test** : ajouter au panier → `/checkout` → renseigner adresse +
   email réel → **Valider ma commande**.
3. **Email d'instructions** : vérifier la réception de l'email *« Commande reçue
   — instructions de virement »* (IBAN + **montant exact** + **référence**). Si
   absent → vérifier `RESEND_API_KEY`, `RESEND_FROM` et la **vérification du
   domaine** (§3), regarder les logs Vercel de `/api/checkout`.
4. **Page commande** : ouvrir `/commande/CMD-…` → coordonnées bancaires + montant
   + référence affichés.
5. **Confirmer le paiement (admin)** : `/admin/commandes/[id]` → **Confirmer le
   paiement**. Attendu :
   - statut passe à **Payée** ;
   - **numéro de livraison `LIV-…` généré** ;
   - email *« Paiement confirmé »* + lien de suivi reçu ;
   - les relances de virement s'arrêtent (commande plus en `pending_payment`).
6. **Avancement auto** : attendre le passage du cron `delivery-advance`
   (≤ 5 min) **ou** forcer une étape via le panneau *Pilotage de la livraison*.
   Vérifier que l'étape courante avance et que `nextAutoAdvanceAt` se recalcule.
7. **Suivi public** : ouvrir `/suivi/LIV-…` → le **stepper** reflète l'étape
   courante et se rafraîchit tout seul (~20 s). Si GPS renseigné, la carte
   s'affiche.
8. **Emails de livraison** : vérifier la réception des emails *« Mise à jour de
   votre livraison »* à chaque étape notifiable (cron `delivery-notify`, ≤ 5 min),
   puis *« Commande livrée »* à la dernière étape.

### Vérifications complémentaires
- **Relance impayé** : laisser une commande en `pending_payment` → un email/jour
  pendant 14 j (cron 08:00 UTC), arrêt dès confirmation, annulation auto + stock
  relâché après 14 relances.
- **Chatbot** : bulle 💬 en bas à droite → poser une question produit/commande.
  Sans `GEMINI_API_KEY`, message « indisponible » (pas d'erreur).
- **SEO** : `https://VOTRE-SITE/robots.txt` et `/sitemap.xml` répondent ; la
  fiche produit contient un bloc JSON-LD `Product`.
- **Sécurité** : `/admin` redirige vers `/admin/login` si non connecté.

---

## 6. Rollback

En cas de problème, **Vercel → Deployments → Promote** un déploiement précédent
stable. Les données MongoDB ne sont pas affectées par un rollback de code.
