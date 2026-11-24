// What a buyer is looking for. One shape for the quick quiz, the full buyer
// profile, imported Google Form answers and shared links. The quiz is just the
// first few fields (QUIZ_FIELDS); the profile form asks all of them.
//
// No database code here, so client components can use it too.

import { GENDER_LABEL, TERM_LABEL, dateLabel } from "./format";

export type BuyerPreferences = {
  gender: "men" | "women" | "any";
  needs_approved: "yes" | "no" | "unsure";
  move_in: string | null; // YYYY-MM-DD
  flex_days: number;
  term: "fall-winter" | "spring-summer" | "full-year" | "one-semester" | "any";
  semesters: string[]; // ["Fall", "Winter"]
  max_rent: number | null;
  utilities: "must" | "prefer" | "any";
  room: "private" | "shared" | "any";
  bath: "private" | "any";
  furnished: "must" | "prefer" | "any";
  washer: "in-unit" | "on-site" | "any";
  areas: string[]; // ["Provo", "Orem"]
  distance: "walk" | "drive10" | "drive20" | "any";
  like_ids: number[]; // complex ids
  avoid_ids: number[]; // complex ids
  parking: "need" | "covered" | "none";
  pets: "pet" | "esa" | "none";
  contracts_needed: number; // 1-6, how many contracts this buyer (and their group) need
};

export const DEFAULT_PREFERENCES: BuyerPreferences = {
  gender: "any",
  needs_approved: "unsure",
  move_in: null,
  flex_days: 14,
  term: "any",
  semesters: [],
  max_rent: null,
  utilities: "any",
  room: "any",
  bath: "any",
  furnished: "any",
  washer: "any",
  areas: [],
  distance: "any",
  like_ids: [],
  avoid_ids: [],
  parking: "none",
  pets: "none",
  contracts_needed: 1,
};

/** The short version of the profile. These go in the URL for shared links. */
export const QUIZ_FIELDS = [
  "gender", "room", "max_rent", "move_in", "term", "distance", "parking", "needs_approved", "contracts_needed",
] as const satisfies readonly (keyof BuyerPreferences)[];

export const OPTIONS = {
  gender: ["men", "women", "any"],
  needs_approved: ["yes", "no", "unsure"],
  term: ["fall-winter", "spring-summer", "full-year", "one-semester", "any"],
  utilities: ["must", "prefer", "any"],
  room: ["private", "shared", "any"],
  bath: ["private", "any"],
  furnished: ["must", "prefer", "any"],
  washer: ["in-unit", "on-site", "any"],
  distance: ["walk", "drive10", "drive20", "any"],
  parking: ["need", "covered", "none"],
  pets: ["pet", "esa", "none"],
} as const;

export const FLEX_OPTIONS = [0, 7, 14, 21, 60];
export const SEMESTERS = ["Fall", "Winter", "Spring", "Summer"];
export const AREAS = ["Provo", "Orem", "Vineyard", "Springville", "Lehi / American Fork"];

type Source = FormData | URLSearchParams | Record<string, string | string[] | undefined>;

function getAll(src: Source, key: string): string[] {
  if (src instanceof FormData || src instanceof URLSearchParams) {
    return src.getAll(key).filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
  }
  const v = src[key];
  const arr = Array.isArray(v) ? v : v === undefined ? [] : [v];
  return arr.map((s) => s.trim()).filter(Boolean);
}

function has(src: Source, key: string) {
  if (src instanceof FormData || src instanceof URLSearchParams) return src.has(key);
  return src[key] !== undefined;
}

function oneOf<T extends string>(v: string | undefined, options: readonly T[], fallback: T): T {
  return options.includes(v as T) ? (v as T) : fallback;
}

/**
 * Reads preferences from a form submission or URL. Fields that aren't present
 * keep their value from `base`, so the quiz can update just its fields of an
 * existing profile. Pass `fields` to only read some keys.
 */
export function parsePreferences(
  src: Source,
  base: BuyerPreferences = DEFAULT_PREFERENCES,
  fields: readonly (keyof BuyerPreferences)[] = Object.keys(DEFAULT_PREFERENCES) as (keyof BuyerPreferences)[]
): BuyerPreferences {
  const p: BuyerPreferences = { ...base };
  const first = (k: string) => getAll(src, k)[0];
  const set = <K extends keyof BuyerPreferences>(k: K, v: BuyerPreferences[K]) => {
    if (fields.includes(k) && has(src, k)) p[k] = v;
  };
  for (const k of Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]) {
    set(k, oneOf(first(k), OPTIONS[k] as readonly string[], DEFAULT_PREFERENCES[k]) as never);
  }
  const rent = Number(first("max_rent"));
  set("max_rent", rent > 0 ? Math.round(rent) : null);
  const moveIn = first("move_in");
  set("move_in", moveIn && /^\d{4}-\d{2}-\d{2}$/.test(moveIn) ? moveIn : null);
  const flex = Number(first("flex_days"));
  set("flex_days", FLEX_OPTIONS.includes(flex) ? flex : DEFAULT_PREFERENCES.flex_days);
  const contracts = Number(first("contracts_needed"));
  set("contracts_needed", Number.isInteger(contracts) && contracts >= 1 ? Math.min(6, contracts) : DEFAULT_PREFERENCES.contracts_needed);
  set("semesters", getAll(src, "semesters").filter((s) => SEMESTERS.includes(s)));
  set("areas", getAll(src, "areas"));
  const ids = (k: string) => [...new Set(getAll(src, k).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  set("like_ids", ids("like_ids"));
  set("avoid_ids", ids("avoid_ids"));
  return p;
}

/** Quiz fields that differ from the defaults, as a URL query string. */
export function quizQuery(p: BuyerPreferences): string {
  const q = new URLSearchParams();
  for (const k of QUIZ_FIELDS) {
    const v = p[k];
    if (v !== null && v !== DEFAULT_PREFERENCES[k]) q.set(k, String(v));
  }
  return q.toString();
}

/** True when the URL carries quiz answers (a shared link or a logged-out quiz). */
export function hasQuizParams(sp: Record<string, string | string[] | undefined>) {
  return QUIZ_FIELDS.some((k) => sp[k] !== undefined && sp[k] !== "");
}

export function preferenceChips(p: BuyerPreferences): string[] {
  const chips: string[] = [];
  if (p.gender !== "any") chips.push(`${GENDER_LABEL[p.gender]} housing`);
  if (p.room !== "any") chips.push(p.room === "private" ? "Private room" : "Shared room");
  if (p.max_rent) chips.push(`Up to $${p.max_rent}/mo`);
  if (p.move_in) chips.push(`Move in ${dateLabel(p.move_in)}${p.flex_days ? ` ±${p.flex_days}d` : ""}`);
  if (p.term !== "any") chips.push(TERM_LABEL[p.term]);
  if (p.needs_approved === "yes") chips.push("BYU-approved");
  if (p.distance === "walk") chips.push("Walking distance");
  if (p.distance === "drive10") chips.push("≤ 10 min drive");
  if (p.distance === "drive20") chips.push("≤ 20 min drive");
  if (p.parking !== "none") chips.push(p.parking === "covered" ? "Covered parking" : "Parking");
  if (p.washer === "in-unit") chips.push("W/D in unit");
  if (p.contracts_needed > 1) chips.push(`Needs ${p.contracts_needed} contracts`);
  return chips;
}
