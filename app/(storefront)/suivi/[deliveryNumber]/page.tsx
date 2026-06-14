import type { Metadata } from "next";
import TrackingView from "@/components/storefront/TrackingView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Suivi de livraison" };

export default function TrackingPage({
  params,
}: {
  params: { deliveryNumber: string };
}) {
  return (
    <div className="bg-surface">
      <div className="container-site max-w-4xl py-6 md:py-8">
        <TrackingView deliveryNumber={params.deliveryNumber} />
      </div>
    </div>
  );
}
