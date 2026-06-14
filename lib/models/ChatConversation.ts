import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * ChatConversation — conversations du chatbot site (Gemini). Le mode peut
 * basculer "bot" → "human" (escalade). Réutilisable pour WhatsApp en phase 2.
 */

const ChatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"] },
    content: String,
    at: Date,
  },
  { _id: false },
);

const ChatConversationSchema = new Schema(
  {
    sessionId: { type: String, index: true },
    customerEmail: String,
    linkedOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    mode: { type: String, enum: ["bot", "human"], default: "bot" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    messages: [ChatMessageSchema],
    unread: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ChatConversationDoc = InferSchemaType<typeof ChatConversationSchema>;

export const ChatConversation: Model<ChatConversationDoc> =
  (mongoose.models.ChatConversation as Model<ChatConversationDoc>) ||
  mongoose.model<ChatConversationDoc>(
    "ChatConversation",
    ChatConversationSchema,
  );

export default ChatConversation;
