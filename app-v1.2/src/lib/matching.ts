// Buyer-to-listing matching. Pure functions, no database, so the same rules
// run for the swipe deck, the grid, the map, new-listing alerts and the admin
// buyer list.
//
// Step 1: hard filters. Anything that breaks a dealbreaker is dropped.
// Step 2: a weighted score (0-100) ranks what is left by the nice-to-haves.

import type { BuyerPreferences } from "./preferences";
import { addDays } from "./format";

export type { BuyerPreferences };

export type MatchableListing = {
  id: number;
  complex: string;
  complex_id: number;
  city?: string | null;
  byu_approved: number;
  housing_gender: "men" | "women" | "coed";
  room_type: "private" | "shared";
  rent_monthly: number;
  utilities_included: number;
  start_date: string;
  end_date: string;
  contract_term: string;
  incentive: string | null;
  parking: number;
  furnished?: number;
  washer_dryer?: string;
  private_bath?: number;
  pets_allowed?: number;
  walk_minutes: number;
};

export type MatchResult = { score: number; reasons: string[]; breakdown: Record<string, number> };

export type MatchContext = {
  // Complexes this buyer has swiped right on before. Small boost, so every
  // swipe teaches the ranking something.
  likedComplexIds?: Set<number>;
};

export const WEIGHTS = {
  price: 25,
  distance: 20,
  timing: 15,
  term: 10,
  favorite: 10,
  furnished: 5,
  washer: 5,
  utilities: 5,
  bath: 5,
} as const;

// Matches at or above this score trigger an alert when a listing is posted.
export const ALERT_MIN_SCORE = 70;

const DAY = 86400000;

function days(a: string, b: string) {
  return Math.round((Date.parse(a) - Date.parse(b)) / DAY);
}

/** Splits free text like "Liberty, the village" into names. */
export function nameList(text: string) {
  return text
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function norm(s: string) {
  return s.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]/g, "");
}

// "Liberty, the village" matches "Liberty Square" and "The Village at South
// Campus" (but not "Joaquin Village"). Short fragments are ignored.
// Used to turn Google Form answers into complex ids.
export function nameMatchesComplex(name: string, complex: string) {
  const c = norm(complex);
  const n = norm(name);
  return n.length >= 4 && (c.startsWith(n) || n.startsWith(c));
}

// Walking minutes a buyer will accept for each distance answer.
const DISTANCE_TARGET: Record<BuyerPreferences["distance"], number | null> = {
  walk: 10,
  drive10: 35,
  drive20: 70,
  any: null,
};

// Which semesters each listing term covers.
const TERM_SEMESTERS: Record<string, string[]> = {
  "fall-winter": ["Fall", "Winter"],
  "spring-summer": ["Spring", "Summer"],
  "full-year": ["Fall", "Winter", "Spring", "Summer"],
};

