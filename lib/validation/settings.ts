import { z } from "zod";

/**
 * Schémas Zod par section du singleton Settings. La route PATCH /api/settings
 * reçoit { section, data } et valide `data` contre le schéma correspondant.
 * Tous les montants sont en CENTIMES (entiers).
 */

const cents = z.number().int().min(0);

export const storeSchema = z.object({
  name: z.string().max(120).optional().default(""),
  slogan: z.string().max(200).optional().default(""),
  logoUrl: z.string().url().or(z.literal("")).optional().default(""),
  email: z.string().email().or(z.literal("")).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  address: z
    .object({
      line1: z.string().optional().default(""),
      line2: z.string().optional().default(""),
      city: z.string().optional().default(""),
      postalCode: z.string().optional().default(""),
      country: z.string().optional().default("France"),
    })
    .optional(),
});

export const bankSchema = z.object({
  titulaire: z.string().max(120).optional().default(""),
  iban: z.string().max(40).optional().default(""),
  bic: z.string().max(20).optional().default(""),
  banque: z.string().max(120).optional().default(""),
  instructions: z.string().max(2000).optional().default(""),
  transferNoticeThreshold: cents.optional().default(50000), // 500 € par défaut
});

export const shippingZoneSchema = z.object({
  name: z.string().min(1),
  postalCodePrefixes: z.array(z.string()).default([]),
  cost: cents.default(0),
  estimatedDays: z.string().optional().default(""),
});

export const countryRateSchema = z.object({
  country: z.string().min(1),
  cost: cents.default(0),
  estimatedDays: z.string().optional().default(""),
});

export const shippingSchema = z.object({
  freeShippingThreshold: cents.default(0),
  flatRate: cents.default(0),
  zones: z.array(shippingZoneSchema).default([]),
  countryRates: z.array(countryRateSchema).default([]),
});

export const deliveryStepSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "clé en minuscules, chiffres et underscores"),
  label: z.string().min(1),
  description: z.string().optional().default(""),
  autoAfterHours: z.number().min(0).default(0),
  notifyCustomer: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const deliveryStepsSchema = z.array(deliveryStepSchema);

export const deliverySchema = z.object({
  autoAdvance: z.boolean().default(true),
});

export const chatbotSchema = z.object({
  enabled: z.boolean().default(true),
  greeting: z.string().max(500).optional().default(""),
  systemPrompt: z.string().max(4000).optional().default(""),
});

export const relanceSchema = z.object({
  enabled: z.boolean().default(true),
  abandonedCartDelaysHours: z.array(z.number().min(0)).default([3, 24, 72]),
  unpaidOrderDelaysHours: z.array(z.number().min(0)).default([24, 72]),
});

export const legalSchema = z.object({
  mentions: z.string().optional().default(""),
  cgv: z.string().optional().default(""),
  confidentialite: z.string().optional().default(""),
  retractation: z.string().optional().default(""),
});

export const homeBannerSchema = z.object({
  imageUrl: z.string().url().or(z.literal("")).optional().default(""),
  title: z.string().max(120).optional().default(""),
  subtitle: z.string().max(200).optional().default(""),
  ctaText: z.string().max(40).optional().default(""),
  ctaHref: z.string().max(200).optional().default(""),
});

export const homeBannersSchema = z.array(homeBannerSchema).max(8);

export const seoSchema = z.object({
  title: z.string().max(200).optional().default(""),
  description: z.string().max(400).optional().default(""),
  ogImage: z.string().url().or(z.literal("")).optional().default(""),
});

/** Table section → schéma. Sert aussi à valider le nom de section. */
export const SECTION_SCHEMAS = {
  store: storeSchema,
  bank: bankSchema,
  shipping: shippingSchema,
  deliverySteps: deliveryStepsSchema,
  delivery: deliverySchema,
  chatbot: chatbotSchema,
  relance: relanceSchema,
  legal: legalSchema,
  seo: seoSchema,
  homeBanners: homeBannersSchema,
} as const;

export type SettingsSection = keyof typeof SECTION_SCHEMAS;
