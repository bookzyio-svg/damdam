import { redirect } from "next/navigation";

/** /360-pilotage/reglages → première sous-page (Boutique). */
export default function ReglagesIndexPage() {
  redirect("/360-pilotage/reglages/boutique");
}
