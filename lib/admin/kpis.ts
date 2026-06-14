import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { serialize } from "@/lib/serialize";

const PAID_STATUSES = ["paid", "preparing", "shipped", "in_transit", "out_for_delivery", "delivered"];
const LOW_STOCK_THRESHOLD = 5;

/** Agrège les indicateurs du tableau de bord (§9, §17.12). */
export async function getDashboardKpis() {
  await connectDB();
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 3_600_000);
  const before48h = new Date(now - 48 * 3_600_000);

  const [revenueAgg, basketAgg, byStatusAgg, topProducts, recentOrders, pendingOver48h, lowStock] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: PAID_STATUSES }, paymentConfirmedAt: { $gte: since30 } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: PAID_STATUSES } } },
        { $group: { _id: null, avg: { $avg: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Product.find({ status: "active" }).sort({ soldCount: -1 }).limit(5).select("title soldCount price").lean(),
      Order.find().sort({ createdAt: -1 }).limit(8).select("orderNumber customer total status createdAt").lean(),
      Order.countDocuments({ status: "pending_payment", createdAt: { $lte: before48h } }),
      Product.find({ status: "active", trackStock: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
        .sort({ stock: 1 })
        .limit(10)
        .select("title stock")
        .lean(),
    ]);

  const byStatus: Record<string, number> = {};
  for (const s of byStatusAgg) byStatus[s._id] = s.count;

  return {
    revenue30: revenueAgg[0]?.total ?? 0,
    orders30: revenueAgg[0]?.count ?? 0,
    avgBasket: Math.round(basketAgg[0]?.avg ?? 0),
    paidCount: basketAgg[0]?.count ?? 0,
    byStatus,
    topProducts: serialize(topProducts),
    recentOrders: serialize(recentOrders),
    alerts: {
      pendingOver48h,
      lowStock: serialize(lowStock),
    },
  };
}
