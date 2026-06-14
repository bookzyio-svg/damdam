import { getSettingsPlain } from "@/lib/settings";
import ChatbotForm from "./ChatbotForm";

export const dynamic = "force-dynamic";

export default async function ChatbotSettingsPage() {
  const settings = await getSettingsPlain();
  return <ChatbotForm initial={(settings.chatbot as never) ?? {}} />;
}
