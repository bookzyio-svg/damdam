import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders — liste des commandes (admin), filtrable par statut et
 * recherche (numéro / référence virement / email), paginée.
 */
export async function GET(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (q) {
    filter.$or = [
      { orderNumber: { $regex: q, $options: "i" } },
      { paymentReference: { $regex: q, $options: "i" } },
      { "customer.email": { $regex: q, $options: "i" } },
      { "customer.name": { $regex: q, $options: "i" } },
      { "delivery.deliveryNumber": { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .select("orderNumber paymentReference customer total status createdAt paymentConfirmedAt delivery.deliveryNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return Response.json({
    orders: serialize(items),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}
