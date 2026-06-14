/**
 * Génération de slugs URL-safe (accents français retirés).
 */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFD") // décompose les accents
    .replace(/[̀-ͯ]/g, "") // retire les diacritiques combinants
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // tout caractère non alphanum → tiret
    .replace(/^-+|-+$/g, "") // tirets en début/fin
    .replace(/-{2,}/g, "-"); // tirets multiples
}

/**
 * Génère un slug unique en testant l'existence via un callback.
 * `exists(slug)` doit renvoyer true si le slug est déjà pris.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "produit";
  let slug = root;
  let i = 2;
  while (await exists(slug)) {
    slug = `${root}-${i}`;
    i += 1;
  }
  return slug;
}
