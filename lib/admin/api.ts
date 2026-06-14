/**
 * Helper client pour sauvegarder une section de réglages.
 * Renvoie { ok:true } ou { ok:false, error } (message lisible).
 */
export async function saveSettingsSection(
  section: string,
  data: unknown,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error || `Erreur ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Connexion impossible au serveur." };
  }
}
