import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { serialize } from "@/lib/serialize";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();
  const [product, categories] = await Promise.all([
    Product.findById(params.id).lean(),
    Category.find().sort({ order: 1, name: 1 }).select("name").lean(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/produits" className="text-sm text-brand hover:underline">← Produits</Link>
        <h1 className="text-2xl font-bold">Éditer le produit</h1>
      </div>
      <ProductForm initial={serialize(product)} categories={serialize(categories)} />
    </div>
  );
}
