import ImportPanel from "@/components/admin/ImportPanel";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Import de produits</h1>
      <p className="mb-6 text-sm text-muted">
        Tout arrive en <b>brouillon</b>, les images sont re-hébergées sur Cloudinary, et vous
        pouvez réécrire les descriptions avec l&apos;IA avant publication.
      </p>
      <ImportPanel />
    </div>
  );
}
