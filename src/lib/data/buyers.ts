import "server-only";
import { query, withTransaction } from "../db";
import { resolveComplexNames } from "../db/schema";
import { activeListings, getListing } from "./listings";
import { ALERT_MIN_SCORE, scoreListing } from "../matching";
import { DEFAULT_PREFERENCES, type BuyerPreferences } from "../preferences";
import { sendMatchAlert } from "../notify";

/** Who the buyer is and how to reach them. */
export type BuyerContact = {
  name: string;
  email: string | null;
  phone: string | null;
  social: string | null;
  contact_method: string | null;
  school: string | null;
  contracts_needed: number;
  group_pref: string;
  takeover_ok: string;
  notes: string | null;
  alerts: "email" | "text" | "both" | "off";
};

export type ProfileInput = BuyerPreferences &
  BuyerContact & {
    active: number;
    complete: number;
    /** Complex names from the Google Form that matched no known complex. */
    unmatched_like?: string;
    unmatched_avoid?: string;
  };

export type BuyerProfile = ProfileInput & {
  id: number;
  user_id: number | null;
  source: "app" | "form";
  created_at: string;
  updated_at: string;
};

// Columns written from ProfileInput. Lists are stored comma-separated;
// favorite/avoid complexes live in buyer_complexes.
const COLUMNS = [
  "name", "email", "phone", "social", "contact_method", "school", "contracts_needed", "group_pref",
  "gender", "needs_approved", "move_in", "flex_days", "semesters", "term", "max_rent", "utilities",
  "room", "bath", "furnished", "washer", "areas", "distance", "parking", "pets", "takeover_ok",
  "notes", "alerts", "active", "complete", "like_complexes", "avoid_complexes",
] as const;

type Row = Omit<BuyerProfile, "semesters" | "areas" | "like_ids" | "avoid_ids" | "unmatched_like" | "unmatched_avoid"> & {
  semesters: string;
  areas: string;
  like_complexes: string;
  avoid_complexes: string;
};

const csv = (s: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);

async function hydrate(rows: Row[]): Promise<BuyerProfile[]> {
  if (!rows.length) return [];
  const { rows: links } = await query<{ profile_id: number; complex_id: number; kind: "like" | "avoid" }>(
    `SELECT profile_id, complex_id, kind FROM buyer_complexes WHERE profile_id IN (${rows.map((_, i) => `$${i + 1}`).join(",")})`,
    rows.map((r) => r.id)
  );
  return rows.map(({ like_complexes, avoid_complexes, ...r }) => ({
    ...r,
    semesters: csv(r.semesters),
    areas: csv(r.areas),
    like_ids: links.filter((x) => x.profile_id === r.id && x.kind === "like").map((x) => x.complex_id),
    avoid_ids: links.filter((x) => x.profile_id === r.id && x.kind === "avoid").map((x) => x.complex_id),
    unmatched_like: like_complexes,
    unmatched_avoid: avoid_complexes,
  }));
}

export async function profileForUser(userId: number): Promise<BuyerProfile | null> {
  const { rows } = await query<Row>("SELECT * FROM buyer_profiles WHERE user_id = $1", [userId]);
  return (await hydrate(rows))[0] ?? null;
}

export async function allProfiles(): Promise<BuyerProfile[]> {
  const { rows } = await query<Row>("SELECT * FROM buyer_profiles ORDER BY active DESC, updated_at DESC");
  return hydrate(rows);
}

async function activeProfiles(): Promise<BuyerProfile[]> {
  const { rows } = await query<Row>("SELECT * FROM buyer_profiles WHERE active = 1");
  return hydrate(rows);
}

