import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";
import { checkRate, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];

/**
 * POST /api/orders/proof — le client joint sa preuve de virement (capture).
 * Public, identifié par le numéro de commande. multipart : orderNumber + file.
 */
export async function POST(req: Request) {
  const rl = checkRate(req, "proof", 6, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  if (!isCloudinaryConfigured()) {
    return Response.json({ error: "Service d'upload indisponible. Envoyez votre preuve par email au SAV." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }

  const orderNumber = String(form.get("orderNumber") ?? "").trim();
  const file = form.get("file");
  if (!orderNumber || !(file instanceof File)) {
    return Response.json({ error: "Fichier ou commande manquant" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return Response.json({ error: "Format non supporté (image ou PDF)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Fichier trop volumineux (max 8 Mo)." }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findOne({ orderNumber }).select("status");
  if (!order) return Response.json({ error: "Commande introuvable" }, { status: 404 });
  if (order.status !== "pending_payment") {
    return Response.json({ error: "Cette commande n'attend plus de paiement." }, { status: 409 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const uploaded = await uploadImage(dataUri, "boutique/proofs");
    await Order.updateOne(
      { orderNumber },
      { $push: { paymentProofs: { url: uploaded.url, publicId: uploaded.publicId, at: new Date() } } },
    );
    return Response.json({ ok: true, url: uploaded.url });
  } catch {
    return Response.json({ error: "Échec de l'envoi. Réessayez." }, { status: 500 });
  }
}
