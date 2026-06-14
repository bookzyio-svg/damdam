import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { parseSpreadsheet, detectFormat, rowsToProducts, type ColumnMapping } from "@/lib/import/csv";
import { createDrafts } from "@/lib/import/createDraft";

export const dynamic = "force-dynamic";

/**
 * POST /api/import/csv — import CSV/Excel (admin). multipart/form-data :
 *   file    : le fichier (.csv / .xlsx)
 *   mapping : (optionnel) JSON de correspondance des colonnes
 * Reconnaît automatiquement les exports Shopify / WooCommerce.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Requête multipart invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Aucun fichier" }, { status: 400 });
  }

  let mapping: ColumnMapping | undefined;
  const mappingRaw = form.get("mapping");
  if (typeof mappingRaw === "string" && mappingRaw.trim()) {
    try {
      mapping = JSON.parse(mappingRaw);
    } catch {
      return Response.json({ error: "Mapping JSON invalide" }, { status: 400 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { headers, rows } = parseSpreadsheet(buffer);
  if (rows.length === 0) {
    return Response.json({ error: "Fichier vide ou illisible" }, { status: 422 });
  }

  const format = detectFormat(headers);
  const products = rowsToProducts(rows, format, mapping);
  if (products.length === 0) {
    return Response.json(
      { error: "Aucun produit valide détecté. Vérifiez le mapping des colonnes (titre + prix requis).", headers, format },
      { status: 422 },
    );
  }

  const result = await createDrafts(products, { type: "csv", ref: file.name });
  return Response.json({ ok: true, format, headers, ...result });
}
