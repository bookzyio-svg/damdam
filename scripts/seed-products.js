const { connect } = require("./_db");

/* ---------- Contenu rédigé par produit (FR, vendeur, sans specs inventées) ---------- */
const COPY = {
  // 1) Bol mélangeur TM7
  "6a2b81e194ce45ee23f3f909": {
    title: "Bol Mélangeur Thermomix® TM7™ — Set Complet",
    shortDescription: "Un deuxième bol complet pour enchaîner vos recettes sans jamais vous arrêter.",
    description:
`Cuisinez sans interruption avec le Set Complet Bol Mélangeur Thermomix®. Idéal quand vous préparez plusieurs recettes, recevez famille et amis, ou voulez simplement plus de confort au quotidien.

Conçu spécifiquement pour votre Thermomix® TM7™, ce set complet contient tout le nécessaire :
• Bol mélangeur en acier inoxydable haute qualité, avec chauffe et pesée intégrées
• Couvercle verrouillable pour une cuisson mains libres en toute sécurité
• Couteau mixeur de précision pour hacher, mixer, pétrir et émulsionner
• Fouet papillon pour monter la crème, les blancs en neige et obtenir des textures aériennes
• Panier de cuisson pour le riz, les légumes et les ingrédients délicats, en préservant saveurs et nutriments

Avoir un bol supplémentaire change tout : passez d'une recette à l'autre sans rincer, préparez à l'avance pour vos réceptions, ou séparez le sucré du salé sans attendre.

Compatible exclusivement avec le Thermomix® TM7™.`,
    seo: { title: "Bol Mélangeur Thermomix TM7 — Set Complet Accessoire", description: "Set complet Bol Mélangeur pour Thermomix TM7 : bol inox chauffe + pesée, couvercle, couteau, fouet papillon et panier. Enchaînez vos recettes sans attendre." },
    specs: [
      { label: "Compatibilité", value: "Thermomix® TM7™" },
      { label: "Matière du bol", value: "Acier inoxydable" },
      { label: "Fonctions intégrées", value: "Chauffe + pesée" },
      { label: "Inclus", value: "Bol, couvercle, couteau, fouet papillon, panier" },
    ],
    soldCount: 184, topic: "bol",
    highlights: ["la qualité de l'inox est top", "le fouet papillon monte les blancs nickel", "le deuxième bol me fait gagner un temps fou", "plus besoin de rincer entre deux recettes"],
  },
  // 2) TM7 + Bol bundle
  "6a2b81e794ce45ee23f3f90a": {
    title: "Thermomix® TM7™ + Bol Mélangeur Supplémentaire — Pack",
    shortDescription: "Le robot cuiseur le plus avancé, livré avec un second bol pour cuisiner sans limite.",
    description:
`Le pack ultime pour les passionnés de cuisine : le Thermomix® TM7™, accompagné d'un bol mélangeur supplémentaire pour enchaîner les préparations sans temps mort.

Le TM7™ réunit plus de 20 appareils en un seul, élégant et compact :
• Maîtrise multifonction : hacher, mixer, peser, mouliner, rissoler, cuire à la vapeur et bien plus
• Cuisson guidée pas à pas sur grand écran tactile haute résolution, pour un résultat parfait à chaque fois
• Connectivité Wi-Fi vers la plateforme Cookidoo® et ses 100 000+ recettes du monde entier
• Contrôle précis du temps, de la température et de la vitesse
• Bol de 2,2 L, parfait pour les repas en famille

Avec le bol supplémentaire inclus, préparez une entrée pendant que le plat repose, ou doublez les quantités pour vos invités sans jamais vous arrêter.`,
    seo: { title: "Pack Thermomix TM7 + Bol Supplémentaire — Robot Cuiseur", description: "Pack Thermomix TM7 : robot cuiseur connecté 20-en-1, écran tactile, Cookidoo 100 000+ recettes, livré avec un second bol mélangeur. Cuisinez sans limite." },
    specs: [
      { label: "Fonctions", value: "Plus de 20 appareils en un" },
      { label: "Écran", value: "Tactile haute résolution, cuisson guidée" },
      { label: "Connectivité", value: "Wi-Fi · Cookidoo® (100 000+ recettes)" },
      { label: "Capacité du bol", value: "2,2 L" },
      { label: "Inclus", value: "Robot TM7™ + bol mélangeur supplémentaire" },
    ],
    soldCount: 96, topic: "robot",
    highlights: ["la cuisson guidée est bluffante", "le second bol est ultra pratique", "l'écran tactile est super réactif", "Cookidoo regorge de recettes"],
  },
  // 3) TM7
  "6a2b820894ce45ee23f3f911": {
    title: "Thermomix® TM7™ — Robot Cuiseur Multifonction Connecté",
    shortDescription: "20 appareils en un, écran tactile et plus de 100 000 recettes guidées au bout des doigts.",
    description:
`Le Thermomix® TM7™ redéfinit l'art de cuisiner en réunissant innovation, polyvalence et simplicité dans un seul appareil d'exception.

Ce qu'il fait pour vous :
• Maîtrise multifonction : hacher, mixer, peser, mouliner, rissoler, cuire à la vapeur… plus de 20 appareils en un
• Cuisson guidée : suivez les instructions pas à pas sur l'écran tactile haute résolution, pour des plats réussis à tous les coups
• Connecté : accédez via Wi-Fi à la plateforme Cookidoo® et à plus de 100 000 recettes, planifiez vos repas et créez vos listes de courses
• Précision absolue : réglez le temps, la température et la vitesse au degré près
• Grande capacité : bol de 2,2 L, idéal pour toute la famille

Gagnez du temps, mangez mieux et redécouvrez le plaisir de cuisiner, même quand on débute.`,
    seo: { title: "Thermomix TM7 — Robot Cuiseur Connecté 20-en-1", description: "Thermomix TM7 : robot cuiseur multifonction, écran tactile, cuisson guidée et Cookidoo 100 000+ recettes. Plus de 20 appareils en un. Cuisinez comme un chef." },
    specs: [
      { label: "Fonctions", value: "Plus de 20 appareils en un" },
      { label: "Écran", value: "Tactile haute résolution, cuisson guidée" },
      { label: "Connectivité", value: "Wi-Fi · Cookidoo® (100 000+ recettes)" },
      { label: "Capacité du bol", value: "2,2 L" },
      { label: "Réglages", value: "Temps, température et vitesse précis" },
    ],
    soldCount: 142, topic: "robot",
    highlights: ["il a remplacé la moitié de mes appareils", "la cuisson guidée est parfaite pour débuter", "l'écran tactile est magnifique", "je cuisine beaucoup plus depuis"],
  },
  // 4) TM6 Sparkling Black
  "6a2b823394ce45ee23f3f91d": {
    title: "Thermomix® TM6® Sparkling Black — Édition Limitée",
    shortDescription: "L'édition limitée diamant noir : 20 appareils en un, finition anti-traces et anti-rayures.",
    description:
`Le Thermomix® TM6® Sparkling Black célèbre 140 ans de passion. Cette édition limitée arbore un motif triangulaire gravé au laser et un éclat soyeux qui imite la surface scintillante d'un diamant — le bijou de votre cuisine.

Comme un diamant, le Sparkling Black est robuste, durable et résistant aux traces de doigts comme aux rayures.

Ses atouts :
• Maîtrise multifonction : hacher, mixer, peser, mouliner, rissoler, cuire à la vapeur… 20 appareils en un
• Cuisson guidée pas à pas sur écran tactile haute résolution
• Connectivité Wi-Fi vers Cookidoo® et ses 80 000+ recettes
• Réglages précis du temps, de la température et de la vitesse

L'alliance de la performance et du style, en série limitée.`,
    seo: { title: "Thermomix TM6 Sparkling Black — Édition Limitée", description: "Thermomix TM6 Sparkling Black édition limitée 140 ans : finition diamant anti-traces, 20 appareils en un, écran tactile et Cookidoo 80 000+ recettes." },
    specs: [
      { label: "Série", value: "Édition limitée — 140 ans" },
      { label: "Finition", value: "Sparkling Black anti-traces et anti-rayures" },
      { label: "Fonctions", value: "20 appareils en un" },
      { label: "Connectivité", value: "Wi-Fi · Cookidoo® (80 000+ recettes)" },
      { label: "Capacité du bol", value: "2,2 L" },
    ],
    soldCount: 73, topic: "robot",
    highlights: ["la finition noire est sublime", "aucune trace de doigt, c'est top", "objet aussi beau qu'efficace", "l'édition limitée en jette dans la cuisine"],
  },
  // 5) KEFEYA TV tactile portable
  "6a2ccf4bae2f2bb08d5e3bf2": {
    title: "TV Tablette Tactile Portable KEFEYA 32\" sur Roulettes",
    shortDescription: "Un immense écran tactile 32 pouces, mobile, qui vous suit de pièce en pièce.",
    description:
`Et si votre écran vous suivait partout ? La TV Tablette Tactile KEFEYA 32\" est un grand écran tactile monté sur un support mobile à roulettes : vous le déplacez en un geste, de la cuisine au salon, de la chambre au bureau.

Pensé pour tous les usages :
• Streaming et TV : profitez de vos séries, films et plateformes vidéo sur un grand écran tactile 32 pouces
• Visioconférence et appels en famille, à la bonne hauteur, sans tenir un téléphone
• En cuisine : suivez vos recettes en vidéo, à portée de main
• Sport et fitness : suivez vos séances confortablement
• Idéal aussi pour les enfants et le télétravail

Hauteur et inclinaison ajustables, déplacement sur roulettes : un seul écran tactile pour toute la maison.`,
    seo: { title: "TV Tablette Tactile Portable KEFEYA 32\" sur Roulettes", description: "Grand écran tactile 32 pouces mobile sur roulettes KEFEYA : streaming, visio, cuisine, fitness. Hauteur et inclinaison réglables. Un écran pour toute la maison." },
    specs: [
      { label: "Taille d'écran", value: "32 pouces tactile" },
      { label: "Mobilité", value: "Support à roulettes" },
      { label: "Réglages", value: "Hauteur et inclinaison ajustables" },
      { label: "Usages", value: "Streaming, visio, cuisine, fitness" },
    ],
    soldCount: 58, topic: "écran",
    highlights: ["l'écran tactile est super réactif", "on le déplace d'une pièce à l'autre sans effort", "parfait pour suivre mes recettes", "génial pour les appels visio en famille"],
  },
  // 6) Foldimate
  "6a2ccf7dae2f2bb08d5e3bf3": {
    title: "Foldimate — La Machine qui Plie et Défroisse votre Linge",
    shortDescription: "Dites adieu à la corvée de pliage : Foldimate plie et défroisse votre linge à votre place.",
    description:
`Et si plier le linge devenait un plaisir ? Foldimate est votre nouvel allié pour un linge impeccable, plié net en quelques secondes.

Comment ça marche :
• Vous insérez le vêtement, Foldimate le plie automatiquement et le ressort parfaitement prêt à ranger
• Défroissage intégré pour un rendu net, sans plis disgracieux
• Gain de temps considérable au quotidien, surtout pour les familles
• Idéal pour chemises, t-shirts, serviettes et petits vêtements

Plus de pile de linge qui s'accumule : Foldimate transforme la corvée la plus détestée en un geste simple et rapide.

Disponible en plusieurs coloris et modèles — choisissez le vôtre ci-dessus.`,
    seo: { title: "Foldimate — Machine à Plier et Défroisser le Linge", description: "Foldimate plie et défroisse votre linge automatiquement en quelques secondes. Fini la corvée de pliage : un linge net et rangé sans effort. Plusieurs coloris." },
    specs: [
      { label: "Fonction", value: "Pliage automatique du linge" },
      { label: "Défroissage", value: "Intégré, pour un rendu net" },
      { label: "Idéal pour", value: "Chemises, t-shirts, serviettes, petits vêtements" },
      { label: "Bénéfice", value: "Gain de temps au quotidien" },
    ],
    soldCount: 211, topic: "machine",
    highlights: ["un gain de temps incroyable", "le linge ressort parfaitement plié", "mes enfants adorent s'en servir", "fini la corvée de pliage le dimanche"],
    variantRename: { "grau": "Gris", "rot": "Rouge", "Schwarz": "Noir", "Weiß": "Blanc", "Neues Modell": "Nouveau modèle", "FOLDIMATE Elite": "Foldimate Elite" },
  },
};

