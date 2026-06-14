import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * Product — fiche produit (prix en CENTIMES). Gère stock, variantes, specs,
 * avis (agrégés), flash deals, état neuf/reconditionné, source d'import.
 */

const SpecSchema = new Schema(
  { label: String, value: String },
  { _id: false },
);

const ImageSchema = new Schema(
  { url: String, publicId: String, alt: String },
  { _id: false },
);

// Bloc de description riche : paragraphe de texte, image, ou vidéo
// (fichier Cloudinary ou lien YouTube). Affiché dans l'ordre sur la fiche.
const ContentBlockSchema = new Schema(
  {
    type: { type: String, enum: ["heading", "text", "image", "video"] },
    text: String, // bloc texte ou titre de section
    url: String, // image / vidéo (fichier hébergé ou lien YouTube)
    publicId: String, // si hébergé sur Cloudinary
    alt: String, // texte alternatif / légende
    provider: String, // vidéo : "file" | "youtube"
  },
  { _id: false },
);

const OptionSchema = new Schema(
  { name: String, values: [String] },
  { _id: false },
);

const VariantSchema = new Schema(
  {
    title: String,
    optionValues: Schema.Types.Mixed, // ex: { Couleur: "Noir", Taille: "55\"" }
    sku: String,
    price: Number, // centimes
    stock: Number,
    image: String,
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    brand: { type: String, index: true },
    description: String,
    shortDescription: String,
    contentBlocks: [ContentBlockSchema], // description riche (texte/image/vidéo)
    specs: [SpecSchema], // tableau de caractéristiques

    images: [ImageSchema],

    price: { type: Number, required: true }, // centimes
    compareAtPrice: Number, // prix barré (centimes)
    cost: Number,
    sku: String,
    barcode: String,

    trackStock: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },

    condition: {
      type: String,
      enum: ["neuf", "reconditionne"],
      default: "neuf",
    },

    hasVariants: { type: Boolean, default: false },
    options: [OptionSchema],
    variants: [VariantSchema],

    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    tags: [String],

    ratingAvg: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 }, // "X vendus"

    flashDeal: {
      active: { type: Boolean, default: false },
      endsAt: Date,
    },

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false },

    importSource: {
      type: { type: String }, // 'csv' | 'aliexpress' | 'url'
      ref: { type: String }, // identifiant source (id produit, URL…)
    },

    seo: {
      title: String,
      description: String,
    },
  },
  { timestamps: true },
);

// Recherche plein-texte simple (titre, marque, description)
ProductSchema.index({ title: "text", brand: "text", description: "text" });

export type ProductDoc = InferSchemaType<typeof ProductSchema>;

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);

export default Product;
