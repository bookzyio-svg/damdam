import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { serialize } from "@/lib/serialize";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await connectDB();
  const categories = await Category.find().sort({ order: 1, name: 1 }).select("name").lean();
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/360-pilotage/produits" className="text-sm text-brand hover:underline">← Produits</Link>
        <h1 className="text-2xl font-bold">Nouveau produit</h1>
      </div>
      <ProductForm categories={serialize(categories)} />
    </div>
  );
}
