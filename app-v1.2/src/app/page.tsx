import Link from "next/link";
import { recentListings } from "@/lib/data/listings";
import { ListingCard } from "@/components/ListingCard";

export default function Home() {
  const recent = recentListings(6);
  return (
    <div className="space-y-10">
      <section className="card overflow-hidden bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-white md:p-12">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
          Sell your Provo housing contract without the Facebook scroll.
        </h1>
        <p className="mt-3 max-w-xl text-white/85 md:text-lg">
          Every contract for sale in one place. Buyers swipe through the ones that fit; sellers post in under three minutes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile" className="btn bg-white text-brand-700 hover:bg-brand-50">Get matched</Link>
          <Link href="/find" className="btn bg-white/15 text-white ring-1 ring-white/40 hover:bg-white/25">Quick search</Link>
          <Link href="/sell" className="btn bg-white/15 text-white ring-1 ring-white/40 hover:bg-white/25">List your contract</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["1. Tell us what you need", "Your dealbreakers and nice-to-haves, once. We rank every contract for you."],
          ["2. Swipe, browse or get alerted", "Swipe or use the grid. When a strong match is posted, we let you know."],
          ["3. Message the seller", "Chat in the app, then finish the transfer with the complex."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <div className="font-bold">{t}</div>
            <div className="mt-1 text-sm text-slate-600">{d}</div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold">Newest contracts</h2>
          <Link href="/map" className="text-sm font-semibold text-brand-600">See all on the map →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      </section>
    </div>
  );
}
