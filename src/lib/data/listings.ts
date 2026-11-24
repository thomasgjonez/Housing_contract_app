import "server-only";
import { query, withTransaction } from "../db";
import { EXPIRE_AFTER_START_DAYS } from "../config";
import { walkMinutes } from "../geo";
import { rank, type BuyerPreferences, type MatchResult } from "../matching";

export type Listing = {
  id: number;
  seller_id: number;
  complex_id: number;
  complex: string;
  lat: number;
  lng: number;
  byu_approved: number;
  unit: string | null;
  housing_gender: "men" | "women" | "coed";
  room_type: "private" | "shared";
  rent_monthly: number;
  deposit: number | null;
  utilities_included: number;
  start_date: string;
  end_date: string;
  contract_term: string;
  incentive: string | null;
  parking: number;
  description: string | null;
  contact_note: string | null;
  status: string;
  source: string;
  created_at: string;
  photo: string | null;
  furnished: number;
  washer_dryer: string;
  private_bath: number;
  pets_allowed: number;
  contracts_available: number;
  city: string;
  walk_minutes: number;
};

export type ScoredListing = Listing & MatchResult;

type Row = Omit<Listing, "walk_minutes">;

const BASE = `
  SELECT l.*, c.name AS complex, c.lat, c.lng, c.byu_approved, c.city,
    (SELECT file FROM photos p WHERE p.listing_id = l.id ORDER BY position LIMIT 1) AS photo
  FROM listings l JOIN complexes c ON c.id = l.complex_id`;

function withWalk(rows: Row[]): Listing[] {
  return rows.map((r) => ({ ...r, walk_minutes: walkMinutes(r.lat, r.lng) }));
}

// ---------- expiry ----------

let lastExpiry = 0;

/**
 * Listings expire two weeks after the lease start date. Runs at most once a
 * minute, from the listing queries below, so nothing needs a scheduler.
 */
export async function expireStaleListings(force = false) {
  if (!force && Date.now() - lastExpiry < 60_000) return 0;
  lastExpiry = Date.now();
  const { rowCount } = await query(
    `UPDATE listings SET status = 'expired'
     WHERE status IN ('active','pending') AND start_date::date + ($1 * interval '1 day') < current_date`,
    [EXPIRE_AFTER_START_DAYS]
  );
  return rowCount ?? 0;
}

// ---------- reads ----------

export async function getListing(id: number): Promise<Listing | null> {
  await expireStaleListings();
  const { rows } = await query<Row>(`${BASE} WHERE l.id = $1`, [id]);
  return rows[0] ? withWalk([rows[0]])[0] : null;
}

export async function getPhotos(listingId: number): Promise<string[]> {
  const { rows } = await query<{ file: string }>("SELECT file FROM photos WHERE listing_id = $1 ORDER BY position", [listingId]);
  return rows.map((p) => p.file);
}

export async function listingsBySeller(sellerId: number): Promise<Listing[]> {
  await expireStaleListings();
  const { rows } = await query<Row>(`${BASE} WHERE l.seller_id = $1 ORDER BY l.created_at DESC`, [sellerId]);
  return withWalk(rows);
}

