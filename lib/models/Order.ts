import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * Order — commande en CHECKOUT INVITÉ (pas de compte client en v1).
 * Paiement par virement : statut initial `pending_payment`.
 * Livraison maison HYBRIDE : avancement auto sur timer + override manuel (§8).
 */

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    title: String,
    variantTitle: String,
    sku: String,
    price: Number, // centimes, figé au moment de la commande
    quantity: Number,
    image: String,
  },
  { _id: false },
);

const OrderAddressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    postalCode: String,
    country: { type: String, default: "France" },
    phone: String,
  },
  { _id: false },
);

const GeoPointSchema = new Schema(
  { label: String, lat: Number, lng: Number },
  { _id: false },
);

const TimelineEntrySchema = new Schema(
  {
    stepKey: String,
    label: String,
    location: GeoPointSchema,
    note: String,
    at: Date,
    notified: { type: Boolean, default: false },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, index: true }, // CMD-2026-00001
    paymentReference: { type: String, unique: true, index: true }, // motif virement, ex TX-7F3K9

    customer: {
      name: String,
      email: String,
      phone: String,
    },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },

    items: [OrderItemSchema],

    subtotal: Number,
    discountTotal: Number,
    shippingTotal: Number,
    total: Number, // centimes

    promoCode: {
      code: String,
      type: { type: String }, // "percentage" | "fixed" — `type` imbriqué => désambiguïsation Mongoose
      value: Number,
    },

    shippingAddress: OrderAddressSchema,

    paymentMethod: { type: String, default: "bank_transfer" },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "preparing",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending_payment",
      index: true,
    },
    paymentConfirmedAt: Date,
    paymentConfirmedBy: String,
    // Preuves de virement envoyées par le client (captures)
    paymentProofs: [{ url: String, publicId: String, at: Date, _id: false }],

    // LIVRAISON MAISON (hybride)
    delivery: {
      deliveryNumber: { type: String, index: true }, // généré à la confirmation du paiement
      currentStepKey: String,
      estimatedDelivery: Date,
      driver: { name: String, phone: String },
      currentLocation: GeoPointSchema,
      nextAutoAdvanceAt: Date, // avancement auto sur timer
      timeline: [TimelineEntrySchema],
    },

    statusHistory: [
      {
        status: String,
        note: String,
        at: Date,
        by: String,
      },
    ],

    customerNotes: String,
    adminNotes: String,
    emailsSent: [{ type: { type: String }, at: Date }],
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ||
  mongoose.model<OrderDoc>("Order", OrderSchema);

export default Order;
