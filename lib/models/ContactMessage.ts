import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/** Message envoyé via le formulaire de contact. */
const ContactMessageSchema = new Schema(
  {
    name: String,
    email: { type: String, index: true },
    subject: String,
    message: String,
    handled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ContactMessageDoc = InferSchemaType<typeof ContactMessageSchema>;

export const ContactMessage: Model<ContactMessageDoc> =
  (mongoose.models.ContactMessage as Model<ContactMessageDoc>) ||
  mongoose.model<ContactMessageDoc>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
