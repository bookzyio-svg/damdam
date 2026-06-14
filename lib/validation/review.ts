import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

/** Avis déposé depuis le storefront (passe en modération avant publication). */
export const reviewCreateSchema = z.object({
  product: objectId,
  author: z.string().min(1, "Nom requis").max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().default(""),
  body: z.string().min(1, "Avis requis").max(2000),
});

/** Modération (admin). */
export const reviewModerateSchema = z.object({
  status: z.enum(["pending", "published", "rejected"]),
});

/** Création d'un avis par l'admin (publié par défaut). */
export const reviewAdminCreateSchema = z.object({
  product: objectId,
  author: z.string().min(1, "Nom requis").max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().default(""),
  body: z.string().min(1, "Avis requis").max(2000),
  status: z.enum(["pending", "published", "rejected"]).optional().default("published"),
  verifiedPurchase: z.boolean().optional().default(false),
});
