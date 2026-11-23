"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInboxRows } from "@/lib/actions/chat";
import type { InboxRow } from "@/lib/data/chat";

export function LiveInboxList({ initialRows }: { initialRows: InboxRow[] }) {
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      setRows(await getInboxRows());
    };
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, []);

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-600">
        No messages yet. <Link href="/match" className="font-semibold text-brand-600">Find a contract</Link> or{" "}
        <Link href="/sell" className="font-semibold text-brand-600">list yours</Link>.
      </div>
    );
  }

  return (
    <div className="card divide-y divide-slate-100">
      {rows.map((r) => (
        <Link key={r.id} href={`/inbox/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
            {r.other_name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <span className="font-semibold">{r.other_name}</span>
              <span className="text-xs text-slate-500">{r.i_am_seller ? "Buyer" : "Seller"}</span>
            </div>
            <div className="text-xs text-slate-500">{r.complex} · ${r.rent_monthly}/mo</div>
            <div className={`truncate text-sm ${r.unread ? "font-semibold text-slate-900" : "text-slate-600"}`}>{r.last_body ?? "No messages yet"}</div>
          </div>
          {r.unread > 0 && <span className="rounded-full bg-brand-600 px-2 text-xs font-bold text-white">{r.unread}</span>}
        </Link>
      ))}
    </div>
  );
}
