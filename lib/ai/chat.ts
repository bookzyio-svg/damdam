import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Order } from "@/lib/models/Order";
import { getSettings } from "@/lib/settings";
import { getGeminiModel, isGeminiConfigured, withModelFallback } from "@/lib/ai/gemini";
import { formatPrice } from "@/lib/utils/money";
import { orderStatusLabel } from "@/lib/order-status";
import { SITE_URL } from "@/lib/site-url";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cerveau du chatbot (§13) — INDÉPENDANT DU TRANSPORT. La même logique et les
 * mêmes outils seront réutilisés pour brancher WhatsApp en phase 2 ; il suffira
 * d'appeler `runChatBrain` avec l'historique de l'autre canal.
 */

export type BrainMessage = { role: "user" | "assistant" | "system"; content: string };
export type BrainResult = { text: string; escalated: boolean; escalationReason?: string };

/* ---------- Outils (function calling) ---------- */

const toolDeclarations = [
  {
    functionDeclarations: [
      {
        name: "searchProducts",
        description: "Recherche des produits du catalogue par mots-clés (nom, marque). Renvoie prix et disponibilité.",
        parameters: {
          type: "OBJECT",
          properties: { query: { type: "STRING", description: "Termes de recherche" } },
          required: ["query"],
        },
      },
      {
        name: "getOrderStatus",
        description: "Récupère le statut d'une commande via sa référence de virement, son numéro de suivi, ou l'email du client.",
        parameters: {
          type: "OBJECT",
          properties: {
            reference: { type: "STRING", description: "Référence de virement (ex. TX-7F3K9)" },
            deliveryNumber: { type: "STRING", description: "Numéro de suivi (ex. LIV-9K2M7X)" },
            email: { type: "STRING", description: "Email du client" },
          },
        },
      },
      {
        name: "getBankDetails",
        description: "Renvoie les coordonnées bancaires pour le paiement par virement.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "escalateToHuman",
        description: "Transfère la conversation à un conseiller humain quand le bot ne peut pas aider.",
        parameters: {
          type: "OBJECT",
          properties: { reason: { type: "STRING", description: "Motif du transfert" } },
          required: ["reason"],
        },
      },
    ],
  },
];

/** Exécute un outil et renvoie un résultat JSON-able + éventuel signal d'escalade. */
async function executeTool(name: string, args: any): Promise<{ result: any; escalateReason?: string }> {
  await connectDB();
  switch (name) {
    case "searchProducts": {
      const q = String(args?.query ?? "").trim();
      const products = await Product.find({
        status: "active",
        $or: [{ title: { $regex: q, $options: "i" } }, { brand: { $regex: q, $options: "i" } }],
      })
        .select("title slug price stock trackStock")
        .limit(5)
        .lean();
      return {
        result: {
          count: products.length,
          products: products.map((p) => ({
            title: p.title,
            price: formatPrice(p.price),
            disponible: !p.trackStock || (p.stock ?? 0) > 0,
            url: `${SITE_URL}/produit/${p.slug}`,
          })),
        },
      };
    }
    case "getOrderStatus": {
      const { reference, deliveryNumber, email } = args ?? {};
      const filter: Record<string, unknown> = {};
      if (reference) filter.paymentReference = String(reference).toUpperCase();
      else if (deliveryNumber) filter["delivery.deliveryNumber"] = String(deliveryNumber).toUpperCase();
      else if (email) filter["customer.email"] = String(email).toLowerCase();
      else return { result: { error: "Fournissez une référence, un numéro de suivi ou un email." } };

      const order = await Order.findOne(filter).sort({ createdAt: -1 }).lean();
      if (!order) return { result: { found: false } };
      return {
        result: {
          found: true,
          orderNumber: order.orderNumber,
          statut: orderStatusLabel(order.status),
          etapeLivraison: order.delivery?.currentStepKey ?? null,
          suivi: order.delivery?.deliveryNumber ? `${SITE_URL}/suivi/${order.delivery.deliveryNumber}` : null,
          total: formatPrice(order.total),
        },
      };
    }
    case "getBankDetails": {
      const settings = await getSettings();
      const b = settings.bank ?? {};
      return { result: { titulaire: b.titulaire, iban: b.iban, bic: b.bic, banque: b.banque, instructions: b.instructions } };
    }
    case "escalateToHuman": {
      const reason = String(args?.reason ?? "Demande client");
      return { result: { ok: true, message: "Un conseiller va prendre le relais." }, escalateReason: reason };
    }
    default:
      return { result: { error: "Outil inconnu" } };
  }
}

