import { z } from "zod";

/**
 * Validation des produits. Tous les prix sont en CENTIMES (entiers).
 */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const cents = z.number().int().min(0);

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().default(""),
  alt: z.string().optional().default(""),
});

const specSchema = z.object({
  label: z.string().min(1),
  value: z.string().optional().default(""),
});

const contentBlockSchema = z.object({
  type: z.enum(["heading", "text", "image", "video"]),
  text: z.string().optional().default(""),
  url: z.string().optional().default(""),
  publicId: z.string().optional().default(""),
  alt: z.string().optional().default(""),
  provider: z.string().optional().default(""),
});

const optionSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string()).default([]),
});

const variantSchema = z.object({
  title: z.string().min(1),
  optionValues: z.any().optional(),
  sku: z.string().optional().default(""),
  price: cents.optional(),
  stock: z.number().int().optional().default(0),
  image: z.string().optional().default(""),
});

const flashDealSchema = z.object({
  active: z.boolean().default(false),
  endsAt: z.coerce.date().nullable().optional(),
});

export const productCreateSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  slug: z.string().max(220).optional(),
  brand: z.string().max(120).optional().default(""),
  description: z.string().optional().default(""),
  shortDescription: z.string().max(400).optional().default(""),
  contentBlocks: z.array(contentBlockSchema).default([]),
  specs: z.array(specSchema).default([]),
  images: z.array(imageSchema).default([]),

  price: cents,
  compareAtPrice: cents.optional().nullable(),
  cost: cents.optional().nullable(),
  sku: z.string().optional().default(""),
  barcode: z.string().optional().default(""),

  trackStock: z.boolean().default(true),
  stock: z.number().int().default(0),

  condition: z.enum(["neuf", "reconditionne"]).default("neuf"),

  hasVariants: z.boolean().default(false),
  options: z.array(optionSchema).default([]),
  variants: z.array(variantSchema).default([]),

  category: objectId.nullable().optional(),
  tags: z.array(z.string()).default([]),

  flashDeal: flashDealSchema.optional(),

  status: z.enum(["active", "draft", "archived"]).default("draft"),
  featured: z.boolean().default(false),

  seo: z
    .object({
      title: z.string().max(200).optional().default(""),
      description: z.string().max(400).optional().default(""),
    })
    .optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
