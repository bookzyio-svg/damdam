import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getSettings } from "@/lib/settings";
import { getDeliverySteps } from "@/lib/delivery";
import { serialize } from "@/lib/serialize";
import OrderDetail from "@/components/admin/OrderDetail";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();
  const order = await Order.findById(params.id).lean();
  if (!order) notFound();

  const settings = await getSettings();
  const steps = getDeliverySteps(settings.toObject()).map((s) => ({ key: s.key, label: s.label }));

  return <OrderDetail initial={serialize(order)} steps={steps} />;
}
