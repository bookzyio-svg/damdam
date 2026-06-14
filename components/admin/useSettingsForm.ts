"use client";

import { useState } from "react";
import { saveSettingsSection } from "@/lib/admin/api";

type Status = { type: "idle" | "ok" | "error"; message?: string };

/**
 * Hook commun aux formulaires de réglages : gère l'état de sauvegarde et le
 * message de statut. `submit(data)` envoie la section au serveur.
 */
export function useSettingsForm(section: string) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function submit(data: unknown) {
    setSaving(true);
    setStatus({ type: "idle" });
    const res = await saveSettingsSection(section, data);
    setSaving(false);
    setStatus(
      res.ok
        ? { type: "ok", message: "Réglages enregistrés" }
        : { type: "error", message: res.error },
    );
  }

  return { saving, status, submit };
}
