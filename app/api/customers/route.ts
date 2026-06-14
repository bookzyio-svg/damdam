import { connectDB } from "@/lib/db";
import { Customer } from "@/lib/models/Customer";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

/** GET /api/customers — liste clients (admin), recherche + pagination. */
export async function GET(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") || "-createdAt";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .select("email name phone totalOrders totalSpent acceptsMarketing createdAt")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return Response.json({
    customers: serialize(items),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}
