import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * Settings — document SINGLETON (un seul document, clé `singleton:"main"`).
 * Contient toute la configuration éditable de la boutique : coordonnées
 * bancaires (modifiables à tout moment), livraison maison (étapes + délais
 * auto du timer), chatbot, relances, pages légales, SEO.
 */

const AddressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    postalCode: String,
    country: { type: String, default: "France" },
  },
  { _id: false },
);

const ShippingZoneSchema = new Schema(
  {
    name: String,
    postalCodePrefixes: [String],
    cost: Number, // centimes
    estimatedDays: String,
  },
  { _id: false },
);

const CountryRateSchema = new Schema(
  {
    country: String, // nom du pays (ex: "Espagne") — hors France
    cost: Number, // centimes (surcoût/forfait pour ce pays)
    estimatedDays: String,
  },
  { _id: false },
);

const DeliveryStepSchema = new Schema(
  {
    key: { type: String, required: true }, // ex: "preparation"
    label: String, // ex: "En préparation"
    description: String,
    autoAfterHours: Number, // délai (en heures, après paiement) avant passage auto
    notifyCustomer: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const SettingsSchema = new Schema(
  {
    singleton: { type: String, default: "main", unique: true },

    store: {
      name: String,
      slogan: String,
      logoUrl: String,
      email: String,
      phone: String,
      address: AddressSchema,
    },

    // Coordonnées bancaires — MODIFIABLES À TOUT MOMENT (§7, §9)
    bank: {
      titulaire: String,
      iban: String,
      bic: String,
      banque: String,
      instructions: String,
      transferNoticeThreshold: Number, // centimes ; au-delà → modal "paiement par virement"
    },

    shipping: {
      freeShippingThreshold: Number, // centimes ; au-delà : port offert
      flatRate: Number, // centimes ; tarif par défaut
      zones: [ShippingZoneSchema],
      countryRates: [CountryRateSchema], // surcoût/forfait par pays (hors France)
    },

    // Transporteur maison : étapes ordonnées + délais d'avancement AUTO (§8)
    deliverySteps: [DeliveryStepSchema],
    delivery: {
      autoAdvance: { type: Boolean, default: true }, // hybride : auto par défaut
    },

    chatbot: {
      enabled: { type: Boolean, default: true },
      greeting: String,
      systemPrompt: String,
    },

    relance: {
      enabled: { type: Boolean, default: true },
      abandonedCartDelaysHours: { type: [Number], default: [3, 24, 72] },
      unpaidOrderDelaysHours: { type: [Number], default: [24, 72] },
    },

    legal: {
      mentions: String,
      cgv: String,
      confidentialite: String,
      retractation: String,
    },

    seo: {
      title: String,
      description: String,
      ogImage: String,
    },

    // Bannières du carrousel d'accueil (images uploadées sur Cloudinary)
    homeBanners: [
      {
        imageUrl: String,
        title: String,
        subtitle: String,
        ctaText: String,
        ctaHref: String,
        _id: false,
      },
    ],

    // whatsapp: {...}  // PHASE 2
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;

export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as Model<SettingsDoc>) ||
  mongoose.model<SettingsDoc>("Settings", SettingsSchema);

export default Settings;
