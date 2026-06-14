import { eurosToCents } from "@/lib/utils/money";
import { extractProductFromHtml } from "@/lib/ai/extract";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { NormalizedProduct } from "@/lib/import/createDraft";

const UA = "Mozilla/5.0 (compatible; BoutiqueImporter/1.0)";

function stripHtml(s = ""): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.text();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ---------- Shopify ---------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapShopifyProduct(p: any): NormalizedProduct {
  const variants = (p.variants ?? []).map((v: any) => ({
    title: v.title && v.title !== "Default Title" ? v.title : p.title,
    price: eurosToCents(v.price ?? "0"),
    stock: typeof v.inventory_quantity === "number" ? v.inventory_quantity : undefined,
  }));
  const first = p.variants?.[0];
  return {
    title: p.title,
    description: stripHtml(p.body_html ?? ""),
    price: eurosToCents(first?.price ?? "0"),
    compareAtPrice: first?.compare_at_price ? eurosToCents(first.compare_at_price) : null,
    brand: p.vendor || undefined,
    sku: first?.sku || undefined,
    images: (p.images ?? []).map((i: any) => i.src).filter(Boolean),
    variants: variants.length > 1 ? variants : undefined,
  };
}

/* ---------- WooCommerce (Store API) ---------- */

function mapWooProduct(p: any): NormalizedProduct {
  // Store API : prices en unités mineures (centimes pour EUR)
  const price = parseInt(p.prices?.price ?? "0", 10) || 0;
  const regular = parseInt(p.prices?.regular_price ?? "0", 10) || 0;
  return {
    title: p.name,
    description: stripHtml(p.description || p.short_description || ""),
    price,
    compareAtPrice: regular > price ? regular : null,
    sku: p.sku || undefined,
    images: (p.images ?? []).map((i: any) => i.src).filter(Boolean),
  };
}

/* ---------- JSON-LD / Open Graph ---------- */

function parseJsonLd(html: string): NormalizedProduct | null {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of matches) {
    try {
      const json = JSON.parse(m[1].trim());
      const nodes = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      const product = nodes.find((n: any) => {
        const t = n["@type"];
        return t === "Product" || (Array.isArray(t) && t.includes("Product"));
      });
      if (!product) continue;
      const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      const price = offer?.price ?? offer?.lowPrice;
      if (!product.name || !price) continue;
      const images = Array.isArray(product.image) ? product.image : product.image ? [product.image] : [];
      return {
        title: product.name,
        description: stripHtml(product.description ?? ""),
        price: eurosToCents(String(price)),
        brand: typeof product.brand === "object" ? product.brand?.name : product.brand,
        images: images.filter(Boolean),
        sku: product.sku || undefined,
      };
    } catch {
      /* JSON-LD invalide : on continue */
    }
  }
  return null;
}

function parseOpenGraph(html: string): NormalizedProduct | null {
  const meta = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"));
    return m?.[1];
  };
  const title = meta("og:title");
  const amount = meta("product:price:amount") || meta("og:price:amount");
  if (!title || !amount) return null;
  const image = meta("og:image");
  return {
    title,
    description: stripHtml(meta("og:description") || ""),
    price: eurosToCents(amount),
    images: image ? [image] : [],
  };
}

/* ---------- Orchestration ---------- */

/**
 * Importe un ou plusieurs produits depuis une URL (§10) :
 *  1. Shopify (products.json / produit.json)
 *  2. WooCommerce (Store API)
 *  3. Données structurées (JSON-LD schema.org/Product, Open Graph)
 *  4. Secours : extraction via Gemini
 */
export async function importFromUrl(url: string, opts: { useAI?: boolean } = {}): Promise<NormalizedProduct[]> {
  const u = new URL(url);
  const origin = u.origin;

  // 1) Shopify — page produit unique
  if (/\/products\//.test(u.pathname)) {
    const jsonUrl = url.endsWith(".json") ? url : `${url.split("?")[0]}.json`;
    const single = await fetchJson<{ product?: any }>(jsonUrl);
    if (single?.product) return [mapShopifyProduct(single.product)];
  }

  // 1b) Shopify — catalogue complet
  const shopList = await fetchJson<{ products?: any[] }>(`${origin}/products.json?limit=50`);
  if (shopList?.products?.length) {
    return shopList.products.map(mapShopifyProduct);
  }

  // 2) WooCommerce — Store API publique
  const woo = await fetchJson<any[]>(`${origin}/wp-json/wc/store/products?per_page=50`);
  if (Array.isArray(woo) && woo.length) {
    return woo.map(mapWooProduct);
  }

  // 3) HTML : données structurées
  const html = await fetchText(url);
  const structured = parseJsonLd(html) || parseOpenGraph(html);
  if (structured) return [structured];

  // 4) Secours IA
  if (opts.useAI && isGeminiConfigured()) {
    return [await extractProductFromHtml(html, url)];
  }

  throw new Error(
    "Impossible d'extraire le produit (ni Shopify, ni WooCommerce, ni données structurées). Activez l'extraction IA.",
  );
}
