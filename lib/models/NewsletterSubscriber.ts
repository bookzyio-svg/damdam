import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/** Abonné à la newsletter (capture d'email). */
const NewsletterSubscriberSchema = new Schema(
  {
    email: { type: String, unique: true, lowercase: true, index: true },
    source: { type: String, default: "site" }, // footer | home | checkout…
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type NewsletterSubscriberDoc = InferSchemaType<typeof NewsletterSubscriberSchema>;

export const NewsletterSubscriber: Model<NewsletterSubscriberDoc> =
  (mongoose.models.NewsletterSubscriber as Model<NewsletterSubscriberDoc>) ||
  mongoose.model<NewsletterSubscriberDoc>("NewsletterSubscriber", NewsletterSubscriberSchema);

export default NewsletterSubscriber;