export async function likedListings(userId: number): Promise<Listing[]> {
  await expireStaleListings();
  const { rows } = await query<Row>(
    `${BASE} JOIN swipes s ON s.listing_id = l.id
     WHERE s.user_id = $1 AND s.direction = 'like' AND l.status IN ('active','pending')
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return withWalk(rows);
}

export async function recentListings(limit = 6): Promise<Listing[]> {
  await expireStaleListings();
  const { rows } = await query<Row>(`${BASE} WHERE l.status = 'active' ORDER BY l.bumped_at DESC LIMIT $1`, [limit]);
  return withWalk(rows);
}

export async function activeListings(opts: { excludeSwipedBy?: number; excludeSeller?: number } = {}): Promise<Listing[]> {
  await expireStaleListings();
  const where = ["l.status = 'active'"];
  const args: number[] = [];
  if (opts.excludeSwipedBy) {
    args.push(opts.excludeSwipedBy);
    where.push(`l.id NOT IN (SELECT listing_id FROM swipes WHERE user_id = $${args.length})`);
  }
  if (opts.excludeSeller) {
    args.push(opts.excludeSeller);
    where.push(`l.seller_id != $${args.length}`);
  }
  const { rows } = await query<Row>(`${BASE} WHERE ${where.join(" AND ")} ORDER BY l.bumped_at DESC`, args);
  return withWalk(rows);
}

export async function listingStats(listingId: number) {
  const { rows: saves } = await query<{ n: string }>("SELECT count(*) AS n FROM swipes WHERE listing_id = $1 AND direction = 'like'", [listingId]);
  const { rows: chats } = await query<{ n: string }>("SELECT count(*) AS n FROM conversations WHERE listing_id = $1", [listingId]);
  return { saves: Number(saves[0].n), chats: Number(chats[0].n) };
}

export async function listingCounts() {
  const { rows } = await query<{ source: string; status: string; n: string }>(
    "SELECT source, status, count(*) AS n FROM listings GROUP BY source, status"
  );
  return rows.map((r) => ({ ...r, n: Number(r.n) }));
}

export async function isListingOwner(listingId: number, userId: number) {
  const { rows } = await query("SELECT 1 FROM listings WHERE id = $1 AND seller_id = $2", [listingId, userId]);
  return rows.length > 0;
}

// ---------- matching ----------

/**
 * Ranked listings for a buyer's preferences (a saved profile, or quiz answers
 * from the URL). Pass userId to leave out their own listings and boost
 * complexes they liked; excludeSwiped also hides ones they already swiped.
 */
export async function matchListings(
  p: BuyerPreferences,
  opts: { userId?: number; excludeSwiped?: boolean } = {}
): Promise<ScoredListing[]> {
  const listings = await activeListings({
    excludeSwipedBy: opts.excludeSwiped ? opts.userId : undefined,
    excludeSeller: opts.userId,
  });
  return rank(p, listings, { likedComplexIds: opts.userId ? await likedComplexIds(opts.userId) : undefined });
}

async function likedComplexIds(userId: number) {
  const { rows } = await query<{ id: number }>(
    `SELECT DISTINCT l.complex_id AS id FROM swipes s JOIN listings l ON l.id = s.listing_id
     WHERE s.user_id = $1 AND s.direction = 'like'`,
    [userId]
  );
  return new Set(rows.map((r) => r.id));
}

// ---------- writes ----------

export type NewListing = {
  seller_id: number;
  complex_id: number;
  unit: string | null;
  housing_gender: string;
  room_type: string;
  rent_monthly: number;
  deposit: number | null;
  utilities_included: number;
  start_date: string;
  end_date: string;
  contract_term: string;
  incentive: string | null;
  parking: number;
  description: string | null;
  contact_note: string | null;
  source: "user" | "seeded";
  furnished: number;
  washer_dryer: string;
  private_bath: number;
  pets_allowed: number;
  contracts_available: number;
};

export async function insertListing(l: NewListing, photos: string[]) {
  return withTransaction(async () => {
    const keys = Object.keys(l) as (keyof NewListing)[];
    const { rows } = await query<{ id: number }>(
      `INSERT INTO listings (${keys.join(", ")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
      keys.map((k) => l[k])
    );
    const id = rows[0].id;
    for (const [i, file] of photos.entries()) {
      await query("INSERT INTO photos (listing_id, file, position) VALUES ($1, $2, $3)", [id, file, i]);
    }
    return id;
  });
}

export async function setStatus(id: number, status: "active" | "pending" | "sold") {
  await query("UPDATE listings SET status = $1 WHERE id = $2", [status, id]);
}

export async function bump(id: number) {
  await query("UPDATE listings SET bumped_at = now() WHERE id = $1", [id]);
}

/** Puts an expired listing back up with new lease dates. */
export async function relist(id: number, start: string, end: string) {
  await query("UPDATE listings SET status = 'active', start_date = $1, end_date = $2, bumped_at = now() WHERE id = $3", [start, end, id]);
}

export async function deleteSampleListings() {
  await query("DELETE FROM listings WHERE source = 'sample'");
}