/** Returns the dealbreaker a listing fails, or null if it passes. */
export function dealbreaker(p: BuyerPreferences, l: MatchableListing): string | null {
  if (p.gender !== "any" && l.housing_gender !== p.gender && l.housing_gender !== "coed") return "housing";
  if (p.needs_approved === "yes" && !l.byu_approved) return "approved";
  if (p.max_rent && l.rent_monthly > p.max_rent) return "budget";
  if (p.room !== "any" && l.room_type !== p.room) return "room";
  if (p.utilities === "must" && !l.utilities_included) return "utilities";
  if (p.furnished === "must" && l.furnished === 0) return "furnished";
  if (p.parking !== "none" && !l.parking) return "parking";
  if (p.pets === "pet" && !l.pets_allowed) return "pets";
  if (p.move_in) {
    // Available by the move-in date (give or take the buyer's flexibility)
    // and at least a month left on the contract after it.
    if (l.start_date > addDays(p.move_in, p.flex_days)) return "move-in";
    if (l.end_date < addDays(p.move_in, 30)) return "move-in";
  }
  if (p.areas.length && l.city && !p.areas.some((a) => a.toLowerCase().startsWith(l.city!.toLowerCase().slice(0, 4)))) return "area";
  if (p.avoid_ids.includes(l.complex_id)) return "avoid";
  return null;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function scoreListing(p: BuyerPreferences, l: MatchableListing, ctx: MatchContext = {}): MatchResult | null {
  if (dealbreaker(p, l)) return null;
  const b: Record<string, number> = {};
  const reasons: [number, string][] = []; // [priority, text]

  // Price: full marks at 20% or more under budget, 40% of the points right at it.
  if (p.max_rent) {
    const under = p.max_rent - l.rent_monthly;
    b.price = WEIGHTS.price * (0.4 + 0.6 * clamp(under / (0.2 * p.max_rent)));
    if (under >= 25) reasons.push([under, `$${under} under budget`]);
  } else {
    b.price = WEIGHTS.price * (0.5 + 0.5 * clamp((750 - l.rent_monthly) / 400));
  }

  // Distance to campus.
  const target = DISTANCE_TARGET[p.distance];
  if (target) {
    b.distance = l.walk_minutes <= target ? WEIGHTS.distance : WEIGHTS.distance * clamp(1 - (l.walk_minutes - target) / target);
  } else {
    b.distance = WEIGHTS.distance * (0.6 + 0.4 * clamp(1 - l.walk_minutes / 40));
  }
  if (l.walk_minutes <= 10) reasons.push([60, `${l.walk_minutes} min walk`]);

  // Timing: available on or before move-in is perfect; starting later loses
  // up to half the points across the buyer's flexibility window.
  if (p.move_in) {
    const late = days(l.start_date, p.move_in);
    // Inside the buyer's flexibility window it keeps most of the points.
    b.timing = late <= 0 ? WEIGHTS.timing : WEIGHTS.timing * clamp(1 - (0.5 * late) / Math.max(1, p.flex_days));
    if (late <= 0 && late > -45) reasons.push([70, "Ready by your move-in date"]);
  } else b.timing = WEIGHTS.timing;

  // Contract term and semesters.
  const wanted = p.semesters;
  const covers = TERM_SEMESTERS[l.contract_term] ?? [];
  if (p.term !== "any" && p.term !== "one-semester") {
    b.term = l.contract_term === p.term ? WEIGHTS.term : 0;
    if (l.contract_term === p.term) reasons.push([40, "The contract length you want"]);
  } else if (wanted.length && covers.length) {
    b.term = WEIGHTS.term * (wanted.filter((s) => covers.includes(s)).length / wanted.length);
  } else b.term = WEIGHTS.term * 0.7;

  // Favorite complexes, plus complexes they already swiped right on.
  if (p.like_ids.includes(l.complex_id)) {
    b.favorite = WEIGHTS.favorite;
    reasons.push([95, "One of your favorite complexes"]);
  } else if (ctx.likedComplexIds?.has(l.complex_id)) {
    b.favorite = WEIGHTS.favorite * 0.6;
    reasons.push([50, "Like ones you saved"]);
  } else b.favorite = p.like_ids.length ? 0 : WEIGHTS.favorite * 0.5;

  const furnished = l.furnished !== 0;
  b.furnished = p.furnished === "prefer" && !furnished ? 0 : WEIGHTS.furnished;
  if (p.furnished !== "any" && furnished) reasons.push([20, "Furnished"]);

  const wd = l.washer_dryer ?? "on-site";
  if (p.washer === "in-unit") b.washer = wd === "in-unit" ? WEIGHTS.washer : wd === "on-site" ? WEIGHTS.washer * 0.3 : 0;
  else if (p.washer === "on-site") b.washer = wd === "none" ? 0 : WEIGHTS.washer;
  else b.washer = WEIGHTS.washer;
  if (wd === "in-unit") reasons.push([p.washer === "in-unit" ? 80 : 15, "Washer/dryer in unit"]);

  b.utilities = p.utilities === "prefer" && !l.utilities_included ? WEIGHTS.utilities * 0.2 : WEIGHTS.utilities;
  if (l.utilities_included) reasons.push([p.utilities === "any" ? 15 : 55, "Utilities included"]);

  b.bath = p.bath === "private" && !l.private_bath ? 0 : WEIGHTS.bath;
  if (l.private_bath) reasons.push([p.bath === "private" ? 75 : 15, "Private bathroom"]);

  if (l.incentive) reasons.push([65, l.incentive]);
  if (l.parking && p.parking === "none") reasons.push([10, "Parking included"]);

  let score = Object.values(b).reduce((a, n) => a + n, 0);
  if (l.incentive) score += 3;
  score = Math.min(100, Math.round(score));
  for (const k of Object.keys(b)) b[k] = Math.round(b[k]);

  return {
    score,
    reasons: reasons.sort((a, z) => z[0] - a[0]).slice(0, 3).map(([, r]) => r),
    breakdown: b,
  };
}

export function rank<L extends MatchableListing>(p: BuyerPreferences, listings: L[], ctx: MatchContext = {}) {
  const out: (L & MatchResult)[] = [];
  for (const l of listings) {
    const m = scoreListing(p, l, ctx);
    if (m) out.push({ ...l, ...m });
  }
  return out.sort((a, z) => z.score - a.score);
}
