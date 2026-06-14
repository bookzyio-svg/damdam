import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Product } from "@/lib/models/Product";

/**
 * Recalcule Product.ratingAvg & reviewCount à partir des avis PUBLIÉS (§6).
 * À appeler après chaque changement de statut d'avis.
 */
export async function recomputeProductRating(productId: string | Types.ObjectId) {
  await connectDB();
  const result = await Review.aggregate([
    { $match: { product: new Types.ObjectId(String(productId)), status: "published" } },
    {
      $group: {
        _id: "$product",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = result[0];
  const ratingAvg = stats ? Math.round(stats.avg * 10) / 10 : 0;
  const reviewCount = stats ? stats.count : 0;

  await Product.findByIdAndUpdate(productId, { ratingAvg, reviewCount });
  return { ratingAvg, reviewCount };
}
