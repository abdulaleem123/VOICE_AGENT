import { ChatPane } from "@/components/ChatPane";

export default async function ConversationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live conversation</h1>
      <ChatPane conversationId={id} />
    </div>
  );
}
