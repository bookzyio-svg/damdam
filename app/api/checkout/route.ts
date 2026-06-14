import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Order } from "@/lib/models/Order";
import { Customer } from "@/lib/models/Customer";
import { PromoCode } from "@/lib/models/PromoCode";
import { Cart } from "@/lib/models/Cart";
import { nextSequence } from "@/lib/models/Counter";
import { getSettings } from "@/lib/settings";
import { computeOrder } from "@/lib/checkout/compute";
import { formatOrderNumber, paymentReference } from "@/lib/utils/refs";
import { sendEmail } from "@/lib/email/send";
import { checkRate, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantTitle: z.string().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(4),
  }),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional().default(""),
    city: z.string().min(1),
    postalCode: z.string().min(2),
    country: z.string().optional().default("France"),
    phone: z.string().optional().default(""),
  }),
  promoCode: z.string().optional(),
  cartToken: z.string().optional(),
  customerNotes: z.string().max(1000).optional().default(""),
  acceptsMarketing: z.boolean().optional().default(false),
});

/**
 * POST /api/checkout — crée une commande en `pending_payment` (paiement virement).
 * Recalcule TOUS les montants côté serveur, réserve le stock, génère le numéro de
 * commande + la référence de virement, envoie l'email d'instructions, met à jour
 * le client et le compteur d'usage du code promo, marque le panier comme converti.
 */
export async function POST(req: Request) {
  const rl = checkRate(req, "checkout", 10, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const email = data.customer.email.toLowerCase();

  await connectDB();

  // 1) Recalcul serveur (prix, port, remise) + contrôle de stock
  const computed = await computeOrder({
    items: data.items,
    postalCode: data.shippingAddress.postalCode,
    country: data.shippingAddress.country,
    promoCode: data.promoCode,
    email,
  });
  if (!computed.ok) {
    return Response.json({ error: "Commande invalide", errors: computed.errors }, { status: 422 });
  }

  // 2) Réservation atomique du stock (avec rollback en cas d'échec concurrent)
  const products = await Product.find({ _id: { $in: computed.lines.map((l) => l.productId) } }).select("trackStock");
  const trackById = new Map(products.map((p) => [String(p._id), p.trackStock]));
  const reserved: { productId: string; variantTitle?: string; qty: number }[] = [];

  for (const line of computed.lines) {
    if (!trackById.get(line.productId)) continue; // stock non suivi
    let res;
    if (line.variantTitle) {
      res = await Product.updateOne(
        { _id: line.productId },
        { $inc: { "variants.$[v].stock": -line.quantity } },
        { arrayFilters: [{ "v.title": line.variantTitle, "v.stock": { $gte: line.quantity } }] },
      );
    } else {
      res = await Product.updateOne(
        { _id: line.productId, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
      );
    }
    if (res.modifiedCount !== 1) {
      // Rollback de ce qui a déjà été réservé
      await rollback(reserved);
      return Response.json(
        { error: "Stock insuffisant", errors: [`« ${line.title} » n'est plus disponible en quantité suffisante.`] },
        { status: 409 },
      );
    }
    reserved.push({ productId: line.productId, variantTitle: line.variantTitle, qty: line.quantity });
  }

  try {
    // 3) Numéro de commande séquentiel + référence de virement unique
    const year = new Date().getFullYear();
    const seq = await nextSequence(`order-${year}`);
    const orderNumber = formatOrderNumber(year, seq);

    let reference = paymentReference();
    for (let i = 0; i < 5 && (await Order.exists({ paymentReference: reference })); i += 1) {
      reference = paymentReference();
    }

    // 4) Client (upsert ; les totaux dépensés seront incrémentés à la confirmation du paiement)
    const customerDoc = await Customer.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name: data.customer.name,
          phone: data.customer.phone,
          acceptsMarketing: data.acceptsMarketing,
        },
        $addToSet: {
          addresses: {
            line1: data.shippingAddress.line1,
            line2: data.shippingAddress.line2,
            city: data.shippingAddress.city,
            postalCode: data.shippingAddress.postalCode,
            country: data.shippingAddress.country,
            isDefault: true,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // 5) Création de la commande
    const now = new Date();
    const order = await Order.create({
      orderNumber,
      paymentReference: reference,
      customer: { name: data.customer.name, email, phone: data.customer.phone },
      customerId: customerDoc?._id,
      items: computed.lines.map((l) => ({
        productId: l.productId,
        title: l.title,
        variantTitle: l.variantTitle,
        sku: l.sku,
        price: l.price,
        quantity: l.quantity,
        image: l.image,
      })),
      subtotal: computed.subtotal,
      discountTotal: computed.discountTotal,
      shippingTotal: computed.shippingTotal,
      total: computed.total,
      promoCode: computed.promo
        ? { code: computed.promo.code, type: computed.promo.type, value: computed.promo.value }
        : undefined,
      shippingAddress: data.shippingAddress,
      paymentMethod: "bank_transfer",
      status: "pending_payment",
      statusHistory: [{ status: "pending_payment", note: "Commande créée", at: now }],
      customerNotes: data.customerNotes,
    });

    // 6) Compteur d'usage du code promo
    if (computed.promo) {
      await PromoCode.updateOne({ code: computed.promo.code }, { $inc: { usedCount: 1 } });
    }

    // 7) Panier converti (relance §12)
    if (data.cartToken) {
      await Cart.updateOne(
        { token: data.cartToken },
        { $set: { recovered: true, orderId: order._id } },
      );
    }

    // 8) Email « commande reçue — instructions de virement »
    const settings = await getSettings();
    const sent = await sendEmail({
      to: email,
      template: "order-received",
      data: { order: order.toObject(), settings: settings.toObject() },
    });
    if (sent.ok) {
      await Order.updateOne(
        { _id: order._id },
        { $push: { emailsSent: { type: "order-received", at: new Date() } } },
      );
    }

    // 9) Notification au gérant (nouvelle commande à vérifier)
    const adminEmail = settings.store?.email;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        template: "admin-new-order",
        data: { order: order.toObject(), settings: settings.toObject() },
      }).catch(() => {});
    }

    return Response.json({ ok: true, orderNumber, paymentReference: reference }, { status: 201 });
  } catch (err) {
    // En cas d'erreur après réservation, on relâche le stock
    await rollback(reserved);
    console.error("[checkout] erreur:", err);
    return Response.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
  }
}

/** Relâche le stock réservé (rollback). */
async function rollback(
  reserved: { productId: string; variantTitle?: string; qty: number }[],
) {
  for (const r of reserved) {
    if (r.variantTitle) {
      await Product.updateOne(
        { _id: r.productId },
        { $inc: { "variants.$[v].stock": r.qty } },
        { arrayFilters: [{ "v.title": r.variantTitle }] },
      ).catch(() => {});
    } else {
      await Product.updateOne({ _id: r.productId }, { $inc: { stock: r.qty } }).catch(() => {});
    }
  }
}
