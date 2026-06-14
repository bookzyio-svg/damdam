import "./load-env";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { Settings } from "../lib/models/Settings";

/**
 * Initialise le document Settings (singleton) avec des valeurs par défaut
 * cohérentes : étapes de livraison maison, délais de relance, réassurance.
 * Idempotent : ne réécrase pas un Settings déjà personnalisé (upsert sur défauts).
 *
 *   npm run seed:settings
 */
const DEFAULT_DELIVERY_STEPS = [
  {
    key: "paiement_recu",
    label: "Paiement reçu",
    description: "Votre virement a bien été réceptionné.",
    autoAfterHours: 0,
    notifyCustomer: true,
    order: 0,
  },
  {
    key: "preparation",
    label: "En préparation",
    description: "Votre commande est en cours de préparation dans notre entrepôt.",
    autoAfterHours: 6,
    notifyCustomer: true,
    order: 1,
  },
  {
    key: "expedie",
    label: "Expédiée",
    description: "Votre colis a quitté notre entrepôt.",
    autoAfterHours: 18,
    notifyCustomer: true,
    order: 2,
  },
  {
    key: "en_transit",
    label: "En transit",
    description: "Votre colis voyage vers le centre de distribution le plus proche.",
    autoAfterHours: 24,
    notifyCustomer: true,
    order: 3,
  },
  {
    key: "en_livraison",
    label: "En cours de livraison",
    description: "Votre colis est avec le livreur, livraison aujourd'hui.",
    autoAfterHours: 24,
    notifyCustomer: true,
    order: 4,
  },
  {
    key: "livre",
    label: "Livré",
    description: "Votre colis a été livré. Merci de votre confiance !",
    autoAfterHours: 6,
    notifyCustomer: true,
    order: 5,
  },
];

async function main() {
  await connectDB();

  const existing = await Settings.findOne({ singleton: "main" });
  if (existing) {
    // Ne complète que les étapes de livraison si elles sont absentes
    if (!existing.deliverySteps || existing.deliverySteps.length === 0) {
      existing.set("deliverySteps", DEFAULT_DELIVERY_STEPS);
      await existing.save();
      console.log("✅ Settings existant : étapes de livraison ajoutées.");
    } else {
      console.log("ℹ️  Settings déjà initialisé, aucune modification.");
    }
  } else {
    await Settings.create({
      singleton: "main",
      store: {
        name: "Boutique high-tech",
        slogan: "L'électroménager et la high-tech au meilleur prix",
        email: "commandes@tondomaine.fr",
        address: { country: "France" },
      },
      bank: {
        titulaire: "À COMPLÉTER",
        iban: "FR00 0000 0000 0000 0000 0000 000",
        bic: "XXXXXXXX",
        banque: "À COMPLÉTER",
        instructions:
          "Effectuez le virement du montant exact en indiquant la référence en motif. Votre commande est expédiée dès réception.",
      },
      shipping: {
        freeShippingThreshold: 4900, // 49,00 €
        flatRate: 590, // 5,90 €
        zones: [],
      },
      deliverySteps: DEFAULT_DELIVERY_STEPS,
      delivery: { autoAdvance: true },
      chatbot: {
        enabled: true,
        greeting: "Bonjour 👋 Comment puis-je vous aider ?",
        systemPrompt:
          "Tu es l'assistant de la boutique. Tu aides sur les produits, le suivi de commande et le paiement par virement. Reste factuel et courtois.",
      },
      relance: {
        enabled: true,
        abandonedCartDelaysHours: [3, 24, 72],
        unpaidOrderDelaysHours: [24, 72],
      },
      legal: {},
      seo: {
        title: "Boutique high-tech — Électroménager, TV & High-Tech",
        description:
          "Électroménager, TV, audio, informatique et téléphonie au meilleur prix. Livraison suivie, paiement sécurisé, retour 14 jours.",
      },
    });
    console.log("✅ Settings initialisé avec les valeurs par défaut.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed settings échoué :", err);
  process.exit(1);
});
