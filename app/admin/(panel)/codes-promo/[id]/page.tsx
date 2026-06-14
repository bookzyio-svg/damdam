import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { PromoCode } from "@/lib/models/PromoCode";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { serialize } from "@/lib/serialize";
import PromoForm from "@/components/admin/PromoForm";

export const dynamic = "force-dynamic";

export default async function EditPromoPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();
  const promo = await PromoCode.findById(params.id).lean();
  if (!promo) notFound();

  const [categories, productDocs] = await Promise.all([
    Category.find().sort({ name: 1 }).select("name").lean(),
    promo.productIds?.length
      ? Product.find({ _id: { $in: promo.productIds } }).select("title").lean()
      : Promise.resolve([]),
  ]);

  const initialProducts = (productDocs as { _id: unknown; title: string }[]).map((p) => ({
    id: String(p._id),
    title: p.title,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/codes-promo" className="text-sm text-brand hover:underline">← Codes promo</Link>
        <h1 className="text-2xl font-bold">Éditer le code promo</h1>
      </div>
      <PromoForm
        initial={serialize(promo)}
        categories={serialize(categories)}
        initialProducts={initialProducts}
      />
    </div>
  );
}
