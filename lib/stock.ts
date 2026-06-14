import { Product } from "@/lib/models/Product";

type OrderItemLike = {
  productId?: unknown;
  variantTitle?: string | null;
  quantity?: number | null;
};

/**
 * Relâche le stock réservé d'une commande (réincrémente le stock des produits
 * à stock suivi). Utilisé à l'annulation / au remboursement et par le cron
 * des commandes impayées.
 */
export async function releaseOrderStock(items: OrderItemLike[] | undefined) {
  for (const item of items ?? []) {
    if (!item.productId || !item.quantity) continue;
    const product = await Product.findById(item.productId).select("trackStock");
    if (!product?.trackStock) continue;
    if (item.variantTitle) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { "variants.$[v].stock": item.quantity } },
        { arrayFilters: [{ "v.title": item.variantTitle }] },
      ).catch(() => {});
    } else {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      ).catch(() => {});
    }
  }
}
