"use client";

import dynamic from "next/dynamic";
import { useActionState, useRef, useState } from "react";
import { createListing } from "@/lib/actions/listings";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-56 rounded-2xl bg-slate-100" />,
});

const STEPS = ["Your place", "Dates & price", "Photos", "Contact & post"];

export function SellForm({
  complexes,
  campus,
  isAdmin,
  phone,
}: {
  complexes: { id: number; name: string }[];
  campus: { lat: number; lng: number };
  isAdmin: boolean;
  phone: string;
}) {
  const [state, action, pending] = useActionState(createListing, undefined);
  const [step, setStep] = useState(0);
  const [complex, setComplex] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [summary, setSummary] = useState<[string, string][]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function goNext() {
    const fields = stepRefs.current[step]?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select, textarea") ?? [];
    for (const f of fields) if (!f.reportValidity()) return;
    if (step === 0 && complex === "other" && !pin) {
      alert("Tap the map to place your complex.");
      return;
    }
    if (step === 1) {
      const fd = new FormData(formRef.current!);
      if (String(fd.get("endDate")) <= String(fd.get("startDate"))) {
        alert("The end date has to be after the start date.");
        return;
      }
    }
    if (step === 2) {
      const fd = new FormData(formRef.current!);
      const name = complex === "other" ? String(fd.get("newComplexName")) : complexes.find((c) => String(c.id) === complex)?.name ?? "";
      setSummary([
        ["Complex", name + (fd.get("unit") ? `, ${fd.get("unit")}` : "")],
        ["Housing", `${fd.get("gender")}, ${fd.get("room")} room`],
        ["Rent", `$${fd.get("rent")}/month`],
        ["Dates", `${fd.get("startDate")} to ${fd.get("endDate")}`],
        ["Photos", String(previews.length)],
      ]);
    }
    setStep((s) => s + 1);
  }

  return (
    <form ref={formRef} action={action} className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">List your contract</h1>
        <p className="text-slate-600">Four quick steps. You can change or remove it anytime.</p>
      </div>

      <ol className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-full px-2 py-1.5 ${i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
            {s}
          </li>
        ))}
      </ol>

      {/* Step 1 */}
      <div ref={(el) => { stepRefs.current[0] = el; }} className={`card space-y-4 p-5 ${step === 0 ? "" : "hidden"}`}>
        <label className="block">
          <span className="label">Complex</span>
          <select name="complexId" required className="input" value={complex} onChange={(e) => setComplex(e.target.value)}>
            <option value="" disabled>Pick your complex</option>
            {complexes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="other">Not listed: add it</option>
          </select>
        </label>
        {complex === "other" && (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
            <input name="newComplexName" required placeholder="Complex name" className="input" />
            <input name="newComplexAddress" placeholder="Street address (optional)" className="input" />
            <select name="newComplexCity" defaultValue="Provo" className="input">
              {["Provo", "Orem", "Vineyard", "Springville", "Lehi / American Fork"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="newComplexApproved" /> BYU-approved housing</label>
            <div className="text-sm text-slate-600">Tap the map where your complex is.</div>
            <LocationPicker center={campus} value={pin} onChange={setPin} />
            <input type="hidden" name="lat" value={pin?.lat ?? ""} />
            <input type="hidden" name="lng" value={pin?.lng ?? ""} />
          </div>
        )}
        <label className="block">
          <span className="label">Unit or room (optional)</span>
          <input name="unit" placeholder="e.g. Apt 214, Room B" className="input" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Housing</span>
            <select name="gender" required defaultValue="" className="input">
              <option value="" disabled>Choose</option>
              <option value="women">Women&apos;s</option>
              <option value="men">Men&apos;s</option>
              <option value="coed">Coed</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Room</span>
            <select name="room" required defaultValue="" className="input">
              <option value="" disabled>Choose</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="label">Contracts available</span>
          <select name="contractsAvailable" defaultValue="1" className="input">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 6 ? "6+" : n}</option>)}
          </select>
          <span className="mt-1 block text-xs text-slate-500">More than 1 if you&apos;re selling together with a roommate.</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Bathroom</span>
            <select name="bath" defaultValue="shared" className="input">
              <option value="shared">Shared</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Washer/dryer</span>
            <select name="washer" defaultValue="on-site" className="input">
              <option value="in-unit">In the unit</option>
              <option value="on-site">On-site laundry</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="furnished" defaultChecked /> Furnished</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="pets" /> Pets allowed</label>
        </div>
        <p className="text-xs text-slate-500">These help us match you with buyers who want exactly this.</p>
      </div>

      {/* Step 2 */}
      <div ref={(el) => { stepRefs.current[1] = el; }} className={`card space-y-4 p-5 ${step === 1 ? "" : "hidden"}`}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Rent ($/month)</span>
            <input name="rent" type="number" required min={50} max={5000} className="input" placeholder="e.g. 550" />
          </label>
          <label className="block">
            <span className="label">Deposit ($, optional)</span>
            <input name="deposit" type="number" min={0} className="input" />
          </label>
        </div>
        <label className="block">
          <span className="label">Contract term</span>
          <select name="term" required defaultValue="" className="input">
            <option value="" disabled>Choose</option>
            <option value="fall-winter">Fall-Winter</option>
            <option value="spring-summer">Spring-Summer</option>
            <option value="full-year">Full year</option>
            <option value="other">Other</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Available from</span>
            <input name="startDate" type="date" required className="input" />
          </label>
          <label className="block">
            <span className="label">Contract ends</span>
            <input name="endDate" type="date" required className="input" />
          </label>
        </div>
        <label className="block">
          <span className="label">Sweetener (optional)</span>
          <input name="incentive" placeholder='e.g. "$100 off first month" or "I pay the transfer fee"' className="input" />
          <span className="mt-1 block text-xs text-slate-500">Listings with an incentive get a small boost in buyers&apos; matches.</span>
        </label>
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="utilities" /> Utilities included</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="parking" /> Parking included</label>
        </div>
      </div>

      {/* Step 3 */}
      <div ref={(el) => { stepRefs.current[2] = el; }} className={`card space-y-4 p-5 ${step === 2 ? "" : "hidden"}`}>
        <label className="block">
          <span className="label">Photos (up to 8)</span>
          <input
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="input"
            onChange={(e) => setPreviews([...(e.target.files ?? [])].slice(0, 8).map((f) => URL.createObjectURL(f)))}
          />
        </label>
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {previews.map((src) => <img key={src} src={src} alt="" className="h-20 w-full rounded-2xl object-cover" />)}
          </div>
        )}
        <label className="block">
          <span className="label">Description</span>
          <textarea name="description" rows={4} className="input" placeholder="Why you're leaving, roommates, what's nice about the place…" />
        </label>
      </div>

      {/* Step 4 */}
      <div ref={(el) => { stepRefs.current[3] = el; }} className={`card space-y-4 p-5 ${step === 3 ? "" : "hidden"}`}>
        <label className="block">
          <span className="label">Phone (optional, only saved to your account)</span>
          <input name="phone" defaultValue={phone} className="input" placeholder="Buyers message you in the app either way" />
        </label>
        <label className="block">
          <span className="label">Note for buyers (optional)</span>
          <input name="contactNote" className="input" placeholder='e.g. "Free to show it any evening"' />
        </label>
        {isAdmin && (
          <label className="flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            <input type="checkbox" name="seeded" /> Admin: I&apos;m posting this for a seller who gave permission
          </label>
        )}
        <dl className="divide-y divide-slate-100 rounded-2xl bg-slate-50 text-sm">
          {summary.map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-2"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
      </div>

      {state?.error && <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">{state.error}</div>}

      <div className="flex justify-between">
        <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
        {step < STEPS.length - 1 ? (
          // Separate keys so React swaps the element; reusing it would turn the
          // clicked Next button into a submit button mid-click and post early.
          <button key="next" type="button" className="btn-primary" onClick={goNext}>Next</button>
        ) : (
          <button key="post" type="submit" className="btn-primary" disabled={pending}>{pending ? "Posting…" : "Post my contract"}</button>
        )}
      </div>
    </form>
  );
}
