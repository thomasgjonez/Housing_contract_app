import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getConversation, markRead, messages as listMessages } from "@/lib/data/chat";
import { sendMessage } from "@/lib/actions/chat";
import { AutoRefresh } from "./AutoRefresh";

export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/inbox/${id}`);
  const conv = getConversation(Number(id), user.id);
  if (!conv) notFound();

  markRead(conv.id, user.id);
  const messages = listMessages(conv.id);
  const other = conv.buyer_id === user.id ? conv.seller_name : conv.buyer_name;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <AutoRefresh seconds={4} />
      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="font-bold">{other}</div>
          <Link href={`/listings/${conv.listing_id}`} className="text-sm text-brand-600">
            {conv.complex} · ${conv.rent_monthly}/mo {conv.status !== "active" && `(${conv.status})`}
          </Link>
        </div>
        <Link href="/inbox" className="btn-ghost !py-1.5">All messages</Link>
      </div>

      <div className="space-y-2">
        {messages.length === 0 && <div className="text-center text-sm text-slate-500">Say hi to start the conversation.</div>}
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "bg-white ring-1 ring-brand-100"}`}>
                {m.body}
                <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>{m.created_at.slice(5, 16).replace("T", " ")} UTC</div>
              </div>
            </div>
          );
        })}
      </div>

      <form action={sendMessage} className="sticky bottom-20 flex gap-2 md:bottom-4">
        <input type="hidden" name="conversationId" value={conv.id} />
        <input name="body" required autoComplete="off" placeholder="Write a message…" className="input" />
        <button className="btn-primary">Send</button>
      </form>
    </div>
  );
}
