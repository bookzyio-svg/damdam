import { z } from "zod";
import { requireAdmin, unauthorized } from "@/lib/auth-guard";
import { getSettingsPlain, updateSettingsSection } from "@/lib/settings";
import { SECTION_SCHEMAS, type SettingsSection } from "@/lib/validation/settings";

export const dynamic = "force-dynamic";

/** GET /api/settings — renvoie le singleton complet (admin uniquement). */
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const settings = await getSettingsPlain();
  return Response.json({ settings });
}

const patchBodySchema = z.object({
  section: z.enum(
    Object.keys(SECTION_SCHEMAS) as [SettingsSection, ...SettingsSection[]],
  ),
  data: z.unknown(),
});

/**
 * PATCH /api/settings — met à jour UNE section du singleton.
 * Body : { section: "bank" | "shipping" | ..., data: {...} }
 * `data` est validé contre le schéma Zod de la section avant écriture.
 */
export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsedBody = patchBodySchema.safeParse(json);
  if (!parsedBody.success) {
    return Response.json(
      { error: "Section inconnue", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const { section, data } = parsedBody.data;
  const schema = SECTION_SCHEMAS[section];
  const parsedData = schema.safeParse(data);
  if (!parsedData.success) {
    return Response.json(
      { error: "Données invalides", details: parsedData.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await updateSettingsSection(section, parsedData.data);
  const plain = JSON.parse(JSON.stringify(updated?.toObject() ?? {}));
  return Response.json({ ok: true, settings: plain });
}
