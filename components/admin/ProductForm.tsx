"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Loader2, ImagePlus } from "lucide-react";
import { Card, Field, TextInput, TextArea, Toggle, SaveBar } from "@/components/admin/ui";
import ImageUploader, { type ProductImage } from "@/components/admin/ImageUploader";
import DescriptionBuilder, { type ContentBlock } from "@/components/admin/DescriptionBuilder";
import { eurosToCents, centsToEurosInput } from "@/lib/utils/money";

type Category = { _id: string; name: string };
type Spec = { label: string; value: string };
type OptionInput = { name: string; values: string };
type VariantInput = { title: string; sku: string; price: string; stock: string; image: string };

export type ProductInitial = {
  _id?: string;
  title?: string;
  slug?: string;
  brand?: string;
  shortDescription?: string;
  description?: string;
  contentBlocks?: ContentBlock[];
  price?: number;
  compareAtPrice?: number | null;
  cost?: number | null;
  sku?: string;
  barcode?: string;
  trackStock?: boolean;
  stock?: number;
  condition?: "neuf" | "reconditionne";
  category?: { _id: string } | string | null;
  status?: "active" | "draft" | "archived";
  featured?: boolean;
  tags?: string[];
  specs?: Spec[];
  images?: ProductImage[];
  hasVariants?: boolean;
  options?: { name: string; values: string[] }[];
  variants?: { title: string; sku?: string; price?: number; stock?: number; image?: string }[];
  flashDeal?: { active?: boolean; endsAt?: string | null };
  seo?: { title?: string; description?: string };
};

const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // yyyy-MM-ddThh:mm dans le fuseau local
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

