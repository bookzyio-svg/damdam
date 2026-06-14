import { connectDB } from "@/lib/db";
import { Settings, type SettingsDoc } from "@/lib/models/Settings";

/**
 * Accès au document Settings (singleton). Crée le document s'il n'existe pas
 * encore, avec des valeurs par défaut minimales (le seed `seed:settings` pose
 * des valeurs plus complètes).
 */
export async function getSettings() {
  await connectDB();
  let settings = await Settings.findOne({ singleton: "main" });
  if (!settings) {
    settings = await Settings.create({
      singleton: "main",
      delivery: { autoAdvance: true },
      shipping: { freeShippingThreshold: 4900, flatRate: 590, zones: [] },
      relance: {
        enabled: true,
        abandonedCartDelaysHours: [3, 24, 72],
        unpaidOrderDelaysHours: [24, 72],
      },
      chatbot: { enabled: true },
    });
  }
  return settings;
}

/** Version « plain object » sérialisable (Dates → string, ObjectId → string). */
export async function getSettingsPlain(): Promise<Record<string, unknown>> {
  const settings = await getSettings();
  return JSON.parse(JSON.stringify(settings.toObject()));
}

/** Met à jour une section entière du singleton et renvoie le document à jour. */
export async function updateSettingsSection(
  section: keyof SettingsDoc,
  data: unknown,
) {
  await connectDB();
  const updated = await Settings.findOneAndUpdate(
    { singleton: "main" },
    { $set: { [section]: data } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return updated;
}
