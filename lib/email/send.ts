import { Resend } from "resend";
import { buildTemplate, type EmailTemplate } from "@/lib/email/templates";

/**
 * Helper unique d'envoi d'email (§16) : sendEmail({ to, template, data }).
 * Si RESEND_API_KEY est absent, on n'échoue pas (utile en dev sans clés) :
 * l'email est simplement loggué et ignoré.
 */
export async function sendEmail({
  to,
  template,
  data,
}: {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Boutique <onboarding@resend.dev>";

  const { subject, html } = buildTemplate(template, data);

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY absent — email "${template}" non envoyé à ${to}`);
    return { ok: false, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[email] échec Resend:", error);
      return { ok: false, error: String(error) };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] exception:", err);
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
