"use client";

import { useActionState } from "react";
import { saveProfile } from "@/lib/actions/buyers";
import type { BuyerProfile } from "@/lib/data/buyers";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import {
  AmenityFields, ApprovedField, AreasField, Choice, ComplexesField, DistanceField, FlexField, GenderField,
  ParkingField, PetsField, RentAndMoveInFields, RoomField, Row, SemestersField, TermField,
} from "@/components/PreferenceFields";

export function ProfileForm({
  profile: p,
  user,
  complexes,
}: {
  profile: BuyerProfile | null;
  user: { name: string; email: string; phone: string };
  complexes: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const prefs = p ?? DEFAULT_PREFERENCES;
  const isNew = !p?.complete;

  return (
    <form action={action} className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{isNew ? "Get matched" : "Your buyer profile"}</h1>
        <p className="text-slate-600">
          Fill this out once. Dealbreakers hide listings that won&apos;t work, and everything else ranks the rest. We&apos;ll alert you when a strong match is posted.
        </p>
      </div>

      <section className="card space-y-5 p-5">
        <h2 className="font-bold">Dealbreakers</h2>
        <GenderField p={prefs} />
        <ApprovedField p={prefs} />
        <RoomField p={prefs} />
        <RentAndMoveInFields p={prefs} requireMoveIn />
        <FlexField p={prefs} />
        <AreasField p={prefs} />
        <div className="grid grid-cols-2 gap-3">
          <ParkingField p={prefs} />
          <PetsField p={prefs} />
        </div>
        <ComplexesField p={prefs} kind="avoid" complexes={complexes} />
      </section>

      <section className="card space-y-5 p-5">
        <h2 className="font-bold">Nice to have</h2>
        <p className="-mt-3 text-sm text-slate-600">These don&apos;t hide anything. They move the best fits to the top.</p>
        <SemestersField p={prefs} />
        <TermField p={prefs} />
        <DistanceField p={prefs} />
        <ComplexesField p={prefs} kind="like" complexes={complexes} />
        <AmenityFields p={prefs} />
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">About you</h2>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="label">Name</span><input name="name" required defaultValue={p?.name ?? user.name} className="input" /></label>
          <label>
            <span className="label">School</span>
            <select name="school" defaultValue={p?.school ?? "BYU"} className="input">
              <option>BYU</option><option>UVU</option><option>Other</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Contracts needed</span>
            <select name="contracts_needed" defaultValue={p?.contracts_needed ?? 1} className="input">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 6 ? "6+" : n}</option>)}
            </select>
          </label>
          <label>
            <span className="label">With a group?</span>
            <select name="group_pref" defaultValue={p?.group_pref ?? "solo"} className="input">
              <option value="solo">Just me</option>
              <option value="same-unit">Yes, same unit</option>
              <option value="same-complex">Yes, same complex is fine</option>
            </select>
          </label>
        </div>
        <label className="block"><span className="label">Anything else?</span><textarea name="notes" rows={2} defaultValue={p?.notes ?? ""} className="input" placeholder="Roommate preferences, accessibility needs…" /></label>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Match alerts</h2>
        <Row label="Tell me about strong new matches by" cols={4}>
          <Choice name="alerts" value="email" label="Email" current={p?.alerts ?? "email"} />
          <Choice name="alerts" value="text" label="Text" current={p?.alerts ?? "email"} />
          <Choice name="alerts" value="both" label="Both" current={p?.alerts ?? "email"} />
          <Choice name="alerts" value="off" label="Don't" current={p?.alerts ?? "email"} />
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="label">Email</span><input name="email" type="email" defaultValue={p?.email ?? user.email} className="input" /></label>
          <label><span className="label">Phone</span><input name="phone" type="tel" defaultValue={p?.phone ?? user.phone} className="input" placeholder="For texts" /></label>
        </div>
        {p && (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="paused" defaultChecked={!p.active} /> Pause my search (found a place)</label>
        )}
      </section>

      {state?.error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{state.error}</div>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Saving…" : isNew ? "Show my matches" : "Save and see matches"}</button>
    </form>
  );
}
