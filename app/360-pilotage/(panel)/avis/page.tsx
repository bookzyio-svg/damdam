import ReviewsModeration from "@/components/admin/ReviewsModeration";
import ReviewAdminTools from "@/components/admin/ReviewAdminTools";

export const dynamic = "force-dynamic";

export default function AdminReviewsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Avis clients</h1>
      <ReviewAdminTools />
      <ReviewsModeration />
    </div>
  );
}
