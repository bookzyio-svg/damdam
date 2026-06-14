import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Customer } from "@/lib/models/Customer";
import { Order } from "@/lib/models/Order";
import { serialize } from "@/lib/serialize";
import { formatPrice } from "@/lib/utils/money";
import { ORDER_STATUS, orderStatusLabel } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  await connectDB();
  const customerDoc = await Customer.findById(params.id).lean();
  if (!customerDoc) notFound();
  const customer = serialize(customerDoc);

  const orders = serialize(
    await Order.find({ customerId: params.id })
      .select("orderNumber total status createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  );

  const addr = customer.addresses?.[0];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/360-pilotage/clients" className="text-sm text-brand hover:underline">← Clients</Link>
        <h1 className="text-2xl font-bold">{customer.name || customer.email}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Infos */}
        <section className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-line bg-white p-5 text-sm shadow-sm">
            <h2 className="mb-3 font-bold">Coordonnées</h2>
            <div className="space-y-1">
              <div className="text-ink">{customer.email}</div>
              {customer.phone ? <div className="text-muted">{customer.phone}</div> : null}
              {addr ? (
                <div className="mt-2 text-muted">
                  {addr.line1}{addr.line2 ? <>, {addr.line2}</> : null}<br />
                  {addr.postalCode} {addr.city}<br />
                  {addr.country}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-white p-4 text-center shadow-sm">
              <div className="text-xs text-muted">Commandes</div>
              <div className="text-xl font-extrabold">{customer.totalOrders ?? 0}</div>
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-center shadow-sm">
              <div className="text-xs text-muted">Total dépensé</div>
              <div className="text-xl font-extrabold text-deal">{formatPrice(customer.totalSpent ?? 0)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4 text-sm shadow-sm">
            Newsletter : {customer.acceptsMarketing ? <span className="font-semibold text-stock">Abonné</span> : <span className="text-muted">Non</span>}
          </div>
        </section>

        {/* Commandes */}
        <section className="rounded-xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 font-bold">Historique de commandes</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">Aucune commande.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {orders.map((o: { _id: string; orderNumber: string; total: number; status: string; createdAt?: string }) => (
                  <tr key={o._id} className="border-b border-line/60">
                    <td className="py-2"><Link href={`/360-pilotage/commandes/${o._id}`} className="font-semibold text-brand hover:underline">{o.orderNumber}</Link></td>
                    <td className="py-2">{formatPrice(o.total)}</td>
                    <td className="py-2"><span className={`rounded px-2 py-0.5 text-xs ${ORDER_STATUS[o.status]?.className ?? "bg-surface"}`}>{orderStatusLabel(o.status)}</span></td>
                    <td className="py-2 text-right text-xs text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
