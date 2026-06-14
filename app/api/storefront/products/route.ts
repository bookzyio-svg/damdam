import { getShowcaseProducts } from "@/lib/storefront/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/storefront/products — produits vitrine publics (champs sûrs
 * uniquement, sans coût/marge). Utilisé par la page 404 côté client.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit")) || 8));
  try {
    const products = await getShowcaseProducts(limit);
    return Response.json({ products });
  } catch {
    return Response.json({ products: [] });
  }
}
