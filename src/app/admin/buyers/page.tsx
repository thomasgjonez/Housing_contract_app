import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { alertOutbox, allProfiles, topMatchesByProfile } from "@/lib/data/buyers";
import { complexOptions } from "@/lib/data/complexes";
import { preferenceChips } from "@/lib/preferences";
import { ALERT_MIN_SCORE } from "@/lib/matching";
import { setBuyerActive } from "@/lib/actions/admin";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ImportForm } from "./ImportForm";

export default async function Buyers() {
  await requireAdmin();
  const profiles = allProfiles();
  const top = topMatchesByProfile(profiles, 3);
  const outbox = alertOutbox(25);
  const complexName = new Map(complexOptions().map((c) => [c.id, c.name]));
  const names = (ids: number[]) => ids.map((id) => complexName.get(id)).filter(Boolean).join(", ");
  const active = profiles.filter((p) => p.active);
  const noMatch = active.filter((p) => (top.get(p.id)?.count ?? 0) === 0).length;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-brand-600">← Admin</Link>
        <h1 className="text-3xl font-semibold">Buyers and matching</h1>
        <p className="text-sm text-slate-600">
          Every active buyer is checked against each new listing. Dealbreakers filter, then a 0–100 score ranks the rest. Scores of {ALERT_MIN_SCORE}+ trigger an alert.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-sm text-slate-500">Active buyers</div><div className="font-display text-3xl font-bold">{active.length}</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">With no current match</div><div className="font-display text-3xl font-bold">{noMatch}</div><div className="text-xs text-slate-500">Demand you can go find sellers for</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">Alerts queued</div><div className="font-display text-3xl font-bold">{outbox.length}</div><div className="text-xs text-slate-500">Stubbed until email/text is connected</div></div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Import Google Form responses</h2>
        <p className="text-sm text-slate-600">
          In the responses sheet, use File → Download → Comma-separated values, then upload it here. Rows are matched by email or phone, so re-importing updates buyers instead of duplicating them. Rows without consent are skipped.
        </p>
        <ImportForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Buyers</h2>
        {profiles.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No buyers yet. Import your form responses above, or share the Get matched page.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {profiles.map((p) => {
              const t = top.get(p.id);
              return (
                <div key={p.id} className={`card space-y-2 p-4 ${p.active ? "" : "opacity-60"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {p.name}{" "}
                        <span className="chip">{p.source === "form" ? (p.user_id ? "Google Form, has account" : "Google Form") : "Signed up"}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {[p.contact_method, p.phone, p.email, p.social].filter(Boolean).join(" · ")}
                        {p.contracts_needed > 1 ? ` · needs ${p.contracts_needed} contracts` : ""}
                      </div>
                    </div>
                    <form action={setBuyerActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                      <button className="btn-ghost !px-2.5 !py-1 text-xs">{p.active ? "Mark found" : "Reactivate"}</button>
                    </form>
                  </div>
                  <div className="flex flex-wrap gap-1">{preferenceChips(p).map((c) => <span key={c} className="chip">{c}</span>)}</div>
                  {(p.like_ids.length > 0 || p.avoid_ids.length > 0 || p.unmatched_like || p.unmatched_avoid) && (
                    <div className="space-y-0.5 text-xs text-slate-600">
                      {p.like_ids.length > 0 && <div>Likes: {names(p.like_ids)}</div>}
                      {p.avoid_ids.length > 0 && <div>Avoids: {names(p.avoid_ids)}</div>}
                      {(p.unmatched_like || p.unmatched_avoid) && (
                        <div className="text-amber-700">
                          Not on the complex list: {[p.unmatched_like && `likes ${p.unmatched_like}`, p.unmatched_avoid && `avoids ${p.unmatched_avoid}`].filter(Boolean).join("; ")}
                        </div>
                      )}
                    </div>
                  )}
                  {p.notes && <p className="text-xs text-slate-600">“{p.notes}”</p>}
                  <div className="text-sm">
                    <span className="text-slate-500">{t?.count ?? 0} listings fit.</span>
                    {t && t.top.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {t.top.map(({ l, m }) => (
                          <li key={l.id} className="flex items-center justify-between gap-2">
                            <Link href={`/listings/${l.id}`} className="truncate text-brand-700 hover:underline">
                              {l.complex} · ${l.rent_monthly} · {l.room_type}
                            </Link>
                            <ScoreBadge score={m.score} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Alert outbox</h2>
        <p className="text-sm text-slate-600">
          No email or text provider is connected, so alerts are saved here instead of sent. Hook one up in <code>src/lib/notify.ts</code>.
        </p>
        {outbox.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No alerts yet. Post a listing that fits a buyer to see one.</div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {outbox.map((n) => (
              <div key={n.id} className="space-y-1 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="chip">{n.channel}</span>
                  <span>{n.name} · {n.to_address}</span>
                  <span className="ml-auto">{n.created_at} · {n.status}</span>
                </div>
                <div>{n.body}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
