import "server-only";
import { query } from "../db";

export type InboxRow = {
  id: number;
  complex: string;
  rent_monthly: number;
  other_name: string;
  i_am_seller: number;
  last_body: string | null;
  last_at: string | null;
  unread: number;
};

export async function inbox(userId: number): Promise<InboxRow[]> {
  const { rows } = await query<InboxRow>(
    `SELECT c.id, cx.name AS complex, l.rent_monthly,
       CASE WHEN c.seller_id = $1 THEN b.name ELSE s.name END AS other_name,
       (c.seller_id = $1)::int AS i_am_seller,
       (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_body,
       (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_at,
       (SELECT count(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND read_at IS NULL) AS unread
     FROM conversations c
     JOIN listings l ON l.id = c.listing_id
     JOIN complexes cx ON cx.id = l.complex_id
     JOIN users b ON b.id = c.buyer_id
     JOIN users s ON s.id = c.seller_id
     WHERE c.buyer_id = $1 OR c.seller_id = $1
     ORDER BY coalesce(last_at, c.created_at) DESC`,
    [userId]
  );
  return rows;
}

export type Conversation = {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  complex: string;
  rent_monthly: number;
  status: string;
  buyer_name: string;
  seller_name: string;
};

/** A conversation the user is part of, or null. */
export async function getConversation(id: number, userId: number): Promise<Conversation | null> {
  const { rows } = await query<Conversation>(
    `SELECT c.*, cx.name AS complex, l.rent_monthly, l.status, b.name AS buyer_name, s.name AS seller_name
     FROM conversations c JOIN listings l ON l.id = c.listing_id JOIN complexes cx ON cx.id = l.complex_id
     JOIN users b ON b.id = c.buyer_id JOIN users s ON s.id = c.seller_id
     WHERE c.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function conversationFor(listingId: number, buyerId: number) {
  const { rows } = await query<{ id: number }>("SELECT id FROM conversations WHERE listing_id = $1 AND buyer_id = $2", [listingId, buyerId]);
  return rows[0] ?? null;
}

/** Opens (or reuses) the buyer's conversation about a listing. */
export async function startConversation(listingId: number, buyerId: number, sellerId: number) {
  await query(
    "INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3) ON CONFLICT (listing_id, buyer_id) DO NOTHING",
    [listingId, buyerId, sellerId]
  );
  return (await conversationFor(listingId, buyerId))!.id;
}

export async function messages(conversationId: number) {
  const { rows } = await query<{ id: number; sender_id: number; body: string; created_at: string }>(
    "SELECT id, sender_id, body, created_at FROM messages WHERE conversation_id = $1 ORDER BY id",
    [conversationId]
  );
  return rows;
}

export async function addMessage(conversationId: number, senderId: number, body: string) {
  await query("INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)", [
    conversationId,
    senderId,
    body.slice(0, 4000),
  ]);
}

export async function markRead(conversationId: number, userId: number) {
  await query("UPDATE messages SET read_at = now() WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL", [
    conversationId,
    userId,
  ]);
}

export async function unreadCount(userId: number) {
  const { rows } = await query<{ n: string }>(
    `SELECT count(*) AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
     WHERE (c.buyer_id = $1 OR c.seller_id = $1) AND m.sender_id != $1 AND m.read_at IS NULL`,
    [userId]
  );
  return Number(rows[0].n);
}
