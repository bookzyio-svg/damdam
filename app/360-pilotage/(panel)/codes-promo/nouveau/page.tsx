import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { serialize } from "@/lib/serialize";
import PromoForm from "@/components/admin/PromoForm";

export const dynamic = "force-dynamic";

export default async function NewPromoPage() {
  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).select("name").lean();
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/360-pilotage/codes-promo" className="text-sm text-brand hover:underline">← Codes promo</Link>
        <h1 className="text-2xl font-bold">Nouveau code promo</h1>
      </div>
      <PromoForm categories={serialize(categories)} />
    </div>
  );
}
