"use client";

import Link from "next/link";
import { useState } from "react";
import { ListingPhoto } from "@/components/ListingPhoto";
import { GENDER_LABEL, TERM_LABEL, dateLabel } from "@/lib/format";
import { setLike } from "@/lib/actions/swipes";
import { ScoreBadge } from "@/components/ScoreBadge";

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
          <button key={k} onClick={() => setSort(k)} className={`rounded-full px-3 py-1 font-medium ${sort === k ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`}>{label}</button>
        ))}
        <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" checked={onlyLiked} onChange={(e) => setOnlyLiked(e.target.checked)} /> Liked only ({likes.size})</label>
      </div>
      {sorted.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-600">
          {onlyLiked ? "Nothing liked yet. Tap ♥ on a listing to save it." : "Nothing matches yet. New contracts get posted all the time, and we'll alert you."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <div key={c.id} className="card relative overflow-hidden">
              <Link href={`/listings/${c.id}`} className="block">
                <ListingPhoto photo={c.photo} complex={c.complex} id={c.id} className="h-40 w-full" />
                <div className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold">${c.rent_monthly}<span className="text-sm font-normal text-slate-500">/mo</span></span>
                    <div className="flex items-center gap-1">
                      {fresh.includes(c.id) && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">New</span>}
                      {c.source === "sample" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Sample</span>}
                      <ScoreBadge score={c.score} />
                    </div>
                  </div>
                  <div className="font-semibold">{c.complex}</div>
                  <div className="text-sm text-slate-600">{GENDER_LABEL[c.housing_gender]} · {c.room_type === "private" ? "Private" : "Shared"} · {c.walk_minutes} min walk</div>
                  <div className="text-sm text-slate-600">{TERM_LABEL[c.contract_term]}: {dateLabel(c.start_date)} to {dateLabel(c.end_date)}</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.reasons.map((r) => <span key={r} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">✓ {r}</span>)}
                  </div>
                </div>
              </Link>
              <button
                aria-label={likes.has(c.id) ? "Unlike" : "Like"}
                onClick={() => toggle(c.id)}
                className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-xl shadow ${likes.has(c.id) ? "text-rose-500" : "text-slate-400"}`}
              >
                {likes.has(c.id) ? "♥" : "♡"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
