import "server-only";
import { query } from "../db";

export async function recordSwipe(userId: number, listingId: number, direction: "like" | "skip") {
  await query(
    `INSERT INTO swipes (user_id, listing_id, direction) VALUES ($1, $2, $3)
     ON CONFLICT(user_id, listing_id) DO UPDATE SET direction = excluded.direction, created_at = now()`,
    [userId, listingId, direction]
  );
}

export async function removeSwipe(userId: number, listingId: number) {
  await query("DELETE FROM swipes WHERE user_id = $1 AND listing_id = $2", [userId, listingId]);
}

export async function clearSkips(userId: number) {
  await query("DELETE FROM swipes WHERE user_id = $1 AND direction = 'skip'", [userId]);
}

export async function likedIds(userId: number) {
  const { rows } = await query<{ id: number }>("SELECT listing_id AS id FROM swipes WHERE user_id = $1 AND direction = 'like'", [userId]);
  return rows.map((r) => r.id);
}
