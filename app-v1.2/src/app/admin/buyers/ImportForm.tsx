"use client";

import { useActionState } from "react";
import { importBuyers } from "@/lib/actions/admin";

export function ImportForm() {
  const [state, action, pending] = useActionState(importBuyers, undefined);
  return (
    <form action={action} className="card flex flex-wrap items-center gap-3 p-4">
      <input type="file" name="csv" accept=".csv,text/csv" className="input max-w-sm" />
      <button className="btn-primary" disabled={pending}>{pending ? "Importing…" : "Import buyers"}</button>
      {state?.error && <span className="text-sm text-rose-700">{state.error}</span>}
      {state?.added !== undefined && (
        <span className="text-sm text-emerald-800">
          Added {state.added}, updated {state.updated}{state.skipped ? `, skipped ${state.skipped} without a name or consent` : ""}.
        </span>
      )}
    </form>
  );
}
