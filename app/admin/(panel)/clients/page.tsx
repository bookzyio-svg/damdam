import CustomersTable from "@/components/admin/CustomersTable";

export const dynamic = "force-dynamic";

export default function AdminCustomersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Clients</h1>
      <CustomersTable />
    </div>
  );
}
