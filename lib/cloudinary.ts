import { v2 as cloudinary } from "cloudinary";

/**
 * Configuration Cloudinary (serveur uniquement — jamais exposée au client).
 * Les images importées ou uploadées sont re-hébergées ici (§10).
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = "boutique";

export type UploadedImage = { url: string; publicId: string };

/** Cloudinary est-il configuré ? (sinon on conserve les URLs d'origine). */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/** Upload un buffer/data-URI vers Cloudinary, renvoie { url, publicId }. */
export async function uploadImage(
  dataUri: string,
  folder = FOLDER,
): Promise<UploadedImage> {
  const res = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
  return { url: res.secure_url, publicId: res.public_id };
}

/** Upload une vidéo (data-URI) vers Cloudinary, renvoie { url, publicId }. */
export async function uploadVideo(
  dataUri: string,
  folder = FOLDER,
): Promise<UploadedImage> {
  const res = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "video",
  });
  return { url: res.secure_url, publicId: res.public_id };
}

/**
 * Upload depuis une URL distante (réutilisé par le module d'import en §10 pour
 * re-héberger les images des produits importés).
 */
export async function uploadFromUrl(
  url: string,
  folder = FOLDER,
): Promise<UploadedImage> {
  const res = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: "image",
  });
  return { url: res.secure_url, publicId: res.public_id };
}

/** Supprime une image par son publicId (best effort). */
export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
}

export { cloudinary };