/* ---------- Orchestration ---------- */

function defaultSystemPrompt(extra?: string): string {
  return `Tu es l'assistant virtuel d'une boutique en ligne française d'électroménager et high-tech.
Tu réponds en français, de façon concise, courtoise et fiable.
Le paiement se fait UNIQUEMENT par virement bancaire ; la livraison est suivie en temps réel.
Utilise les outils fournis pour donner des informations exactes (produits, statut de commande, coordonnées bancaires).
N'invente jamais de prix, de stock ou de statut : appelle l'outil approprié.
Si tu ne peux pas aider (litige, demande complexe), utilise escalateToHuman.
${extra ? `\nConsignes de la boutique : ${extra}` : ""}`;
}

/** Convertit l'historique interne → format Gemini (assistant→model, system ignoré). */
function toGeminiHistory(history: BrainMessage[]) {
  return history
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

/**
 * Exécute un tour de conversation : envoie l'historique + message utilisateur,
 * résout les appels d'outils en boucle, renvoie la réponse finale.
 */
export async function runChatBrain(
  history: BrainMessage[],
  userText: string,
  opts: { systemPrompt?: string } = {},
): Promise<BrainResult> {
  const degraded: BrainResult = {
    text: "Le service d'assistance automatique est momentanément indisponible. Écrivez-nous votre question, un conseiller vous répondra.",
    escalated: true,
    escalationReason: "IA indisponible",
  };

  if (!isGeminiConfigured()) {
    return { ...degraded, escalationReason: "Gemini non configuré" };
  }

  // Un tour complet de conversation (sendMessage + boucle d'outils) sur un modèle
  // donné — relancé sur le modèle de secours en cas de quota/permission.
  const runConversation = async (modelName: string): Promise<BrainResult> => {
    const model = getGeminiModel(modelName);
    const chat = (model as any).startChat({
      history: toGeminiHistory(history),
      tools: toolDeclarations,
      systemInstruction: { role: "system", parts: [{ text: defaultSystemPrompt(opts.systemPrompt) }] },
    });

    let escalated = false;
    let escalationReason: string | undefined;

    let response = (await chat.sendMessage(userText)).response;

    // Boucle d'appels d'outils (max 5 pour éviter les boucles infinies)
    for (let i = 0; i < 5; i += 1) {
      const calls = response.functionCalls?.() ?? [];
      if (!calls.length) break;

      const responses = [];
      for (const call of calls) {
        const exec = await executeTool(call.name, call.args);
        if (exec.escalateReason) {
          escalated = true;
          escalationReason = exec.escalateReason;
        }
        responses.push({ functionResponse: { name: call.name, response: exec.result } });
      }
      response = (await chat.sendMessage(responses)).response;
    }

    let text = "";
    try {
      text = response.text();
    } catch {
      text = "Je n'ai pas pu formuler de réponse. Reformulez votre question ou demandez un conseiller.";
    }

    return { text: text.trim() || "Comment puis-je vous aider ?", escalated, escalationReason };
  };

  try {
    // Bascule automatique vers le modèle de secours (429/403), sinon dégradation.
    return await withModelFallback(runConversation);
  } catch (err) {
    console.error("[chat] échec Gemini, réponse dégradée :", err);
    return degraded;
  }
}
