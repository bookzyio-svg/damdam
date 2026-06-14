import ConversationsConsole from "@/components/admin/ConversationsConsole";

export const dynamic = "force-dynamic";

export default function AdminConversationsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Conversations</h1>
      <ConversationsConsole />
    </div>
  );
}
