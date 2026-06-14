import MessagesList from "@/components/admin/MessagesList";

export const dynamic = "force-dynamic";

export default function AdminMessagesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Messages de contact</h1>
      <MessagesList />
    </div>
  );
}
