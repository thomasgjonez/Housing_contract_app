"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { pollConversation, sendMessage } from "@/lib/actions/chat";
import type { Message } from "@/lib/data/chat";

type Seen = { id: number; seen: boolean } | null;

function time(iso: string) {
  return iso.slice(5, 16).replace("T", " ");
}

export function LiveConversation({
  conversationId,
  currentUserId,
  initialMessages,
  initialSeen,
}: {
  conversationId: number;
  currentUserId: number;
  initialMessages: Message[];
  initialSeen: Seen;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [seen, setSeen] = useState<Seen>(initialSeen);
  const [pending, startTransition] = useTransition();
  const lastId = useRef(initialMessages.at(-1)?.id ?? 0);
  const formRef = useRef<HTMLFormElement>(null);

  const poll = useCallback(async () => {
    const res = await pollConversation(conversationId, lastId.current);
    if (res.newMessages.length) {
      lastId.current = res.newMessages.at(-1)!.id;
      setMessages((prev) => [...prev, ...res.newMessages]);
    }
    setSeen(res.myLastSeen);
  }, [conversationId]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") poll();
    };
    const t = setInterval(tick, 2500);
    return () => clearInterval(t);
  }, [poll]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!String(fd.get("body") ?? "").trim()) return;
    formRef.current?.reset();
    startTransition(async () => {
      await sendMessage(fd);
      await poll();
    });
  }

  const lastMineId = [...messages].reverse().find((m) => m.sender_id === currentUserId)?.id;

  return (
    <>
      <div className="space-y-2">
        {messages.length === 0 && <div className="text-center text-sm text-slate-500">Say hi to start the conversation.</div>}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          const showSeen = mine && m.id === lastMineId && seen?.id === m.id && seen.seen;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "bg-white ring-1 ring-brand-100"}`}>
                {m.body}
                <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                  {time(m.created_at)}
                  {showSeen && " · Seen"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="sticky bottom-20 flex gap-2 md:bottom-4">
        <input type="hidden" name="conversationId" value={conversationId} />
        <input name="body" required autoComplete="off" placeholder="Write a message…" className="input" />
        <button className="btn-primary" disabled={pending}>Send</button>
      </form>
    </>
  );
}
