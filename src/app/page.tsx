import Link from "next/link";
import { recentListings } from "@/lib/data/listings";
import { ListingCard } from "@/components/ListingCard";

const STEPS = [
  ["Tell us what you need", "Your dealbreakers and nice-to-haves, once. We rank every contract for you."],
  ["Swipe, browse or get alerted", "Swipe or use the grid. When a strong match is posted, we let you know."],
  ["Message the seller", "Chat in the app, then finish the transfer with the complex."],
];

export default async function Home() {
  const recent = await recentListings(6);
  return (
    <div className="space-y-14">
      <section className="pt-10 md:pt-16">
        <p className="text-sm font-medium text-slate-600">Housing contracts near BYU and UVU</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-[1.08] md:text-6xl">
          Sell your Provo contract without the <span className="text-sunset-500">Facebook scroll.</span>
        </h1>
        <p className="mt-4 max-w-xl text-slate-600 md:text-lg">
          Every contract for sale in one place. Buyers swipe through the ones that fit; sellers post in under three minutes.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/profile" className="btn-primary !px-6 !py-3">Get matched</Link>
          <Link href="/find" className="btn-ghost !px-6 !py-3">Quick search</Link>
          <Link href="/sell" className="btn-sunset !px-6 !py-3">List your contract</Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {STEPS.map(([t, d], i) => (
          <div key={t} className="flex gap-4 rounded-[28px] bg-white/70 p-5 ring-1 ring-brand-100">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-sm font-semibold text-white">{i + 1}</span>
            <div>
              <div className="font-display font-semibold">{t}</div>
              <div className="mt-1 text-sm text-slate-600">{d}</div>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold">Newest contracts</h2>
          <Link href="/map" className="text-sm font-semibold text-brand-600 hover:text-sunset-600">See all on the map →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      </section>
    </div>
  );
}
