import Link from "next/link";
import { connectDB } from "@/lib/db";
import { PromoCode } from "@/lib/models/PromoCode";
import { serialize } from "@/lib/serialize";
import PromoList from "@/components/admin/PromoList";

export const dynamic = "force-dynamic";

export default async function AdminPromoPage() {
  await connectDB();
  const codes = await PromoCode.find().sort({ createdAt: -1 }).lean();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Codes promo</h1>
        <Link href="/360-pilotage/codes-promo/nouveau" className="btn-brand">+ Nouveau code</Link>
      </div>
      <PromoList initial={serialize(codes)} />
    </div>
  );
}