/** Saves a profile and its favorite/avoid complexes. Returns the profile id. */
export async function upsertProfile(input: ProfileInput, key: { userId?: number; id?: number; source?: "app" | "form" }): Promise<number> {
  const values: Record<string, unknown> = {
    ...input,
    semesters: input.semesters.join(","),
    areas: input.areas.join(","),
    like_complexes: input.unmatched_like ?? "",
    avoid_complexes: input.unmatched_avoid ?? "",
  };
  const vals = COLUMNS.map((c) => values[c] ?? null);
  return withTransaction(async () => {
    let id = key.id ?? (key.userId ? (await profileForUser(key.userId))?.id : undefined);
    if (id) {
      await query(
        `UPDATE buyer_profiles SET ${COLUMNS.map((c, i) => `${c} = $${i + 1}`).join(", ")}, updated_at = now() WHERE id = $${COLUMNS.length + 1}`,
        [...vals, id]
      );
    } else {
      const { rows } = await query<{ id: number }>(
        `INSERT INTO buyer_profiles (user_id, source, ${COLUMNS.join(", ")})
         VALUES ($1, $2, ${COLUMNS.map((_, i) => `$${i + 3}`).join(", ")}) RETURNING id`,
        [key.userId ?? null, key.source ?? "app", ...vals]
      );
      id = rows[0].id;
    }
    await query("DELETE FROM buyer_complexes WHERE profile_id = $1", [id]);
    // A complex can't be both; avoid wins.
    for (const c of input.avoid_ids) {
      await query("INSERT INTO buyer_complexes (profile_id, complex_id, kind) VALUES ($1, $2, 'avoid') ON CONFLICT DO NOTHING", [id, c]);
    }
    for (const c of input.like_ids) {
      await query("INSERT INTO buyer_complexes (profile_id, complex_id, kind) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING", [id, c]);
    }
    return id;
  });
}

/** A fresh profile for a user, before they've answered anything. */
export function blankProfile(user: { name: string; email: string; phone: string | null }): ProfileInput {
  return {
    ...DEFAULT_PREFERENCES,
    name: user.name,
    email: user.email,
    phone: user.phone,
    social: null,
    contact_method: null,
    school: null,
    contracts_needed: 1,
    group_pref: "solo",
    takeover_ok: "yes",
    notes: null,
    alerts: "email",
    active: 1,
    complete: 0,
  };
}

// ---------- linking Google Form buyers to accounts ----------

const digits = (phone: string | null) => (phone ?? "").replace(/\D/g, "").slice(-10);

/**
 * If this user has no buyer profile yet, but a Google Form response came in
 * with their email or phone, attach that response to their account. Returns
 * true when a profile was linked.
 */
export async function linkFormProfile(user: { id: number; email: string; phone: string | null }) {
  if (await profileForUser(user.id)) return false;
  const { rows: candidates } = await query<{ id: number; email: string | null; phone: string | null }>(
    "SELECT id, email, phone FROM buyer_profiles WHERE source = 'form' AND user_id IS NULL"
  );
  const phone = digits(user.phone);
  const hit =
    candidates.find((c) => c.email && c.email.toLowerCase() === user.email.toLowerCase()) ??
    (phone.length === 10 ? candidates.find((c) => digits(c.phone) === phone) : undefined);
  if (!hit) return false;
  await query("UPDATE buyer_profiles SET user_id = $1 WHERE id = $2", [user.id, hit.id]);
  return true;
}

/** Links a form profile to an existing account with the same email or phone. */
async function linkToAccount(profileId: number, email: string | null, phone: string | null) {
  const { rows: users } = await query<{ id: number; email: string; phone: string | null }>(
    "SELECT id, email, phone FROM users WHERE id NOT IN (SELECT user_id FROM buyer_profiles WHERE user_id IS NOT NULL)"
  );
  const p = digits(phone);
  const hit =
    (email ? users.find((u) => u.email.toLowerCase() === email.toLowerCase()) : undefined) ??
    (p.length === 10 ? users.find((u) => digits(u.phone) === p) : undefined);
  if (hit) await query("UPDATE buyer_profiles SET user_id = $1 WHERE id = $2 AND user_id IS NULL", [hit.id, profileId]);
}

// ---------- Google Form import ----------

export type ImportedBuyer = Omit<ProfileInput, "like_ids" | "avoid_ids" | "unmatched_like" | "unmatched_avoid"> & {
  like_names: string;
  avoid_names: string;
};

