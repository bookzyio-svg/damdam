import OrdersTable from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Commandes</h1>
      <OrdersTable />
    </div>
  );
}
