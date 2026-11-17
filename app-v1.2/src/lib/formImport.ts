// Turns the Google Form responses sheet (File > Download > CSV) into buyer
// profiles. Columns are found by the question titles in
// buyer-form/create_buyer_form.gs, so extra or reordered columns are fine.

import type { ImportedBuyer } from "./data/buyers";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

// Header text to look for (case-insensitive "starts with").
const COLS = {
  name: "full name",
  phone: "phone number",
  email: "email",
  social: "facebook or instagram",
  contact: "best way to contact",
  school: "school",
  contracts: "how many contracts",
  group: "are you looking with a group",
  gender: "housing type",
  approved: "do you need byu-approved",
  moveIn: "ideal move-in date",
  flex: "how flexible is your move-in",
  semesters: "which semesters",
  length: "preferred contract length",
  rent: "max rent",
  utilities: "utilities",
  bedroom: "bedroom",
  bathroom: "bathroom",
  furnished: "furnished",
  washer: "washer/dryer",
  areas: "areas you would live in",
  distance: "how close to campus",
  like: "complexes you like",
  avoid: "complexes you want to avoid",
  parking: "parking",
  pets: "pets",
  takeover: "open to lease takeovers",
  notes: "anything else",
  consent: "consent",
} as const;

function dateIso(v: string): string | null {
  v = v.trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

function rent(v: string): number | null {
  if (/800\s*\+/.test(v)) return null;
  const nums = [...v.matchAll(/\$?(\d{3,4})/g)].map((x) => Number(x[1]));
  return nums.length ? Math.max(...nums) : null;
}

const has = (v: string, s: string) => v.toLowerCase().includes(s);

export function rowsToProfiles(text: string): { profiles: ImportedBuyer[]; skipped: number; missing: string[] } {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length < 2) return { profiles: [], skipped: 0, missing: ["header row"] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {} as Record<keyof typeof COLS, number>;
  for (const [k, title] of Object.entries(COLS) as [keyof typeof COLS, string][]) {
    // "Housing type" appears twice; the first is men's/women's, the second is
    // "(check all you would consider)". Exact titles win over prefixes.
    idx[k] = header.findIndex((h) => h === title || (h.startsWith(title) && !(k === "gender" && h.includes("check all"))));
  }
  const missing = (["name", "gender", "rent", "moveIn"] as const).filter((k) => idx[k] < 0).map((k) => COLS[k]);
  if (missing.length) return { profiles: [], skipped: rows.length - 1, missing };

  const profiles: ImportedBuyer[] = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const get = (k: keyof typeof COLS) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
    const name = get("name");
    if (!name || (idx.consent >= 0 && !get("consent"))) { skipped++; continue; }
    const contact = get("contact");
    const phone = get("phone") || null;
    const email = get("email") || null;
    const wantsText = /text|call/i.test(contact);
    const alerts = phone && wantsText ? (email ? "both" : "text") : email ? "email" : phone ? "text" : "off";
    const g = get("gender");
    const flex = get("flex");
    const len = get("length");
    const dist = get("distance");
    const park = get("parking");
    profiles.push({
      name,
      email,
      phone,
      social: get("social") || null,
      contact_method: contact || null,
      school: get("school") || null,
      contracts_needed: Number.parseInt(get("contracts")) || 1,
      group_pref: has(get("group"), "same unit") ? "same-unit" : has(get("group"), "same complex") ? "same-complex" : "solo",
      gender: g.startsWith("Men") ? "men" : g.startsWith("Women") ? "women" : "any",
      needs_approved: get("approved") === "Yes" ? "yes" : get("approved") === "No" ? "no" : "unsure",
      move_in: dateIso(get("moveIn")),
      flex_days: has(flex, "exact") ? 0 : has(flex, "week") && !has(flex, "2") ? 7 : has(flex, "2") ? 21 : has(flex, "very") ? 60 : 14,
      semesters: get("semesters").split(/,\s*/).filter(Boolean),
      term: has(len, "one semester") ? "one-semester" : has(len, "fall") ? "fall-winter" : has(len, "spring") ? "spring-summer" : has(len, "full") ? "full-year" : "any",
      max_rent: rent(get("rent")),
      utilities: has(get("utilities"), "must") ? "must" : has(get("utilities"), "prefer") ? "prefer" : "any",
      room: has(get("bedroom"), "private") ? "private" : has(get("bedroom"), "shared room") ? "shared" : "any",
      bath: has(get("bathroom"), "private") ? "private" : "any",
      furnished: has(get("furnished"), "must") ? "must" : has(get("furnished"), "prefer") ? "prefer" : "any",
      washer: has(get("washer"), "in the unit") ? "in-unit" : has(get("washer"), "on-site") ? "on-site" : "any",
      areas: get("areas").split(/,\s*/).filter(Boolean),
      distance: has(dist, "walking") ? "walk" : has(dist, "10 min") ? "drive10" : has(dist, "20 min") ? "drive20" : "any",
      like_names: get("like"),
      avoid_names: get("avoid"),
      parking: has(park, "don") || !park ? "none" : has(park, "covered") ? "covered" : "need",
      pets: has(get("pets"), "emotional") ? "esa" : has(get("pets"), "have a pet") ? "pet" : "none",
      takeover_ok: has(get("takeover"), "no,") ? "no" : has(get("takeover"), "maybe") ? "maybe" : "yes",
      notes: get("notes") || null,
      alerts,
      active: 1,
      complete: 1,
    });
  }
  return { profiles, skipped, missing: [] };
}
