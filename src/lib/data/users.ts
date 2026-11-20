import "server-only";
import { query } from "../db";

export async function findUserByEmail(email: string) {
  const { rows } = await query<{ id: number; email: string; phone: string | null; password_hash: string }>(
    "SELECT id, email, phone, password_hash FROM users WHERE lower(email) = lower($1)",
    [email]
  );
  return rows[0] ?? null;
}

export async function createUser(u: { name: string; email: string; password_hash: string; school_email_verified: number; is_admin: number }) {
  const { rows } = await query<{ id: number }>(
    "INSERT INTO users (name, email, password_hash, school_email_verified, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [u.name, u.email, u.password_hash, u.school_email_verified, u.is_admin]
  );
  return rows[0].id;
}

export async function setPhone(userId: number, phone: string) {
  await query("UPDATE users SET phone = $1 WHERE id = $2", [phone, userId]);
}

export async function publicSeller(userId: number) {
  const { rows } = await query<{ name: string; school_email_verified: number }>(
    "SELECT name, school_email_verified FROM users WHERE id = $1",
    [userId]
  );
  return rows[0];
}

/** Real accounts (not the sample seller). */
export async function accountCount() {
  const { rows } = await query<{ n: string }>("SELECT count(*) AS n FROM users WHERE password_hash NOT LIKE '!%'");
  return Number(rows[0].n);
}

// ---------- sessions ----------

export async function createSession(token: string, userId: number) {
  await query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, userId]);
}

export async function deleteSession(token: string) {
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function userForSession(token: string) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.school_email_verified, u.is_admin
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1`,
    [token]
  );
  return rows[0];
}
