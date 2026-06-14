import Link from "next/link";
import { Euro, ShoppingBag, Wallet, AlertTriangle, type LucideIcon } from "lucide-react";
import { getDashboardKpis } from "@/lib/admin/kpis";
import { formatPrice } from "@/lib/utils/money";
import { ORDER_STATUS, orderStatusLabel } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const k = await getDashboardKpis();

  const kpis: { label: string; value: string; icon: LucideIcon; alert?: boolean }[] = [
    { label: "CA encaissé (30 j)", value: formatPrice(k.revenue30), icon: Euro },
    { label: "Commandes payées (30 j)", value: String(k.orders30), icon: ShoppingBag },
    { label: "Panier moyen", value: formatPrice(k.avgBasket), icon: Wallet },
    { label: "Virements en attente +48 h", value: String(k.alerts.pendingOver48h), icon: AlertTriangle, alert: k.alerts.pendingOver48h > 0 },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${kpi.alert ? "border-deal/40" : "border-line"}`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${kpi.alert ? "bg-deal-soft text-deal" : "bg-brand/10 text-brand"}`}>
              <kpi.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-muted">{kpi.label}</div>
              <div className={`mt-0.5 text-xl font-extrabold ${kpi.alert ? "text-deal" : "text-ink"}`}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Commandes par statut */}
        <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Commandes par statut</h2>
          <ul className="space-y-1.5 text-sm">
            {Object.keys(ORDER_STATUS).map((status) => (
              <li key={status} className="flex items-center justify-between">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${ORDER_STATUS[status].className}`}>{ORDER_STATUS[status].label}</span>
                <span className="font-semibold">{k.byStatus[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Top produits */}
        <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Meilleures ventes</h2>
          {k.topProducts.length === 0 ? (
            <p className="text-sm text-muted">Aucune vente pour l&apos;instant.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {k.topProducts.map((p: { title: string; soldCount?: number; price: number }, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{i + 1}. {p.title}</span>
                  <span className="shrink-0 text-muted">{p.soldCount ?? 0} vendus</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Alertes stock */}
        <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Stock bas</h2>
          {k.alerts.lowStock.length === 0 ? (
            <p className="text-sm text-muted">Aucune alerte de stock.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {k.alerts.lowStock.map((p: { title: string; stock?: number }, i: number) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{p.title}</span>
                  <span className="shrink-0 font-semibold text-deal">{p.stock ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Commandes récentes */}
      <section className="mt-6 rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Commandes récentes</h2>
          <Link href="/360-pilotage/commandes" className="text-sm text-brand hover:underline">Tout voir →</Link>
        </div>
        {k.recentOrders.length === 0 ? (
          <p className="text-sm text-muted">Aucune commande.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {k.recentOrders.map((o: { _id: string; orderNumber: string; customer?: { name?: string }; total: number; status: string; createdAt?: string }) => (
                <tr key={o._id} className="border-b border-line/60">
                  <td className="py-2">
                    <Link href={`/360-pilotage/commandes/${o._id}`} className="font-semibold text-brand hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="py-2 text-muted">{o.customer?.name}</td>
                  <td className="py-2">{formatPrice(o.total)}</td>
                  <td className="py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${ORDER_STATUS[o.status]?.className ?? "bg-surface"}`}>{orderStatusLabel(o.status)}</span>
                  </td>
                  <td className="py-2 text-right text-xs text-muted">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
