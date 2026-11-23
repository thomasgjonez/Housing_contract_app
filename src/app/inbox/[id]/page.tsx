import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getConversation, markRead, messages as listMessages } from "@/lib/data/chat";
import { LiveConversation } from "./LiveConversation";

export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/inbox/${id}`);
  const conv = await getConversation(Number(id), user.id);
  if (!conv) notFound();

  await markRead(conv.id, user.id);
  const messages = await listMessages(conv.id);
  const other = conv.buyer_id === user.id ? conv.seller_name : conv.buyer_name;
  const lastMine = [...messages].reverse().find((m) => m.sender_id === user.id);
  const initialSeen = lastMine ? { id: lastMine.id, seen: lastMine.read_at !== null } : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="font-bold">{other}</div>
          <Link href={`/listings/${conv.listing_id}`} className="text-sm text-brand-600">
            {conv.complex} · ${conv.rent_monthly}/mo {conv.status !== "active" && `(${conv.status})`}
          </Link>
        </div>
        <Link href="/inbox" className="btn-ghost !py-1.5">All messages</Link>
      </div>

      <LiveConversation conversationId={conv.id} currentUserId={user.id} initialMessages={messages} initialSeen={initialSeen} />
    </div>
  );
}
