import Link from "next/link";
import type { PreferenceSource } from "@/lib/currentPreferences";
import { preferenceChips, quizQuery, type BuyerPreferences } from "@/lib/preferences";

/** What the Match and Map pages are filtered by, with links to change it. */
export function PreferencesBar({
  prefs,
  source,
  view,
  count,
}: {
  prefs: BuyerPreferences;
  source: PreferenceSource;
  view: "match" | "map";
  count: number;
}) {
  const chips = preferenceChips(prefs);
  // Quiz answers in the URL carry over when switching views.
  const q = source === "url" ? quizQuery(prefs) : "";
  const other = view === "match" ? "map" : "match";
  const label = source === "profile" ? (count === 1 ? "match for your profile" : "matches for your profile") : count === 1 ? "listing" : "listings";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{count} {label}</span>
      {chips.length === 0 ? <span className="chip">No filters</span> : chips.map((c) => <span key={c} className="chip">{c}</span>)}
      <div className="ml-auto flex gap-2">
        <Link href={source === "profile" ? "/profile" : `/find?${q}`} className="btn-ghost !py-1.5">
          {source === "profile" ? "Edit profile" : "Edit filters"}
        </Link>
        <Link href={`/${other}${q ? `?${q}` : ""}`} className="btn-ghost !py-1.5">{other === "map" ? "Map view" : "Match view"}</Link>
      </div>
    </div>
  );
}
