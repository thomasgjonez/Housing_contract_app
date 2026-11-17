import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { likedListings, listingStats, listingsBySeller } from "@/lib/data/listings";
import { unsave } from "@/lib/actions/swipes";
import { ListingCard } from "@/components/ListingCard";
import { profileForUser } from "@/lib/data/buyers";
import { preferenceChips } from "@/lib/preferences";

export default async function Me() {
  const user = await requireUser("/me");
  const mine = listingsBySeller(user.id);
  const saved = likedListings(user.id);
  const profile = profileForUser(user.id);

  return (
    <div className="space-y-10">
      <section className="card flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="font-bold">Buyer profile {profile && !profile.active && <span className="chip ml-1">Paused</span>}</div>
          {profile ? (
            <div className="mt-1 flex flex-wrap gap-1.5">{preferenceChips(profile).map((c) => <span key={c} className="chip">{c}</span>)}</div>
          ) : (
            <p className="text-sm text-slate-600">Looking for a contract? Tell us once what you need and get ranked matches and alerts.</p>
          )}
        </div>
        <Link href="/profile" className="btn-ghost !py-1.5">{profile ? "Edit" : "Set up"}</Link>
        {profile && <Link href="/match" className="btn-primary !py-1.5">See matches</Link>}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h1 className="text-2xl font-extrabold">My listings</h1>
          <Link href="/sell" className="btn-primary !py-1.5">+ New listing</Link>
        </div>
        {mine.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">You haven&apos;t listed a contract.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((l) => {
              const s = listingStats(l.id);
              return (
                <div key={l.id} className="space-y-2">
                  <ListingCard l={l} />
                  <div className="flex gap-3 px-1 text-sm text-slate-600">
                    <span>♥ {s.saves} saved</span>
                    <span>✉ {s.chats} {s.chats === 1 ? "conversation" : "conversations"}</span>
                    <Link href={`/listings/${l.id}`} className="ml-auto font-semibold text-brand-600">Manage</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Saved</h2>
        {saved.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">
            Nothing saved yet. <Link href="/match" className="font-semibold text-brand-600">Start swiping</Link>.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((l) => (
              <div key={l.id} className="space-y-2">
                <ListingCard l={l} />
                <form action={unsave.bind(null, l.id)} className="px-1 text-right">
                  <button className="text-sm text-slate-500 hover:text-rose-600">Remove</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
