const { connect } = require("./_db");

// Pour chaque produit : intro + sections {t: titre, b: corps}. Les images du
// produit (hors photo principale) sont intercalées après chaque section.
const C = {
  // TM7
  "6a2b820894ce45ee23f3f911": {
    intro: "Le Thermomix® TM7™ est la nouvelle génération du robot de cuisine le plus célèbre au monde — et il place la barre encore plus haut. Dans un seul appareil élégant et compact, il réunit le travail de plus de 20 ustensiles et électroménagers : balance, mixeur, blender, robot pâtissier, cuiseur vapeur, mijoteuse, moulin et bien plus.",
    sections: [
      { t: "Un grand écran tactile qui vous guide", b: "Au cœur du TM7™, un grand écran tactile haute définition affiche chaque recette pas à pas. Vous suivez les instructions, le robot ajuste automatiquement le temps, la température et la vitesse. Impossible de rater : la navigation est aussi fluide et intuitive que celle d'une tablette moderne." },
      { t: "100 000 recettes au bout des doigts", b: "Grâce au Wi-Fi intégré et à la plateforme Cookidoo®, accédez à plus de 100 000 recettes du monde entier, enrichies en continu. Planifiez vos menus de la semaine, générez votre liste de courses en un clic, et lancez-vous : de l'entrée au dessert, du pain maison aux plats mijotés, tout devient simple." },
      { t: "La précision et la puissance d'un pro", b: "Hacher, mixer, peser au gramme près, pétrir, émulsionner, faire revenir, cuire à la vapeur avec le Varoma, mijoter à basse température… Le TM7™ enchaîne les techniques avec une régularité parfaite. Son bol de 2,2 L est idéal pour les repas de toute la famille." },
      { t: "Pourquoi vous allez l'adopter", b: "• Vous gagnez un temps précieux chaque jour\n• Vous mangez plus sain, fait maison, sans plats préparés\n• Vous épatez vos invités sans stress\n• Vous ne nettoyez qu'un seul appareil au lieu de dix\n\nLe Thermomix® TM7™ n'est pas un gadget de plus : c'est un véritable assistant de cuisine. Essayez-le, vous ne reviendrez plus en arrière." },
    ],
  },
  // TM7 + Bol bundle
  "6a2b81e794ce45ee23f3f90a": {
    intro: "Offrez-vous l'expérience Thermomix® dans sa version la plus complète : le pack réunit le TM7™, la toute dernière génération du robot de cuisine le plus célèbre au monde, ET un bol mélangeur supplémentaire pour cuisiner absolument sans limite.",
    sections: [
      { t: "Plus de 20 appareils en un seul", b: "Balance de précision, mixeur, blender, robot pâtissier, cuiseur vapeur, mijoteuse, moulin, sorbetière… Le TM7™ remplace à lui seul une cuisine entière d'électroménagers. Vous libérez vos placards et votre plan de travail, et vous n'avez plus qu'un seul appareil à nettoyer." },
      { t: "Un écran tactile qui vous guide pas à pas", b: "Le grand écran tactile haute définition affiche chaque recette étape par étape. Le robot règle tout seul le temps, la température et la vitesse : vous n'avez qu'à suivre. Résultat parfait garanti, même si vous débutez en cuisine." },
      { t: "100 000 recettes, et un bol d'avance", b: "Via le Wi-Fi intégré et la plateforme Cookidoo®, accédez à plus de 100 000 recettes, planifiez vos menus et générez vos listes de courses en un clic. Et grâce au second bol inclus, vous préparez l'entrée pendant que le plat mijote, ou vous doublez les quantités pour vos invités — sans jamais vous arrêter." },
      { t: "Ce que vous gagnez vraiment", b: "• Du temps, chaque jour\n• Une cuisine plus saine, faite maison\n• La fin des plats préparés et du stress en cuisine\n• Un seul appareil à entretenir au lieu de dix\n\nLe pack idéal pour se lancer à fond, sans compromis." },
    ],
  },
  // Bol mélangeur TM7
  "6a2b81e194ce45ee23f3f909": {
    intro: "Et si vous ne deviez plus jamais vous arrêter en pleine recette pour laver votre bol ? Le Set Complet Bol Mélangeur Thermomix® a été pensé exactement pour ça : un second bol, prêt à l'emploi, qui vous permet d'enchaîner les préparations sans la moindre pause.",
    sections: [
      { t: "Tout ce que contient le set", b: "• Bol mélangeur en acier inoxydable haute qualité, avec chauffe et pesée intégrées\n• Couvercle verrouillable, pour une cuisson mains libres et 100 % sécurisée\n• Couteau mixeur de précision : il hache, mixe, broie, pétrit et émulsionne\n• Fouet papillon : crème montée, blancs en neige, préparations aériennes\n• Panier de cuisson : riz, légumes et ingrédients délicats, en préservant saveurs et nutriments" },
      { t: "L'accessoire qui change le quotidien", b: "Quand on cuisine pour la famille ou qu'on reçoit, le temps compte. Avec un deuxième bol, vous lancez le plat pendant que la sauce repose, vous passez du salé au sucré sans rincer, et vous préparez à l'avance pour vos réceptions. Plus de temps morts, plus de vaisselle au milieu d'une recette." },
      { t: "Robuste et facile à vivre", b: "Conçu pour durer et passer au lave-vaisselle, ce bol complet est l'indispensable des passionnés de Thermomix®. Compatible exclusivement avec le Thermomix® TM7™." },
    ],
  },
  // TM6 Sparkling Black
  "6a2b823394ce45ee23f3f91d": {
    intro: "Le Thermomix® TM6® Sparkling Black est une édition limitée qui célèbre 140 ans de passion et de savoir-faire. Son boîtier arbore un motif triangulaire gravé au laser et un éclat soyeux qui imite la surface scintillante d'un diamant : posé sur votre plan de travail, il devient le véritable bijou de la cuisine.",
    sections: [
      { t: "Aussi beau que résistant", b: "À l'image du diamant, la finition Sparkling Black est robuste, durable et résiste aux traces de doigts comme aux rayures. Un objet d'exception, pensé pour traverser les années sans perdre de son éclat." },
      { t: "20 appareils en un, une infinité de possibilités", b: "Le TM6® remplace une cuisine entière d'électroménagers : il hache, mixe, pèse, broie, fait revenir, cuit à la vapeur et mijote. Il va même plus loin avec ses modes avancés — cuisson sous vide, fermentation, mijotage lent, cuisson à haute température, caramélisation, épaississement — pour explorer toutes les techniques d'un grand chef." },
      { t: "Guidé, connecté, inratable", b: "Sur son écran tactile couleur, suivez chaque recette pas à pas pendant que le robot règle automatiquement temps, température et vitesse. Connecté en Wi-Fi à Cookidoo®, il vous ouvre plus de 80 000 recettes, avec menus de la semaine et listes de courses en un clic." },
      { t: "Pourquoi craquer", b: "• Une série limitée au design unique\n• La polyvalence légendaire du Thermomix®\n• Des cuissons précises et inratables, même pour les débutants\n• Le plaisir de cuisiner maison, sain et savoureux\n\nPerformance, élégance et exclusivité dans un même appareil." },
    ],
  },
  // KEFEYA (1 seule image → titres + texte sans images intercalées)
  "6a2ccf4bae2f2bb08d5e3bf2": {
    intro: "Imaginez un écran géant qui vous suit partout dans la maison. La TV Tablette Tactile Portable KEFEYA 32\" est exactement cela : un immense écran tactile monté sur un support mobile à roulettes, que vous déplacez en un geste, du salon à la cuisine, de la chambre au bureau.",
    sections: [
      { t: "Un écran tactile 32 pouces rien que pour vous", b: "Fini de se serrer autour d'un téléphone ou d'une petite tablette. Profitez d'un grand écran tactile de 32 pouces, lumineux et confortable, comme une tablette XXL au format télé. La dalle répond au doigt avec fluidité pour naviguer, lancer une vidéo ou faire défiler une recette." },
      { t: "Mobile, orientable, à la bonne hauteur", b: "Monté sur un pied à roulettes, l'écran se déplace sans effort et se règle en hauteur comme en inclinaison. Vous le positionnez exactement où vous en avez besoin, debout dans la cuisine ou assis dans le canapé, en portrait ou en paysage selon l'usage." },
      { t: "Un écran pour tous les moments", b: "• Streaming & TV : séries, films et plateformes vidéo sur grand écran\n• Visioconférence : appels en famille ou réunions, sans rien tenir en main\n• En cuisine : vos recettes en vidéo, toujours à portée de regard\n• Sport & fitness : suivez vos séances confortablement\n• Télétravail et devoirs des enfants : un grand écran d'appoint bien pratique" },
    ],
  },
  // Foldimate
  "6a2ccf7dae2f2bb08d5e3bf3": {
    intro: "Soyons honnêtes : plier le linge est sans doute la corvée la plus détestée de la maison. Et si une machine s'en chargeait à votre place ? C'est toute la promesse de Foldimate : votre linge plié net et impeccable, en quelques secondes, sans effort.",
    sections: [
      { t: "Comment ça marche", b: "Vous accrochez le vêtement à l'avant de la machine, et Foldimate s'occupe du reste : il le saisit, le plie automatiquement et le ressort parfaitement plié, prêt à être rangé. Un geste simple, un résultat régulier à chaque fois — bien plus net que le pliage à la main, et infiniment plus rapide." },
      { t: "Un linge net, sans les plis", b: "Au-delà du pliage, Foldimate aide à défroisser vos vêtements pour un rendu soigné, comme sorti d'une boutique. Vos chemises, t-shirts, serviettes et petits vêtements retrouvent une présentation impeccable dans vos placards." },
      { t: "Pensé pour le quotidien des familles", b: "• Gagnez un temps précieux à chaque lessive\n• Dites adieu aux piles de linge qui s'accumulent\n• Un résultat régulier, propre et bien plié\n• Même les enfants adorent s'en servir : la corvée devient un jeu" },
      { t: "Le confort moderne à la maison", b: "Foldimate transforme une tâche pénible et répétitive en un geste rapide et presque amusant. Plus de soirées passées à plier devant la télé : vous récupérez votre temps, et votre linge n'a jamais été aussi bien rangé.\n\nDisponible en plusieurs coloris et modèles — choisissez le vôtre ci-dessus." },
    ],
  },
};

(async () => {
  const m = await connect();
  const { ObjectId } = require("mongodb");
  const Products = m.connection.collection("products");

  for (const [id, c] of Object.entries(C)) {
    const _id = new ObjectId(id);
    const p = await Products.findOne({ _id });
    if (!p) { console.log("⚠️ introuvable", id); continue; }

    // Images à intercaler : on saute la photo principale (déjà dans la galerie)
    const pool = (p.images || []).slice(1).map((im) => im.url);

    const blocks = [{ type: "text", text: c.intro }];
    c.sections.forEach((s, i) => {
      blocks.push({ type: "heading", text: s.t });
      blocks.push({ type: "text", text: s.b });
      if (i < pool.length) blocks.push({ type: "image", url: pool[i], alt: s.t, publicId: "", provider: "" });
    });

    await Products.updateOne({ _id }, { $set: { contentBlocks: blocks } });
    const imgCount = blocks.filter((b) => b.type === "image").length;
    console.log(`✅ ${p.title}\n   ${blocks.length} blocs · ${c.sections.length} titres · ${imgCount} images`);
  }

  await m.disconnect();
  console.log("\nBlocs construits.");
})().catch((e) => { console.error(e); process.exit(1); });