/* ---------- Générateur d'avis FR ---------- */
const NAMES = ["Sophie L.","Julien M.","Karim B.","Nathalie P.","Thomas R.","Émilie D.","Antoine G.","Camille F.","Mehdi S.","Laure V.","Nicolas T.","Sandrine M.","Pauline R.","Olivier C.","Fatima Z.","David L.","Céline B.","Romain P.","Aurélie N.","Hugo M.","Valérie K.","Stéphane D.","Manon L.","Yann R.","Inès B.","Patrick H.","Clara M.","Sébastien G.","Amandine T.","Jérôme P.","Lucie F.","Maxime D.","Sarah B.","Vincent L.","Élodie R.","Bruno M.","Charlotte P.","Alexandre N.","Marine G.","Christophe B.","Audrey L.","Florian D.","Nadia K.","Guillaume R.","Justine M.","Damien P.","Léa B.","Frédéric T.","Morgane L.","Kévin D."];
const TITLES = {
  5: ["Parfait !","Je recommande à 100%","Au top, rien à dire","Un achat que je ne regrette pas","Excellent produit","Conquise !","Exactement ce que je cherchais","Bluffant","Le meilleur achat de l'année","Qualité au rendez-vous"],
  4: ["Très satisfait","Bon produit","Conforme à mes attentes","Très bien dans l'ensemble","Content de mon achat","Rapport qualité prix correct","Je recommande"],
  3: ["Correct sans plus","Bien mais quelques réserves","Moyen","Pas mal mais peut mieux faire"],
  2: ["Un peu déçu","Mitigé","En dessous de mes attentes"],
};
const OPEN = ["Livraison rapide et soignée.","Reçu en quelques jours, bien emballé.","Commande arrivée plus vite que prévu.","Premier achat sur la boutique, et franchement bonne surprise.","J'hésitais avant de commander, je ne regrette pas.","Produit reçu en parfait état.","Très bon contact avec le service client.","Emballage nickel, produit conforme à la description."];
const MID = {
  robot: ["Il fait gagner un temps fou en cuisine.","Toute la famille en profite, on cuisine bien plus qu'avant.","Facile à prendre en main même sans être un cordon-bleu.","La qualité de fabrication est vraiment au rendez-vous.","On sent le matériel haut de gamme."],
  bol: ["Exactement le complément qu'il me manquait.","La qualité de l'inox est vraiment top.","Parfaitement compatible, aucun souci de montage.","Très pratique au quotidien."],
  "écran": ["L'écran est grand et bien net.","Le tactile répond parfaitement.","Super pratique de pouvoir le déplacer partout.","Idéal à la maison, on s'en sert tous les jours."],
  machine: ["Un vrai gain de temps au quotidien.","Le rendu est bluffant, le linge est net.","Facile à utiliser, même pour les enfants.","Ça change la vie pour les familles."],
};
const CLOSE = ["Je recommande sans hésiter.","Très content, je rachèterais les yeux fermés.","Conforme à mes attentes, merci.","Parfait, rien à redire.","Je referai appel à cette boutique.","À recommander.","Très bon achat dans l'ensemble.",""];
const MID3 = ["Correct mais le prix reste élevé.","Bon produit, juste un délai un peu long.","Fonctionne bien, la notice pourrait être plus claire.","Satisfait dans l'ensemble malgré un petit défaut."];

