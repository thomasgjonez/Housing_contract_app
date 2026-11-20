import { requireAdmin } from "@/lib/auth";
import { allComplexes } from "@/lib/data/complexes";
import { listingCounts } from "@/lib/data/listings";
import { accountCount } from "@/lib/data/users";
import { deleteSamples, updateComplex } from "@/lib/actions/admin";
import { ComplexLocations } from "./ComplexLocations";

export default async function Admin() {
  await requireAdmin();
  const complexes = await allComplexes();
  const counts = await listingCounts();
  const users = { n: await accountCount() };
  const samples = counts.filter((c) => c.source === "sample").reduce((a, c) => a + c.n, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <a href="/admin/buyers" className="btn-primary !py-1.5">Buyers and matching →</a>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-sm text-slate-500">Accounts</div><div className="font-display text-3xl font-bold">{users.n}</div></div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Listings by source and status</div>
          <ul className="mt-1 text-sm">{counts.map((c) => <li key={c.source + c.status}>{c.source} · {c.status}: <b>{c.n}</b></li>)}</ul>
        </div>
        <div className="card space-y-2 p-5">
          <div className="text-sm text-slate-500">Sample listings</div>
          <div className="font-display text-3xl font-bold">{samples}</div>
          {samples > 0 && (
            <form action={deleteSamples}><button className="btn-ghost !py-1.5 text-rose-700">Delete all samples</button></form>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Complex locations</h2>
        <p className="text-sm text-slate-600">Starting pins are approximate. Pick a complex, then click its real spot on the map. Verified pins turn green in the list.</p>
        <ComplexLocations complexes={complexes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Complex details</h2>
        <p className="text-sm text-slate-600">The property-management software field is for the later Entrata integration.</p>
        <div className="card divide-y divide-slate-100">
          {complexes.map((c) => (
            <form key={c.id} action={updateComplex} className="grid items-center gap-2 p-3 sm:grid-cols-[1.5fr_auto_1.2fr_1fr_auto]">
              <input type="hidden" name="id" value={c.id} />
              <div className="flex gap-2">
                <input name="name" defaultValue={c.name} className="input" />
                <select name="city" defaultValue={c.city} className="input !w-32">
                  {["Provo", "Orem", "Vineyard", "Springville", "Lehi / American Fork"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm whitespace-nowrap"><input type="checkbox" name="byuApproved" defaultChecked={!!c.byu_approved} /> BYU-approved</label>
              <input name="managementCompany" defaultValue={c.management_company ?? ""} placeholder="Management company" className="input" />
              <input name="pms" defaultValue={c.pms ?? ""} placeholder="Software (e.g. Entrata)" className="input" />
              <button className="btn-ghost !py-2">Save</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
