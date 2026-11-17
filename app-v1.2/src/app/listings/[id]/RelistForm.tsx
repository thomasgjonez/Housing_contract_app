"use client";

import { useActionState } from "react";
import { relistListing } from "@/lib/actions/listings";

/** Shown to the seller once a listing has expired. */
export function RelistForm({ listingId }: { listingId: number }) {
  const [state, action, pending] = useActionState(relistListing, undefined);
  return (
    <form action={action} className="space-y-2">
      <p className="text-sm text-slate-600">
        This listing expired two weeks after its lease start date. Still have the contract? Put in the new dates and relist it.
      </p>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="grid grid-cols-2 gap-2">
        <label><span className="label">New start</span><input name="startDate" type="date" required className="input" /></label>
        <label><span className="label">End</span><input name="endDate" type="date" required className="input" /></label>
      </div>
      {state?.error && <div className="rounded-xl bg-rose-50 p-2 text-sm text-rose-800">{state.error}</div>}
      <button className="btn-primary w-full !py-1.5" disabled={pending}>{pending ? "Relisting…" : "Relist"}</button>
    </form>
  );
}
