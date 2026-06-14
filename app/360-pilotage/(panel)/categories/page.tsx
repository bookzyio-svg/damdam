import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await connectDB();
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Catégories</h1>
      <CategoriesManager initial={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
