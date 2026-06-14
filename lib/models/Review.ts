import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * Review — avis client. À chaque passage en "published" (ou rejet), on
 * recalcule Product.ratingAvg & reviewCount (logique côté API d'admin).
 */
const ReviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    author: String,
    rating: { type: Number, min: 1, max: 5 },
    title: String,
    body: String,
    verifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "published", "rejected"],
      default: "published",
    },
  },
  { timestamps: true },
);

export type ReviewDoc = InferSchemaType<typeof ReviewSchema>;

export const Review: Model<ReviewDoc> =
  (mongoose.models.Review as Model<ReviewDoc>) ||
  mongoose.model<ReviewDoc>("Review", ReviewSchema);

export default Review;
