import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * Customer — créé/mis à jour au checkout invité (pas de compte en v1).
 * Sert à l'historique, au total dépensé et au consentement marketing.
 */

const CustomerAddressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    postalCode: String,
    country: { type: String, default: "France" },
    isDefault: Boolean,
  },
  { _id: false },
);

const CustomerSchema = new Schema(
  {
    email: { type: String, unique: true, index: true },
    name: String,
    phone: String,
    addresses: [CustomerAddressSchema],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }, // centimes
    acceptsMarketing: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true },
);

export type CustomerDoc = InferSchemaType<typeof CustomerSchema>;

export const Customer: Model<CustomerDoc> =
  (mongoose.models.Customer as Model<CustomerDoc>) ||
  mongoose.model<CustomerDoc>("Customer", CustomerSchema);

export default Customer;
