import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/** Category — arborescence simple (parent unique), ordonnée, avec image. */
const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    imageUrl: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) ||
  mongoose.model<CategoryDoc>("Category", CategorySchema);

export default Category;