function rnd(a){return a[Math.floor(Math.random()*a.length)];}
function pickRating(){const r=Math.random();if(r<0.60)return 5;if(r<0.88)return 4;if(r<0.97)return 3;return 2;}

function makeReviews(prod, n) {
  const out = []; const used = new Set();
  const now = Date.now();
  for (let i=0;i<n;i++){
    const rating = pickRating();
    let author; do { author = rnd(NAMES); } while (used.has(author) && used.size < NAMES.length); used.add(author);
    let body;
    if (rating >= 4) {
      const parts = [];
      if (Math.random()<0.7) parts.push(rnd(OPEN));
      parts.push(Math.random()<0.6 ? rnd(prod.highlights) + "." : rnd(MID[prod.topic]||MID.robot));
      if (rating===5 && Math.random()<0.6) parts.push(rnd(prod.highlights)+".");
      if (Math.random()<0.8) parts.push(rnd(CLOSE));
      body = parts.filter(Boolean).map((s)=>s.charAt(0).toUpperCase()+s.slice(1)).join(" ");
    } else {
      body = rnd(MID3);
    }
    const daysAgo = Math.floor(Math.random()*300)+2;
    const d = new Date(now - daysAgo*86400000);
    out.push({
      product: prod._id,
      author, rating,
      title: rnd(TITLES[rating]),
      body,
      verifiedPurchase: Math.random()<0.85,
      status: "published",
      createdAt: d, updatedAt: d,
    });
  }
  return out;
}

