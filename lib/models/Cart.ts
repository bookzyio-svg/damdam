import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * Cart — panier persistant (token), support des relances panier abandonné (§12).
 * `lastActivityAt` indexé pour le cron de relance.
 */

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    title: String,
    variantTitle: String,
    price: Number, // centimes
    quantity: Number,
    image: String,
  },
  { _id: false },
);

const CartSchema = new Schema(
  {
    token: { type: String, unique: true, index: true },
    email: String,
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    items: [CartItemSchema],
    subtotal: Number, // centimes
    recovered: { type: Boolean, default: false },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    remindersSent: [{ stage: Number, at: Date }],
    lastActivityAt: { type: Date, index: true },
  },
  { timestamps: true },
);

export type CartDoc = InferSchemaType<typeof CartSchema>;

export const Cart: Model<CartDoc> =
  (mongoose.models.Cart as Model<CartDoc>) ||
  mongoose.model<CartDoc>("Cart", CartSchema);

export default Cart;
