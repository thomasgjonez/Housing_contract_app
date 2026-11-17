"use client";

import Link from "next/link";
import { useState } from "react";
import { ListingPhoto } from "@/components/ListingPhoto";
import { GENDER_LABEL, TERM_LABEL, dateLabel } from "@/lib/format";
import { setLike } from "@/lib/actions/swipes";
import { ScoreBadge } from "@/components/ScoreBadge";
import { WalkLine } from "@/components/WalkLine";
import { DatesPill } from "@/components/ListingCard";
import { IconCheck, IconHeart } from "@/components/Icons";

type Card = {
  id: number;
  complex: string;
  photo: string | null;
  rent_monthly: number;
  housing_gender: string;
  room_type: string;
  start_date: string;
  end_date: string;
  contract_term: string;
  walk_minutes: number;
  source: string;
  score: number;
  reasons: string[];
};

type Sort = "match" | "price" | "walk" | "date";

export function MatchGrid({ cards, liked, fresh, loggedIn }: { cards: Card[]; liked: number[]; fresh: number[]; loggedIn: boolean }) {
  const [likes, setLikes] = useState(() => new Set(liked));
  const [sort, setSort] = useState<Sort>("match");
  const [onlyLiked, setOnlyLiked] = useState(false);

  function toggle(id: number) {
    if (!loggedIn) {
      window.location.href = "/login?next=/match?v=grid";
      return;
    }
    const next = new Set(likes);
    const on = !next.has(id);
    if (on) next.add(id);
    else next.delete(id);
    setLikes(next);
    void setLike(id, on);
  }

  const sorted = [...cards]
    .filter((c) => !onlyLiked || likes.has(c.id))
    .sort((a, b) =>
      sort === "price" ? a.rent_monthly - b.rent_monthly
      : sort === "walk" ? a.walk_minutes - b.walk_minutes
      : sort === "date" ? a.start_date.localeCompare(b.start_date)
      : b.score - a.score
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Sort</span>
        {([["match", "Best match"], ["price", "Price"], ["walk", "Walk"], ["date", "Move-in"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setSort(k)} className={`rounded-full px-4 py-1.5 font-medium transition ${sort === k ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-[1.5px] ring-brand-100 hover:bg-brand-50"}`}>{label}</button>
        ))}
        <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" checked={onlyLiked} onChange={(e) => setOnlyLiked(e.target.checked)} /> Liked only ({likes.size})</label>
      </div>
      {sorted.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-600">
          {onlyLiked ? "Nothing liked yet. Tap ♥ on a listing to save it." : "Nothing matches yet. New contracts get posted all the time, and we'll alert you."}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <div key={c.id} className="card group relative p-2.5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <Link href={`/listings/${c.id}`} className="block">
                <div className="card-inset relative">
                  <ListingPhoto photo={c.photo} complex={c.complex} id={c.id} className="h-40 w-full transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute left-3 top-3 flex items-center gap-1">
                    <ScoreBadge score={c.score} onPhoto />
                    {fresh.includes(c.id) && <span className="rounded-full bg-sunset-500 px-2.5 py-1 text-xs font-bold text-white">New</span>}
                    {c.source === "sample" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Sample</span>}
                  </div>
                </div>
                <div className="space-y-3 px-2 pb-2 pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg font-semibold">{c.complex}</div>
                      <div className="text-sm text-slate-600">{GENDER_LABEL[c.housing_gender]} · {c.room_type === "private" ? "Private" : "Shared"} room</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-xl font-bold">${c.rent_monthly}</div>
                      <div className="text-xs text-slate-500">per month</div>
                    </div>
                  </div>
                  <WalkLine minutes={c.walk_minutes} />
                  <div className="flex flex-wrap gap-1.5">
                    <DatesPill start={c.start_date} end={c.end_date} term={c.contract_term} />
                    {c.reasons.map((r) => <span key={r} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"><IconCheck /> {r}</span>)}
                  </div>
                </div>
              </Link>
              <button
                aria-label={likes.has(c.id) ? "Unlike" : "Like"}
                aria-pressed={likes.has(c.id)}
                onClick={() => toggle(c.id)}
                className={`absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full shadow-sm transition ${likes.has(c.id) ? "bg-sunset-500 text-white" : "bg-white/95 text-slate-500 hover:text-sunset-600"}`}
              >
                <IconHeart className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
