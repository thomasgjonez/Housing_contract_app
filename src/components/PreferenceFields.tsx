// Form fields for buyer preferences. The quick quiz and the full profile use
// the same fields, so their answers always mean the same thing.

import type { ReactNode } from "react";
import { AREAS, SEMESTERS, type BuyerPreferences } from "@/lib/preferences";

type P = { p: BuyerPreferences };

export function Choice({ name, value, label, current }: { name: string; value: string; label: string; current: string }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={current === value} className="peer sr-only" />
      <span className="block h-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700">
        {label}
      </span>
    </label>
  );
}

export function Check({ name, value, label, checked }: { name: string; value: string; label: string; checked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="block rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700">
        {label}
      </span>
    </label>
  );
}

export function Row({ label, hint, children, cols = 3 }: { label: string; hint?: string; children: ReactNode; cols?: number }) {
  return (
    <div>
      <span className="label">{label}</span>
      {hint && <span className="-mt-1 mb-1.5 block text-xs text-slate-500">{hint}</span>}
      <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>{children}</div>
    </div>
  );
}

// ---------- quiz fields (also in the profile) ----------

export function GenderField({ p }: P) {
  return (
    <Row label="Housing">
      <Choice name="gender" value="women" label="Women's" current={p.gender} />
      <Choice name="gender" value="men" label="Men's" current={p.gender} />
      <Choice name="gender" value="any" label="Co-ed is fine" current={p.gender} />
    </Row>
  );
}

export function RoomField({ p }: P) {
  return (
    <Row label="Bedroom">
      <Choice name="room" value="private" label="Private" current={p.room} />
      <Choice name="room" value="shared" label="Shared" current={p.room} />
      <Choice name="room" value="any" label="Either" current={p.room} />
    </Row>
  );
}

export function ApprovedField({ p }: P) {
  return (
    <Row label="BYU-approved housing">
      <Choice name="needs_approved" value="yes" label="Required" current={p.needs_approved} />
      <Choice name="needs_approved" value="no" label="Not needed" current={p.needs_approved} />
      <Choice name="needs_approved" value="unsure" label="Not sure" current={p.needs_approved} />
    </Row>
  );
}

export function RentAndMoveInFields({ p, requireMoveIn }: P & { requireMoveIn?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label>
        <span className="label">Max rent ($/month)</span>
        <input name="max_rent" type="number" min={0} step={25} defaultValue={p.max_rent ?? ""} placeholder="e.g. 550" className="input" />
      </label>
      <label>
        <span className="label">Move-in date</span>
        <input name="move_in" type="date" required={requireMoveIn} defaultValue={p.move_in ?? ""} className="input" />
      </label>
    </div>
  );
}

export function TermField({ p }: P) {
  return (
    <label className="block">
      <span className="label">Contract length</span>
      <select name="term" defaultValue={p.term} className="input">
        <option value="any">Flexible</option>
        <option value="one-semester">One semester</option>
        <option value="fall-winter">Fall + Winter</option>
        <option value="spring-summer">Spring + Summer</option>
        <option value="full-year">Full year</option>
      </select>
    </label>
  );
}

export function DistanceField({ p }: P) {
  return (
    <Row label="Distance to campus" cols={4}>
      <Choice name="distance" value="walk" label="Walking" current={p.distance} />
      <Choice name="distance" value="drive10" label="≤ 10 min drive" current={p.distance} />
      <Choice name="distance" value="drive20" label="≤ 20 min drive" current={p.distance} />
      <Choice name="distance" value="any" label="Doesn't matter" current={p.distance} />
    </Row>
  );
}

export function ParkingField({ p }: P) {
  return (
    <label>
      <span className="label">Parking</span>
      <select name="parking" defaultValue={p.parking} className="input">
        <option value="none">Don&apos;t need it</option>
        <option value="need">Need a pass</option>
        <option value="covered">Need covered</option>
      </select>
    </label>
  );
}

