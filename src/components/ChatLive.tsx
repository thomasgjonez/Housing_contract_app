"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { pollInbox } from "@/lib/actions/chat";

type Latest = { id: number; conversationId: number; otherName: string; body: string };

const UnreadContext = createContext(0);

/** Live unread message count, kept fresh by ChatLiveProvider. */
export function useUnread() {
  return useContext(UnreadContext);
}

/**
 * Polls once for the whole app (nav badges + the new-message toast share this
 * single loop instead of each polling independently) and shows a toast when a
 * genuinely new message arrives while the user isn't already looking at it.
 */
export function ChatLiveProvider({
  initialUnread,
  enabled,
  children,
}: {
  initialUnread: number;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [unread, setUnread] = useState(initialUnread);
  const [toast, setToast] = useState<Latest | null>(null);
  const lastToasted = useRef(0);
  const initialized = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await pollInbox();
      if (cancelled) return;
      setUnread(res.unread);
      if (!initialized.current) {
        initialized.current = true;
        lastToasted.current = res.latest?.id ?? 0;
        return;
      }
      if (res.latest && res.latest.id > lastToasted.current && pathname !== `/inbox/${res.latest.conversationId}`) {
        lastToasted.current = res.latest.id;
        setToast(res.latest);
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [enabled, pathname]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <UnreadContext.Provider value={unread}>
      {children}
      {toast && (
        <Link
          href={`/inbox/${toast.conversationId}`}
          onClick={() => setToast(null)}
          className="fixed bottom-24 left-1/2 z-[1100] w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-2xl bg-white p-4 text-sm shadow-lift ring-1 ring-brand-100 transition md:bottom-6"
        >
          <div className="font-semibold text-brand-700">New message from {toast.otherName}</div>
          <div className="mt-0.5 truncate text-slate-600">{toast.body}</div>
        </Link>
      )}
    </UnreadContext.Provider>
  );
}