/** Adds or updates form buyers, matched by email, phone, or (with neither) name. */
export async function importFormBuyers(buyers: ImportedBuyer[]) {
  let added = 0;
  let updated = 0;
  return withTransaction(async () => {
    const { rows: existing } = await query<{ id: number; name: string; email: string | null; phone: string | null }>(
      "SELECT id, name, email, phone FROM buyer_profiles WHERE source = 'form'"
    );
    for (const { like_names, avoid_names, ...b } of buyers) {
      const like = await resolveComplexNames(query, like_names);
      const avoid = await resolveComplexNames(query, avoid_names);
      const input: ProfileInput = {
        ...b,
        like_ids: like.ids,
        avoid_ids: avoid.ids,
        unmatched_like: like.unmatched,
        unmatched_avoid: avoid.unmatched,
      };
      const match = existing.find(
        (e) =>
          (b.email && e.email?.toLowerCase() === b.email.toLowerCase()) ||
          (b.phone && digits(e.phone) && digits(e.phone) === digits(b.phone)) ||
          (!b.email && !b.phone && !e.email && !e.phone && e.name === b.name)
      );
      const id = await upsertProfile(input, match ? { id: match.id } : { source: "form" });
      await linkToAccount(id, b.email, b.phone);
      if (match) updated++;
      else added++;
    }
    return { added, updated };
  });
}

export async function setProfileActive(id: number, active: boolean) {
  await query("UPDATE buyer_profiles SET active = $1, updated_at = now() WHERE id = $2", [active ? 1 : 0, id]);
}

export async function deleteSampleBuyers() {
  await query("DELETE FROM buyer_profiles WHERE email LIKE '%@sample.provo-contracts.local'");
}

// ---------- matching listings to buyers ----------

/**
 * Run a newly posted listing against every active buyer profile. Strong
 * matches are recorded and the buyer gets an alert (stubbed until email or
 * text is set up). Returns how many buyers matched at all and how many were
 * alerted.
 */
export async function matchNewListing(listingId: number) {
  const l = await getListing(listingId);
  if (!l || l.status !== "active") return { matched: 0, alerted: 0 };
  let matched = 0;
  let alerted = 0;
  for (const p of await activeProfiles()) {
    if (p.user_id === l.seller_id) continue;
    const m = scoreListing(p, l);
    if (!m) continue;
    matched++;
    if (m.score < ALERT_MIN_SCORE) continue;
    const { rowCount } = await query(
      "INSERT INTO matches (profile_id, listing_id, score, reasons) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [p.id, l.id, m.score, JSON.stringify(m.reasons)]
    );
    if (rowCount && p.alerts !== "off") {
      await sendMatchAlert(p, l, m);
      alerted++;
    }
  }
  return { matched, alerted };
}

/** Active buyers whose dealbreakers this listing passes, best first. */
export async function buyersForListing(listingId: number) {
  const l = await getListing(listingId);
  if (!l) return [];
  return (await activeProfiles())
    .filter((p) => p.user_id !== l.seller_id)
    .map((p) => ({ profile: p, match: scoreListing(p, l) }))
    .filter((x): x is { profile: BuyerProfile; match: NonNullable<typeof x.match> } => !!x.match)
    .sort((a, z) => z.match.score - a.match.score);
}

/** Best few listings for each profile (admin buyer list). */
export async function topMatchesByProfile(profiles: BuyerProfile[], limit = 3) {
  const listings = await activeListings();
  return new Map(
    profiles.map((p) => {
      const ranked = listings
        .filter((l) => p.user_id !== l.seller_id)
        .map((l) => ({ l, m: scoreListing(p, l) }))
        .filter((x): x is { l: typeof x.l; m: NonNullable<typeof x.m> } => !!x.m)
        .sort((a, z) => z.m.score - a.m.score);
      return [p.id, { count: ranked.length, top: ranked.slice(0, limit) }] as const;
    })
  );
}

/** Strong matches recorded for this buyer that they haven't opened yet. */
export async function newMatchesForUser(userId: number) {
  const { rows } = await query<{ listing_id: number; score: number; reasons: string }>(
    `SELECT m.listing_id, m.score, m.reasons FROM matches m
     JOIN buyer_profiles p ON p.id = m.profile_id
     JOIN listings l ON l.id = m.listing_id
     WHERE p.user_id = $1 AND m.seen = 0 AND l.status = 'active'
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function markMatchSeen(userId: number, listingId: number) {
  await query(
    `UPDATE matches SET seen = 1 WHERE listing_id = $1
     AND profile_id = (SELECT id FROM buyer_profiles WHERE user_id = $2)`,
    [listingId, userId]
  );
}

export async function alertOutbox(limit = 25) {
  const { rows } = await query<{ id: number; channel: string; to_address: string; body: string; status: string; created_at: string; name: string }>(
    `SELECT n.*, p.name FROM notifications n JOIN buyer_profiles p ON p.id = n.profile_id
     ORDER BY n.id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}
