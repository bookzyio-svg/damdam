import * as XLSX from "xlsx";
import type { NormalizedProduct } from "@/lib/import/createDraft";

/**
 * Parse un prix au format quelconque en CENTIMES.
 * Gère : "1 299,90 €", "1.299,90", "129,99", "129.99", "1,299.99", "EUR 49".
 */
export function parsePriceToCents(raw: string | number | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return Math.round(raw * 100);
  let s = String(raw).trim().replace(/[^\d.,-]/g, ""); // ne garde que chiffres . , -
  if (!s) return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let decimalSep = "";
  if (lastComma !== -1 && lastDot !== -1) decimalSep = lastComma > lastDot ? "," : ".";
  else if (lastComma !== -1) decimalSep = ",";
  else if (lastDot !== -1) decimalSep = ".";

  if (decimalSep) {
    const thousandSep = decimalSep === "," ? "." : ",";
    s = s.split(thousandSep).join("").replace(decimalSep, ".");
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

/** Mapping optionnel : nom de notre champ → nom de colonne du fichier. */
export type ColumnMapping = Partial<
  Record<"title" | "description" | "price" | "compareAtPrice" | "images" | "sku" | "stock" | "brand", string>
>;

type Row = Record<string, string>;

/** Détecte le séparateur d'un CSV (virgule, point-virgule ou tabulation). */
function detectDelimiter(text: string): string {
  const firstLine = (text.split(/\r?\n/).find((l) => l.trim()) || "").replace(/"[^"]*"/g, "");
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** Lit un fichier CSV ou Excel (buffer) → lignes + en-têtes. */
export function parseSpreadsheet(buffer: Buffer): { headers: string[]; rows: Row[] } {
  // Les .xlsx sont des archives ZIP (signature "PK"). Sinon, on traite en CSV/texte
  // avec détection automatique du séparateur (virgule, point-virgule, tabulation).
  const isZip = buffer.length > 1 && buffer[0] === 0x50 && buffer[1] === 0x4b;

  let wb;
  if (isZip) {
    wb = XLSX.read(buffer, { type: "buffer" });
  } else {
    const text = buffer.toString("utf8").replace(/^﻿/, ""); // retire le BOM
    const FS = detectDelimiter(text);
    wb = XLSX.read(text, { type: "string", FS, raw: false });
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "", raw: false });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export type SpreadsheetFormat = "shopify" | "woocommerce" | "generic";

/** Détecte l'origine de l'export à partir des en-têtes. */
export function detectFormat(headers: string[]): SpreadsheetFormat {
  const h = headers.map((x) => x.toLowerCase());
  if (h.includes("handle") && h.some((x) => x.includes("variant price"))) return "shopify";
  if (h.includes("name") && h.some((x) => x.includes("regular price"))) return "woocommerce";
  return "generic";
}

const SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  title: ["title", "titre", "name", "nom", "product name", "produit"],
  description: ["body (html)", "description", "desc", "body"],
  price: ["variant price", "regular price", "price", "prix", "sale price"],
  compareAtPrice: ["variant compare at price", "compare at price", "msrp", "prix barré", "compare price"],
  images: ["image src", "images", "image", "image url", "photo", "picture"],
  sku: ["variant sku", "sku", "reference", "référence", "ref"],
  stock: ["variant inventory qty", "stock", "quantity", "inventory", "qté", "quantité", "qty"],
  brand: ["vendor", "brand", "marque", "marques", "brands"],
};

/** Récupère la valeur d'un champ via le mapping explicite ou les synonymes. */
function getField(row: Row, field: keyof ColumnMapping, mapping?: ColumnMapping): string {
  if (mapping?.[field] && row[mapping[field]!] != null) return String(row[mapping[field]!]).trim();
  const keys = Object.keys(row);
  for (const syn of SYNONYMS[field]) {
    const key = keys.find((k) => k.toLowerCase() === syn) || keys.find((k) => k.toLowerCase().includes(syn));
    if (key && row[key]) return String(row[key]).trim();
  }
  return "";
}

function splitImages(value: string): string[] {
  return value
    .split(/[,\n;|]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

/** Convertit une ligne « plate » en produit normalisé. */
function rowToProduct(row: Row, mapping?: ColumnMapping): NormalizedProduct | null {
  const title = getField(row, "title", mapping);
  const priceStr = getField(row, "price", mapping);
  if (!title || !priceStr) return null;

  const compareStr = getField(row, "compareAtPrice", mapping);
  const stockStr = getField(row, "stock", mapping);

  return {
    title,
    description: getField(row, "description", mapping),
    price: parsePriceToCents(priceStr),
    compareAtPrice: compareStr ? parsePriceToCents(compareStr) : null,
    images: splitImages(getField(row, "images", mapping)),
    sku: getField(row, "sku", mapping) || undefined,
    brand: getField(row, "brand", mapping) || undefined,
    stock: stockStr ? parseInt(stockStr, 10) || 0 : undefined,
  };
}

/** Regroupe les lignes Shopify par Handle (1 produit, N variantes/images). */
function shopifyToProducts(rows: Row[]): NormalizedProduct[] {
  const byHandle = new Map<string, Row[]>();
  for (const row of rows) {
    const handle = (row["Handle"] || row["handle"] || "").trim();
    if (!handle) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, []);
    byHandle.get(handle)!.push(row);
  }

  const products: NormalizedProduct[] = [];
  for (const group of byHandle.values()) {
    const base = group.find((r) => (r["Title"] || r["title"] || "").trim()) ?? group[0];
    const title = (base["Title"] || base["title"] || "").trim();
    if (!title) continue;

    const images = group
      .map((r) => (r["Image Src"] || r["image src"] || "").trim())
      .filter((u) => /^https?:\/\//i.test(u));

    const variants = group
      .map((r) => ({
        title: (r["Option1 Value"] || r["option1 value"] || "").trim(),
        price: parsePriceToCents(r["Variant Price"] || r["variant price"] || "0"),
        stock: parseInt(r["Variant Inventory Qty"] || r["variant inventory qty"] || "0", 10) || 0,
      }))
      .filter((v) => v.title);

    const firstPrice = parsePriceToCents(base["Variant Price"] || base["variant price"] || "0");

    products.push({
      title,
      description: (base["Body (HTML)"] || base["body (html)"] || "").trim(),
      price: firstPrice,
      images: Array.from(new Set(images)),
      brand: (base["Vendor"] || base["vendor"] || "").trim() || undefined,
      sku: (base["Variant SKU"] || base["variant sku"] || "").trim() || undefined,
      stock: parseInt(base["Variant Inventory Qty"] || base["variant inventory qty"] || "0", 10) || undefined,
      variants: variants.length > 1 ? variants : undefined,
    });
  }
  return products;
}

/** Convertit un fichier (rows) en produits normalisés selon le format détecté. */
export function rowsToProducts(rows: Row[], format: SpreadsheetFormat, mapping?: ColumnMapping): NormalizedProduct[] {
  if (format === "shopify") return shopifyToProducts(rows);
  return rows.map((r) => rowToProduct(r, mapping)).filter((p): p is NormalizedProduct => p !== null);
}
