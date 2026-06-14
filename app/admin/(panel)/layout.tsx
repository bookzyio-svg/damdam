import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export const dynamic = "force-dynamic";

/** Chrome du back-office authentifié : sidebar + topbar. */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Défense en profondeur : aucune page du panneau ne s'affiche sans session.
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
