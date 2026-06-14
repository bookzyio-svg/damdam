import { redirect } from "next/navigation";

/** /admin/reglages → première sous-page (Boutique). */
export default function ReglagesIndexPage() {
  redirect("/admin/reglages/boutique");
}
