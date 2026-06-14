/**
 * Sérialise un document/objet Mongoose (ou lean) en JSON simple :
 * ObjectId → string, Date → string. Utilisable pour passer des données
 * d'un Server Component à un Client Component.
 *
 * Le type de retour est paramétrable (défaut `any`) car la structure JSON
 * diffère du type Mongoose source (ObjectId → string, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T = any>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
