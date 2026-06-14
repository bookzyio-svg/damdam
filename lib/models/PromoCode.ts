import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * PromoCode — réduction %/fixe, port offert, ciblage (tout/catégories/produits),
 * limites d'usage. Validation et recalcul TOUJOURS côté serveur (§11).
 */
const PromoCodeSchema = new Schema(
  {
    code: { type: String, unique: true, uppercase: true, index: true },
    description: String,
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: Number, // pourcentage (0-100) ou centimes selon `type`
    freeShipping: { type: Boolean, default: false },
    minOrderAmount: { type: Number, default: 0 }, // centimes
    appliesTo: {
      type: String,
      enum: ["all", "categories", "products"],
      default: "all",
    },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    maxUses: Number,
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: Number,
    startsAt: Date,
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type PromoCodeDoc = InferSchemaType<typeof PromoCodeSchema>;

export const PromoCode: Model<PromoCodeDoc> =
  (mongoose.models.PromoCode as Model<PromoCodeDoc>) ||
  mongoose.model<PromoCodeDoc>("PromoCode", PromoCodeSchema);

export default PromoCode;