export default function ProductForm({
  initial = {},
  categories,
}: {
  initial?: ProductInitial;
  categories: Category[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial._id);

  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(initial.contentBlocks ?? []);

  const [price, setPrice] = useState(centsToEurosInput(initial.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial.compareAtPrice ? centsToEurosInput(initial.compareAtPrice) : "",
  );
  const [cost, setCost] = useState(initial.cost ? centsToEurosInput(initial.cost) : "");
  const [sku, setSku] = useState(initial.sku ?? "");
  const [barcode, setBarcode] = useState(initial.barcode ?? "");

  const [trackStock, setTrackStock] = useState(initial.trackStock ?? true);
  const [stock, setStock] = useState(String(initial.stock ?? 0));
  const [condition, setCondition] = useState(initial.condition ?? "neuf");

  const initCat =
    typeof initial.category === "string"
      ? initial.category
      : initial.category?._id ?? "";
  const [category, setCategory] = useState(initCat);
  const [status, setStatus] = useState(initial.status ?? "draft");
  const [featured, setFeatured] = useState(initial.featured ?? false);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));

  const [specs, setSpecs] = useState<Spec[]>(initial.specs ?? []);
  const [images, setImages] = useState<ProductImage[]>(initial.images ?? []);

  // Upload de la photo d'une variante (réutilise /api/upload → Cloudinary)
  const variantFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [variantUploading, setVariantUploading] = useState<number | null>(null);
  async function uploadVariantImage(i: number, file: File) {
    setVariantUploading(i);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.images?.[0]?.url) {
        const url = body.images[0].url as string;
        setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, image: url } : x)));
      }
    } finally {
      setVariantUploading(null);
    }
  }

  const [hasVariants, setHasVariants] = useState(initial.hasVariants ?? false);
  const [options, setOptions] = useState<OptionInput[]>(
    (initial.options ?? []).map((o) => ({ name: o.name, values: o.values.join(", ") })),
  );
  const [variants, setVariants] = useState<VariantInput[]>(
    (initial.variants ?? []).map((v) => ({
      title: v.title,
      sku: v.sku ?? "",
      price: v.price ? centsToEurosInput(v.price) : "",
      stock: String(v.stock ?? 0),
      image: v.image ?? "",
    })),
  );

  const [flashActive, setFlashActive] = useState(initial.flashDeal?.active ?? false);
  const [flashEndsAt, setFlashEndsAt] = useState(toDatetimeLocal(initial.flashDeal?.endsAt));

  const [seoTitle, setSeoTitle] = useState(initial.seo?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial.seo?.description ?? "");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "idle" | "ok" | "error"; message?: string }>({
    type: "idle",
  });

  // Amélioration IA ciblée — un champ à la fois (titre, description, SEO)
  const [improvingField, setImprovingField] = useState<"title" | "description" | "seo" | null>(null);
  const [aiMsg, setAiMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function improve(target: "title" | "description" | "seo") {
    if (!title.trim()) { setAiMsg({ type: "error", text: "Renseignez d'abord un titre." }); return; }
    setImprovingField(target);
    setAiMsg(null);
    try {
      const res = await fetch("/api/products/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, brand, description, target }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setAiMsg({ type: "error", text: body.error || "Échec de l'amélioration" }); return; }
      if (target === "title" && body.title) setTitle(body.title);
      if (target === "description") {
        if (body.shortDescription) setShortDescription(body.shortDescription);
        if (body.description) setDescription(body.description);
      }
      if (target === "seo") {
        if (body.seoTitle) setSeoTitle(body.seoTitle);
        if (body.seoDescription) setSeoDescription(body.seoDescription);
      }
    } catch {
      setAiMsg({ type: "error", text: "Échec de l'amélioration" });
    } finally {
      setImprovingField(null);
    }
  }

  // Petit bouton IA discret, à poser à droite du libellé d'un champ
  const AiBtn = ({ target }: { target: "title" | "description" | "seo" }) => (
    <button
      type="button"
      onClick={() => improve(target)}
      disabled={improvingField !== null}
      title="Améliorer avec l'IA"
      className="inline-flex items-center gap-1 rounded-md border border-brand/30 px-2 py-0.5 text-xs font-medium text-brand transition hover:bg-brand/5 disabled:opacity-50"
    >
      {improvingField === target ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
      IA
    </button>
  );

  // Libellé + bouton IA aligné à droite (remplace le <Field> par défaut)
  const labelRow = (text: string, htmlFor: string, target: "title" | "description" | "seo") => (
    <div className="mb-1.5 flex items-center justify-between">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">{text}</label>
      <AiBtn target={target} />
    </div>
  );

  function buildPayload() {
    return {
      title,
      slug: slug || undefined,
      brand,
      shortDescription,
      description,
      contentBlocks: contentBlocks
        .filter((b) => (b.type === "text" || b.type === "heading" ? (b.text ?? "").trim() : (b.url ?? "").trim()))
        .map((b) => ({
          type: b.type,
          text: b.text ?? "",
          url: b.url ?? "",
          publicId: b.publicId ?? "",
          alt: b.alt ?? "",
          provider: b.provider ?? "",
        })),
      price: eurosToCents(price),
      compareAtPrice: compareAtPrice ? eurosToCents(compareAtPrice) : null,
      cost: cost ? eurosToCents(cost) : null,
      sku,
      barcode,
      trackStock,
      stock: Number(stock) || 0,
      condition,
      category: category || null,
      status,
      featured,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      specs: specs.filter((s) => s.label.trim()),
      images,
      hasVariants,
      options: hasVariants
        ? options
            .filter((o) => o.name.trim())
            .map((o) => ({
              name: o.name.trim(),
              values: o.values.split(",").map((v) => v.trim()).filter(Boolean),
            }))
        : [],
      variants: hasVariants
        ? variants
            .filter((v) => v.title.trim())
            .map((v) => ({
              title: v.title.trim(),
              sku: v.sku.trim(),
              price: v.price ? eurosToCents(v.price) : undefined,
              stock: Number(v.stock) || 0,
              image: v.image || undefined,
            }))
        : [],
      flashDeal: {
        active: flashActive,
        endsAt: flashActive && flashEndsAt ? new Date(flashEndsAt).toISOString() : null,
      },
      seo: { title: seoTitle, description: seoDescription },
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: "idle" });

    const url = isEdit ? `/api/products/${initial._id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setStatusMsg({ type: "error", message: body?.error || "Erreur d'enregistrement" });
      return;
    }
    if (isEdit) {
      setStatusMsg({ type: "ok", message: "Produit enregistré" });
      router.refresh();
    } else {
      router.push("/admin/produits");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Colonne principale */}
      <div className="space-y-6 lg:col-span-2">
        <Card title="Informations">
          <div className="grid gap-4">
            <div>
              {labelRow("Titre", "title", "title")}
              <TextInput id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marque" htmlFor="brand">
                <TextInput id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </Field>
              <Field label="Slug (URL)" htmlFor="slug" hint={isEdit ? "" : "Auto-généré si vide."}>
                <TextInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
              </Field>
            </div>
            <div>
              {labelRow("Description", "description", "description")}
              <TextInput id="shortDescription" placeholder="Accroche courte" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="mb-2" />
              <TextArea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[140px]" />
            </div>
            {aiMsg ? <p className={`text-sm font-medium ${aiMsg.type === "ok" ? "text-stock" : "text-deal"}`}>{aiMsg.text}</p> : null}
          </div>
        </Card>

        <Card title="Images" description="La première image est l'image principale.">
          <ImageUploader images={images} onChange={setImages} />
        </Card>

        <Card title="Description détaillée" description="Mêlez texte, images et vidéos. Affiché sur la fiche produit, dans l'ordre.">
          <DescriptionBuilder blocks={contentBlocks} onChange={setContentBlocks} />
        </Card>

        <Card title="Caractéristiques" description="Tableau affiché sur la fiche produit.">
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <TextInput placeholder="Libellé (ex. Écran)" value={s.label} onChange={(e) => setSpecs((arr) => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                <TextInput placeholder='Valeur (ex. 55" OLED)' value={s.value} onChange={(e) => setSpecs((arr) => arr.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} />
                <button type="button" onClick={() => setSpecs((arr) => arr.filter((_, idx) => idx !== i))} className="shrink-0 text-sm text-deal hover:underline">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSpecs((arr) => [...arr, { label: "", value: "" }])} className="btn-outline mt-3 px-3 py-1.5 text-sm">
            + Ajouter une caractéristique
          </button>
        </Card>

        <Card title="Variantes">
          <Toggle checked={hasVariants} onChange={setHasVariants} label="Ce produit a des variantes (couleur, taille…)" />
          {hasVariants ? (
            <div className="mt-4 space-y-5">
              <div>
                <div className="mb-2 text-sm font-medium">Options</div>
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <TextInput placeholder="Nom (ex. Couleur)" value={o.name} onChange={(e) => setOptions((arr) => arr.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                      <TextInput placeholder="Valeurs (Noir, Blanc, Gris)" value={o.values} onChange={(e) => setOptions((arr) => arr.map((x, idx) => idx === i ? { ...x, values: e.target.value } : x))} />
                      <button type="button" onClick={() => setOptions((arr) => arr.filter((_, idx) => idx !== i))} className="shrink-0 text-sm text-deal hover:underline">✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setOptions((arr) => [...arr, { name: "", values: "" }])} className="btn-outline mt-2 px-3 py-1.5 text-sm">+ Option</button>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Déclinaisons (prix en € ; vide = prix de base)</div>
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {/* Photo de la variante (cliquer pour téléverser / remplacer) */}
                      <button
                        type="button"
                        onClick={() => variantFileRefs.current[i]?.click()}
                        title="Photo de la variante"
                        className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-md border border-line bg-surface"
                      >
                        {v.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-muted"><ImagePlus className="h-4 w-4" /></span>
                        )}
                        {variantUploading === i ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-4 w-4 animate-spin text-brand" /></span>
                        ) : null}
                      </button>
                      <input
                        ref={(el) => { variantFileRefs.current[i] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVariantImage(i, f); e.target.value = ""; }}
                      />
                      <div className="grid flex-1 grid-cols-12 gap-2">
                        <div className="col-span-5"><TextInput placeholder={'Titre (ex. Noir / 55")'} value={v.title} onChange={(e) => setVariants((arr) => arr.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} /></div>
                        <div className="col-span-3"><TextInput placeholder="SKU" value={v.sku} onChange={(e) => setVariants((arr) => arr.map((x, idx) => idx === i ? { ...x, sku: e.target.value } : x))} /></div>
                        <div className="col-span-2"><TextInput type="number" step="0.01" placeholder="Prix €" value={v.price} onChange={(e) => setVariants((arr) => arr.map((x, idx) => idx === i ? { ...x, price: e.target.value } : x))} /></div>
                        <div className="col-span-1"><TextInput type="number" placeholder="Stk" value={v.stock} onChange={(e) => setVariants((arr) => arr.map((x, idx) => idx === i ? { ...x, stock: e.target.value } : x))} /></div>
                        <div className="col-span-1 flex items-center"><button type="button" onClick={() => setVariants((arr) => arr.filter((_, idx) => idx !== i))} className="text-sm text-deal hover:underline">✕</button></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setVariants((arr) => [...arr, { title: "", sku: "", price: "", stock: "0", image: "" }])} className="btn-outline mt-2 px-3 py-1.5 text-sm">+ Déclinaison</button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card title="Référencement (SEO)">
          <div className="grid gap-4">
            <div>
              {labelRow("Titre SEO", "seoTitle", "seo")}
              <TextInput id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <Field label="Méta description" htmlFor="seoDescription">
              <TextArea id="seoDescription" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="min-h-[80px]" />
            </Field>
          </div>
        </Card>
      </div>

      {/* Colonne latérale */}
      <div className="space-y-6">
        <Card title="Publication">
          <div className="space-y-4">
            <Field label="Statut" htmlFor="status">
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as never)} className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm">
                <option value="draft">Brouillon</option>
                <option value="active">Actif (en ligne)</option>
                <option value="archived">Archivé</option>
              </select>
            </Field>
            <Toggle checked={featured} onChange={setFeatured} label="Mettre en avant (best-seller)" />
            <Field label="Catégorie" htmlFor="category">
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm">
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Séparés par des virgules.">
              <TextInput id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
          </div>
          <SaveBar saving={saving} status={statusMsg} />
        </Card>

        <Card title="Prix">
          <div className="grid gap-4">
            <Field label="Prix de vente (€)" htmlFor="price">
              <TextInput id="price" type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Field label="Prix barré (€)" htmlFor="compareAtPrice" hint="Pour afficher la remise.">
              <TextInput id="compareAtPrice" type="number" step="0.01" min="0" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
            </Field>
            <Field label="Coût d'achat (€)" htmlFor="cost" hint="Usage interne (marge).">
              <TextInput id="cost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Stock & état">
          <div className="space-y-4">
            <Toggle checked={trackStock} onChange={setTrackStock} label="Suivre le stock" />
            <Field label="Stock disponible" htmlFor="stock">
              <TextInput id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} disabled={!trackStock} />
            </Field>
            <Field label="État" htmlFor="condition">
              <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as never)} className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm">
                <option value="neuf">Neuf</option>
                <option value="reconditionne">Reconditionné</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="SKU" htmlFor="sku"><TextInput id="sku" value={sku} onChange={(e) => setSku(e.target.value)} /></Field>
              <Field label="Code-barres" htmlFor="barcode"><TextInput id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} /></Field>
            </div>
          </div>
        </Card>

        <Card title="Flash deal">
          <Toggle checked={flashActive} onChange={setFlashActive} label="Activer le compte à rebours" />
          {flashActive ? (
            <Field label="Fin de l'offre" htmlFor="flashEndsAt" className="mt-3">
              <TextInput id="flashEndsAt" type="datetime-local" value={flashEndsAt} onChange={(e) => setFlashEndsAt(e.target.value)} />
            </Field>
          ) : null}
        </Card>
      </div>
    </form>
  );
}
