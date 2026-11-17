import Link from "next/link";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth";
import { currentPreferences } from "@/lib/currentPreferences";
import { matchListings } from "@/lib/data/listings";
import { newMatchesForUser } from "@/lib/data/buyers";
import { likedIds } from "@/lib/data/swipes";
import { quizQuery } from "@/lib/preferences";
import { PreferencesBar } from "@/components/PreferencesBar";
import { SwipeDeck } from "./SwipeDeck";
import { MatchGrid } from "./MatchGrid";
import { PickDefaultView, RememberView } from "./ViewChooser";

type View = "swipe" | "grid";
const asView = (v: string | undefined): View | null => (v === "grid" || v === "swipe" ? v : null);

export default async function Match({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const fromUrl = asView(sp.v);
  const view = fromUrl ?? asView((await cookies()).get("matchView")?.value);
  if (!view) return <PickDefaultView />;

  const user = await currentUser();
  const { prefs, source, profile } = currentPreferences(sp, user);
  const all = matchListings(prefs, { userId: user?.id });
  const deck = user ? matchListings(prefs, { userId: user.id, excludeSwiped: true }) : all;
  const liked = user ? likedIds(user.id) : [];
  const fresh = user ? newMatchesForUser(user.id).map((m) => m.listing_id) : [];

  // Swipe and Grid share the same preferences (and the same likes).
  const q = source === "url" ? quizQuery(prefs) : "";
  const link = (v: View) => `/match?${new URLSearchParams([...new URLSearchParams(q), ["v", v]]).toString()}`;

  return (
    <div>
      {fromUrl && <RememberView view={fromUrl} />}
      {sp.saved && (
        <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          Profile saved. These are ranked for you, and we&apos;ll alert you when a strong new match is posted.
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
          <Link href={link("swipe")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${view === "swipe" ? "bg-brand-600 text-white" : "text-slate-600"}`}>♥ Swipe</Link>
          <Link href={link("grid")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${view === "grid" ? "bg-brand-600 text-white" : "text-slate-600"}`}>▦ Grid</Link>
        </div>
        {fresh.length > 0 && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
            {fresh.length} new {fresh.length === 1 ? "match" : "matches"}
          </span>
        )}
      </div>

      <PreferencesBar prefs={prefs} source={source} view="match" count={all.length} />

      {source === "url" && profile?.active ? (
        <div className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          Showing the filters from this link. <Link href={`/match?v=${view}`} className="font-semibold underline">Back to your profile matches</Link>
        </div>
      ) : source === "profile" && !profile?.complete ? (
        <div className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          Ranked from your quick answers. <Link href="/profile" className="font-semibold underline">Finish your profile</Link> to rank by favorite complexes, amenities and semesters too.
        </div>
      ) : source !== "profile" ? (
        <div className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          Picky about what you need? <Link href={user ? "/profile" : "/find"} className="font-semibold underline">{user ? "Build a buyer profile" : "Answer a few questions"}</Link> to rank every listing for you{user ? " and get alerts when a match is posted" : ""}.
        </div>
      ) : null}

      {view === "grid" ? (
        <MatchGrid cards={all} liked={liked} fresh={fresh} loggedIn={!!user} />
      ) : (
        <SwipeDeck key={deck.map((c) => c.id).join(",")} cards={deck} loggedIn={!!user} totalMatches={all.length} fresh={fresh} />
      )}
    </div>
  );
}
