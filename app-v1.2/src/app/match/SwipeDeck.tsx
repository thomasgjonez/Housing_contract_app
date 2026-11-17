"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ListingPhoto } from "@/components/ListingPhoto";
import { GENDER_LABEL, TERM_LABEL, dateLabel } from "@/lib/format";
import { resetSkips, swipe, unsave } from "@/lib/actions/swipes";
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
  incentive: string | null;
  description: string | null;
  source: string;
  reasons: string[];
  score: number;
};

const THRESHOLD = 110;

function TopCard({ card, isNew, onDecide }: { card: Card; isNew: boolean; onDecide: (dir: "like" | "skip") => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > THRESHOLD) onDecide("like");
    else if (info.offset.x < -THRESHOLD) onDecide("skip");
  }

  return (
    <motion.div
      className="card absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() >= 0 ? 500 : -500, opacity: 0, transition: { duration: 0.25 } }}
    >
      <ListingPhoto photo={card.photo} complex={card.complex} id={card.id} className="h-[55%] w-full" />
      <motion.div style={{ opacity: likeOpacity }} className="absolute left-5 top-5 rotate-[-12deg] rounded-lg border-4 border-emerald-500 px-3 py-1 text-2xl font-black text-emerald-500">SAVE</motion.div>
      <motion.div style={{ opacity: skipOpacity }} className="absolute right-5 top-5 rotate-[12deg] rounded-lg border-4 border-rose-500 px-3 py-1 text-2xl font-black text-rose-500">SKIP</motion.div>
      <div className="space-y-2 p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold">${card.rent_monthly}<span className="text-base font-normal text-slate-500">/mo</span></span>
          <span className="flex items-center gap-1">
            {isNew && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">New</span>}
            {card.source === "sample" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Sample</span>}
            <ScoreBadge score={card.score} />
          </span>
        </div>
        <div className="text-lg font-bold">{card.complex}</div>
        <div className="text-sm text-slate-600">
          {GENDER_LABEL[card.housing_gender]} · {card.room_type === "private" ? "Private" : "Shared"} room · {card.walk_minutes} min walk
        </div>
        <div className="text-sm text-slate-600">{TERM_LABEL[card.contract_term]}: {dateLabel(card.start_date)} to {dateLabel(card.end_date)}</div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {card.reasons.map((r) => <span key={r} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">✓ {r}</span>)}
        </div>
        {card.description && <p className="line-clamp-2 text-sm text-slate-700">{card.description}</p>}
      </div>
    </motion.div>
  );
}

export function SwipeDeck({ cards, loggedIn, totalMatches, fresh = [] }: { cards: Card[]; loggedIn: boolean; totalMatches: number; fresh?: number[] }) {
  const [index, setIndex] = useState(0);
  const [last, setLast] = useState<{ card: Card; dir: "like" | "skip" } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const card = cards[index];
  const next = cards[index + 1];

  function decide(dir: "like" | "skip") {
    if (!card) return;
    setLast({ card, dir });
    setIndex((i) => i + 1);
    if (dir === "like") {
      setNotice(loggedIn ? null : "Log in to keep your saved listings and message sellers.");
    }
    if (loggedIn) void swipe(card.id, dir);
  }

  function undo() {
    if (!last) return;
    setIndex((i) => Math.max(0, i - 1));
    if (loggedIn) void unsave(last.card.id);
    setLast(null);
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="relative h-[520px]">
        {next && (
          <div className="card absolute inset-0 translate-y-2 scale-[0.97] overflow-hidden opacity-70">
            <ListingPhoto photo={next.photo} complex={next.complex} id={next.id} className="h-[55%] w-full" />
          </div>
        )}
        <AnimatePresence>
          {card && <TopCard key={card.id} card={card} isNew={fresh.includes(card.id)} onDecide={decide} />}
        </AnimatePresence>
        {!card && (
          <div className="card absolute inset-0 grid place-items-center p-8 text-center">
            <div className="space-y-3">
              <div className="text-4xl">🏁</div>
              <div className="text-lg font-bold">{totalMatches === 0 ? "Nothing matches yet" : "You've seen every match"}</div>
              <p className="text-sm text-slate-600">
                {totalMatches === 0 ? "Try loosening a filter, or check back soon. New contracts get posted all the time." : "Check your saved listings, or see the ones you skipped again."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/match?v=grid" className="btn-ghost">Grid view</Link>
                {loggedIn && totalMatches > 0 && (
                  <button className="btn-ghost" onClick={() => void resetSkips()}>Show skipped</button>
                )}
                {loggedIn && <Link href="/me" className="btn-primary">Saved listings</Link>}
              </div>
            </div>
          </div>
        )}
      </div>

      {card && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button aria-label="Skip" onClick={() => decide("skip")} className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl text-rose-500 shadow ring-1 ring-slate-200 hover:scale-105">✕</button>
          <button aria-label="Undo" onClick={undo} disabled={!last} className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg text-slate-500 shadow ring-1 ring-slate-200 disabled:opacity-40">↺</button>
          <Link aria-label="Details" href={`/listings/${card.id}`} className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg text-slate-500 shadow ring-1 ring-slate-200">i</Link>
          <button aria-label="Save" onClick={() => decide("like")} className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl text-emerald-500 shadow ring-1 ring-slate-200 hover:scale-105">♥</button>
        </div>
      )}

      {last?.dir === "like" && loggedIn && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-800">
          Saved {last.card.complex}. <Link className="font-semibold underline" href={`/listings/${last.card.id}#message`}>Message the seller →</Link>
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-800">
          {notice} <Link className="font-semibold underline" href="/login?next=/match">Log in</Link>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-slate-500">Drag the card right to save, left to skip.</p>
    </div>
  );
}
