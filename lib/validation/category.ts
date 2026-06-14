import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Identifiant invalide");

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(120),
  slug: z.string().max(140).optional(),
  parent: objectId.nullable().optional(),
  imageUrl: z.string().url().or(z.literal("")).optional().default(""),
  order: z.number().int().min(0).optional().default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
