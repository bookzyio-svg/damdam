import ProductsTable from "@/components/admin/ProductsTable";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Produits</h1>
      <ProductsTable />
    </div>
  );
}
