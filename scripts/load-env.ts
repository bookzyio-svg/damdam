/**
 * Charge .env.local pour les scripts CLI (tsx ne le fait pas automatiquement).
 * Node ≥ 20.12 expose process.loadEnvFile.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local absent : on suppose que les variables sont déjà dans l'env
}
