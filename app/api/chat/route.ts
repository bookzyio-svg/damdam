import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ChatConversation } from "@/lib/models/ChatConversation";
import { getSettings } from "@/lib/settings";
import { runChatBrain, type BrainMessage } from "@/lib/ai/chat";
import { checkRate, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.string().min(6),
  message: z.string().min(1).max(2000),
  email: z.string().email().optional(),
});

/** GET /api/chat — config publique du widget (activation + message d'accueil). */
export async function GET() {
  await connectDB();
  const settings = await getSettings();
  return Response.json({
    enabled: settings.chatbot?.enabled !== false,
    greeting: settings.chatbot?.greeting || "Bonjour 👋 Comment puis-je vous aider ?",
  });
}

/** Encode une chaîne en flux texte (streaming côté client). */
function streamText(text: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      // Émission par petits morceaux pour un effet "machine à écrire"
      const chunks = text.match(/[\s\S]{1,24}/g) ?? [text];
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

/**
 * POST /api/chat (§13) — un tour de conversation du chatbot.
 * Persiste la ChatConversation (sessionId), exécute le cerveau Gemini avec ses
 * outils, gère l'escalade humaine, et renvoie la réponse en streaming.
 */
export async function POST(req: Request) {
  const rl = checkRate(req, "chat", 20, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { sessionId, message, email } = parsed.data;

  await connectDB();
  const settings = await getSettings();

  if (settings.chatbot?.enabled === false) {
    return new Response(
      streamText("Le chat est actuellement désactivé. Contactez-nous par email, nous reviendrons vers vous rapidement."),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  let conv = await ChatConversation.findOne({ sessionId });
  if (!conv) {
    conv = await ChatConversation.create({ sessionId, customerEmail: email, mode: "bot", status: "open", messages: [] });
  }
  if (email && !conv.customerEmail) conv.customerEmail = email;

  // Enregistre le message utilisateur
  conv.messages.push({ role: "user", content: message, at: new Date() });

  // Mode humain : pas de réponse du bot, on notifie l'admin
  if (conv.mode === "human") {
    conv.unread = true;
    await conv.save();
    return new Response(
      streamText("Votre message a bien été transmis à un conseiller. Vous recevrez une réponse très vite."),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Mode": "human" } },
    );
  }

  // Historique pour le cerveau (hors dernier message déjà ajouté)
  const history: BrainMessage[] = conv.messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content ?? "",
  }));

  const result = await runChatBrain(history, message, {
    systemPrompt: settings.chatbot?.systemPrompt || undefined,
  });

  conv.messages.push({ role: "assistant", content: result.text, at: new Date() });
  if (result.escalated) {
    conv.mode = "human";
    conv.unread = true;
  }
  await conv.save();

  return new Response(streamText(result.text), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Mode": conv.mode,
    },
  });
}
