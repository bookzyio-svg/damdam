import crypto from "crypto";
import { eurosToCents } from "@/lib/utils/money";
import type { NormalizedProduct } from "@/lib/import/createDraft";

/**
 * Import AliExpress via l'API officielle dropshipping (§10).
 * Nécessite ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET. Sans clés, lève une
 * erreur explicite (fonctionnalité désactivée).
 *
 * Signature TOP/IOP : HMAC-SHA256(appSecret, concat(triées) clé+valeur), hex maj.
 */

const GATEWAY = "https://api-sg.aliexpress.com/sync";

export function isAliExpressConfigured(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
}

/** Extrait l'ID produit depuis un lien ou un ID brut. */
export function extractAliExpressId(input: string): string | null {
  const m = input.match(/(\d{8,})/);
  return m ? m[1] : null;
}

function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const base = sorted.map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", secret).update(base, "utf8").digest("hex").toUpperCase();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAliProduct(p: any): NormalizedProduct {
  const base = p?.ae_item_base_info_dto ?? p?.base_info ?? {};
  const media = p?.ae_multimedia_info_dto ?? {};
  const images = String(media.image_urls ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  const title = base.subject || p?.subject || "Produit AliExpress";
  const priceStr = base.target_sale_price || base.sale_price || p?.target_sale_price || "0";

  return {
    title,
    description: String(p?.ae_item_description ?? base.detail ?? ""),
    price: eurosToCents(String(priceStr)),
    images,
    brand: base.brand_name || undefined,
  };
}

export async function importFromAliExpress(input: string, shipToCountry = "FR"): Promise<NormalizedProduct> {
  if (!isAliExpressConfigured()) {
    throw new Error("ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET manquants : import AliExpress désactivé.");
  }
  const productId = extractAliExpressId(input);
  if (!productId) throw new Error("ID produit AliExpress introuvable dans le lien fourni.");

  const params: Record<string, string> = {
    app_key: process.env.ALIEXPRESS_APP_KEY!,
    method: "aliexpress.ds.product.get",
    timestamp: String(Date.now()),
    sign_method: "sha256",
    format: "json",
    v: "2.0",
    product_id: productId,
    target_currency: "EUR",
    target_language: "fr",
    ship_to_country: shipToCountry,
  };
  params.sign = sign(params, process.env.ALIEXPRESS_APP_SECRET!);

  const res = await fetch(`${GATEWAY}?${new URLSearchParams(params).toString()}`, {
    method: "POST",
    headers: { "User-Agent": "BoutiqueImporter/1.0" },
  });
  if (!res.ok) throw new Error(`AliExpress API : HTTP ${res.status}`);
  const json = await res.json();

  const result =
    json?.aliexpress_ds_product_get_response?.result ??
    json?.result ??
    json?.resp_result?.result;
  if (!result) {
    throw new Error("Réponse AliExpress inattendue (vérifiez les clés et les autorisations).");
  }
  return mapAliProduct(result);
}