export function ContractsNeededField({ p }: P) {
  return (
    <label className="block">
      <span className="label">Contracts needed</span>
      <select name="contracts_needed" defaultValue={p.contracts_needed} className="input">
        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 6 ? "6+" : n}</option>)}
      </select>
    </label>
  );
}

/** The short quiz: the first questions of the profile. */
export function QuizFields({ p }: P) {
  return (
    <>
      <GenderField p={p} />
      <RoomField p={p} />
      <RentAndMoveInFields p={p} />
      <div className="grid grid-cols-2 gap-3">
        <TermField p={p} />
        <ParkingField p={p} />
      </div>
      <DistanceField p={p} />
      <ApprovedField p={p} />
      <ContractsNeededField p={p} />
    </>
  );
}

// ---------- profile-only fields ----------

export function FlexField({ p }: P) {
  const v = String(p.flex_days);
  return (
    <Row label="How flexible is the move-in date?" cols={4}>
      <Choice name="flex_days" value="0" label="Exact" current={v} />
      <Choice name="flex_days" value="7" label="± a week" current={v} />
      <Choice name="flex_days" value="21" label="2–3 weeks" current={v} />
      <Choice name="flex_days" value="60" label="Very" current={v} />
    </Row>
  );
}

export function AreasField({ p }: P) {
  return (
    <div>
      <span className="label">Areas you&apos;d live in</span>
      <span className="-mt-1 mb-1.5 block text-xs text-slate-500">Leave all unchecked if any area works.</span>
      <div className="flex flex-wrap gap-2">
        {AREAS.map((a) => <Check key={a} name="areas" value={a} label={a} checked={p.areas.includes(a)} />)}
      </div>
    </div>
  );
}

export function PetsField({ p }: P) {
  return (
    <label>
      <span className="label">Pets</span>
      <select name="pets" defaultValue={p.pets} className="input">
        <option value="none">No pets</option>
        <option value="pet">I have a pet</option>
        <option value="esa">Emotional support animal</option>
      </select>
    </label>
  );
}

export function ComplexesField({
  p,
  kind,
  complexes,
}: P & { kind: "like" | "avoid"; complexes: { id: number; name: string }[] }) {
  const selected = kind === "like" ? p.like_ids : p.avoid_ids;
  return (
    <div>
      <span className="label">{kind === "like" ? "Complexes you like" : "Complexes to avoid"}</span>
      <div className="flex flex-wrap gap-2">
        {complexes.map((c) => (
          <Check key={c.id} name={`${kind}_ids`} value={String(c.id)} label={c.name} checked={selected.includes(c.id)} />
        ))}
      </div>
    </div>
  );
}

export function SemestersField({ p }: P) {
  return (
    <div>
      <span className="label">Semesters you need</span>
      <div className="flex flex-wrap gap-2">
        {SEMESTERS.map((s) => <Check key={s} name="semesters" value={s} label={s} checked={p.semesters.includes(s)} />)}
      </div>
    </div>
  );
}

export function AmenityFields({ p }: P) {
  return (
    <>
      <Row label="Washer/dryer">
        <Choice name="washer" value="in-unit" label="In unit" current={p.washer} />
        <Choice name="washer" value="on-site" label="On-site is fine" current={p.washer} />
        <Choice name="washer" value="any" label="No preference" current={p.washer} />
      </Row>
      <Row label="Furnished">
        <Choice name="furnished" value="must" label="Must be" current={p.furnished} />
        <Choice name="furnished" value="prefer" label="Prefer" current={p.furnished} />
        <Choice name="furnished" value="any" label="Either" current={p.furnished} />
      </Row>
      <Row label="Utilities">
        <Choice name="utilities" value="must" label="Must be included" current={p.utilities} />
        <Choice name="utilities" value="prefer" label="Prefer included" current={p.utilities} />
        <Choice name="utilities" value="any" label="Don't mind" current={p.utilities} />
      </Row>
      <Row label="Bathroom" cols={2}>
        <Choice name="bath" value="private" label="Want my own" current={p.bath} />
        <Choice name="bath" value="any" label="Sharing is fine" current={p.bath} />
      </Row>
    </>
  );
}
