import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

/**
 * Validation des codes promo (admin). `value` :
 *  - type "percentage" → pourcentage 0-100
 *  - type "fixed"      → montant en CENTIMES
 */
export const promoCreateSchema = z
  .object({
    code: z.string().min(2).max(40),
    description: z.string().max(300).optional().default(""),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().min(0),
    freeShipping: z.boolean().optional().default(false),
    minOrderAmount: z.number().int().min(0).optional().default(0),
    appliesTo: z.enum(["all", "categories", "products"]).optional().default("all"),
    categoryIds: z.array(objectId).optional().default([]),
    productIds: z.array(objectId).optional().default([]),
    maxUses: z.number().int().min(1).nullable().optional(),
    perCustomerLimit: z.number().int().min(1).nullable().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    active: z.boolean().optional().default(true),
  })
  .refine((d) => d.type !== "percentage" || d.value <= 100, {
    message: "Un pourcentage ne peut pas dépasser 100.",
    path: ["value"],
  });

export const promoUpdateSchema = promoCreateSchema;