(async () => {
  const m = await connect();
  const Products = m.connection.collection("products");
  const Reviews = m.connection.collection("reviews");
  const { ObjectId } = require("mongodb");

  for (const [id, copy] of Object.entries(COPY)) {
    const _id = new ObjectId(id);
    const prod = await Products.findOne({ _id });
    if (!prod) { console.log("⚠️  introuvable", id); continue; }

    // 1) Mise à jour du contenu
    const set = {
      title: copy.title,
      shortDescription: copy.shortDescription,
      description: copy.description,
      seo: copy.seo,
      specs: copy.specs,
      soldCount: copy.soldCount,
    };
    // Renommage des variantes (Foldimate)
    if (copy.variantRename && Array.isArray(prod.variants)) {
      set.variants = prod.variants.map((v) => ({ ...v, title: copy.variantRename[v.title] || v.title }));
    }

    // 2) Avis : on purge les anciens puis on régénère (idempotent)
    await Reviews.deleteMany({ product: _id });
    const n = Math.floor(Math.random()*11)+20; // 20 à 30
    const reviews = makeReviews({ _id, topic: copy.topic, highlights: copy.highlights }, n);
    await Reviews.insertMany(reviews);

    const avg = reviews.reduce((s,r)=>s+r.rating,0)/reviews.length;
    set.ratingAvg = Math.round(avg*10)/10;
    set.reviewCount = reviews.length;

    await Products.updateOne({ _id }, { $set: set });
    console.log(`✅ ${copy.title}\n   ${n} avis · note ${set.ratingAvg}★ · ${copy.soldCount} vendus`);
  }

  await m.disconnect();
  console.log("\nTerminé.");
})().catch(e=>{console.error(e);process.exit(1)});
