"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ListingPhoto } from "@/components/ListingPhoto";
import { GENDER_LABEL, TERM_LABEL, dateLabel } from "@/lib/format";
import { resetSkips, swipe, unsave } from "@/lib/actions/swipes";
import { ScoreBadge } from "@/components/ScoreBadge";
import { WalkLine } from "@/components/WalkLine";
import { DatesPill, IncentivePill } from "@/components/ListingCard";
import { IconCheck, IconHeart, IconInfo, IconUndo, IconX } from "@/components/Icons";

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
      className="card absolute inset-0 flex cursor-grab flex-col p-2.5 active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() >= 0 ? 500 : -500, opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="card-inset relative h-[52%] shrink-0">
        <ListingPhoto photo={card.photo} complex={card.complex} id={card.id} className="h-full w-full" />
        <div className="absolute left-3 top-3 flex items-center gap-1">
          <ScoreBadge score={card.score} onPhoto />
          {isNew && <span className="rounded-full bg-sunset-500 px-2.5 py-1 text-xs font-bold text-white">New</span>}
          {card.source === "sample" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Sample</span>}
        </div>
        <motion.div style={{ opacity: likeOpacity }} className="absolute right-4 top-4 rotate-[8deg] rounded-full bg-brand-600 px-4 py-1.5 font-display text-lg font-bold text-white">Saved</motion.div>
        <motion.div style={{ opacity: skipOpacity }} className="absolute right-4 top-4 rotate-[-8deg] rounded-full bg-white px-4 py-1.5 font-display text-lg font-bold text-slate-700">Pass</motion.div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-2 pb-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-semibold">{card.complex}</div>
            <div className="text-sm text-slate-600">{GENDER_LABEL[card.housing_gender]} · {card.room_type === "private" ? "Private" : "Shared"} room</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-2xl font-bold">${card.rent_monthly}</div>
            <div className="text-xs text-slate-500">per month</div>
          </div>
        </div>
        <WalkLine minutes={card.walk_minutes} />
        <div className="flex flex-wrap gap-1.5">
          <DatesPill start={card.start_date} end={card.end_date} term={card.contract_term} />
          {card.incentive && <IncentivePill text={card.incentive} />}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {card.reasons.map((r) => <span key={r} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"><IconCheck /> {r}</span>)}
        </div>
        {card.description && <p className="line-clamp-2 text-sm text-slate-600">{card.description}</p>}
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
      <div className="relative h-[540px]">
        {next && (
          <div className="card absolute inset-0 translate-y-3 scale-[0.95] p-2.5 opacity-60">
            <div className="card-inset h-[52%]"><ListingPhoto photo={next.photo} complex={next.complex} id={next.id} className="h-full w-full" /></div>
          </div>
        )}
        <AnimatePresence>
          {card && <TopCard key={card.id} card={card} isNew={fresh.includes(card.id)} onDecide={decide} />}
        </AnimatePresence>
        {!card && (
          <div className="card absolute inset-0 grid place-items-center p-8 text-center">
            <div className="space-y-3">
              <div className="font-display text-xl font-semibold">{totalMatches === 0 ? "Nothing matches yet" : "You've seen every match"}</div>
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
        <div className="mt-6 flex items-center gap-3">
          <button aria-label="Undo" onClick={undo} disabled={!last} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-slate-600 ring-[1.5px] ring-brand-200 disabled:opacity-40"><IconUndo /></button>
          <button onClick={() => decide("skip")} className="btn-ghost h-14 flex-1 !text-[15px]"><IconX /> Pass</button>
          <button onClick={() => decide("like")} className="btn-primary h-14 flex-[2] !text-[15px]"><IconHeart /> Save this one</button>
          <Link aria-label="Details" href={`/listings/${card.id}`} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-slate-600 ring-[1.5px] ring-brand-200"><IconInfo /></Link>
        </div>
      )}

      {last?.dir === "like" && loggedIn && (
        <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-center text-sm text-brand-700">
          Saved {last.card.complex}. <Link className="font-semibold underline" href={`/listings/${last.card.id}#message`}>Message the seller →</Link>
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-2xl bg-sunset-50 p-3 text-center text-sm text-sunset-800">
          {notice} <Link className="font-semibold underline" href="/login?next=/match">Log in</Link>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-slate-500">Drag the card right to save, left to skip.</p>
    </div>
  );
}
