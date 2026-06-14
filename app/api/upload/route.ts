import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const MAX_IMAGE = 8 * 1024 * 1024; // 8 Mo / image
const MAX_VIDEO = 64 * 1024 * 1024; // 64 Mo / vidéo
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];

/**
 * POST /api/upload — upload d'images ou vidéos vers Cloudinary (admin).
 * Body : multipart/form-data, champ `files` (un ou plusieurs).
 * Les vidéos sont détectées via leur type MIME et envoyées en resource_type vidéo.
 * Renvoie : { images: [{ url, publicId }] }
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Requête multipart invalide" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "Aucun fichier" }, { status: 400 });
  }

  try {
    const images = await Promise.all(
      files.map(async (file) => {
        const isVideo = ALLOWED_VIDEO.includes(file.type);
        const isImage = ALLOWED_IMAGE.includes(file.type);
        if (!isVideo && !isImage) {
          throw new Error(`Type non supporté : ${file.type}`);
        }
        const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
        if (file.size > max) {
          throw new Error(`Fichier trop volumineux (max ${Math.round(max / 1024 / 1024)} Mo) : ${file.name}`);
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
        return isVideo ? uploadVideo(dataUri) : uploadImage(dataUri);
      }),
    );
    return Response.json({ images });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de l'upload";
    return Response.json({ error: message }, { status: 400 });
  }
}
