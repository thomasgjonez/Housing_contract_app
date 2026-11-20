import type { Query } from "./index";
import { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } from "../config";
import { hashPassword } from "../passwords";

/**
 * Admin is whoever ADMIN_EMAIL in .env.local names, and nobody else. If that
 * account doesn't exist yet and ADMIN_PASSWORD is set, it is created.
 */
export async function ensureAdmin(query: Query) {
  if (!ADMIN_EMAIL) {
    console.warn("[admin] ADMIN_EMAIL is not set in .env.local, so nobody has admin access.");
    await query("UPDATE users SET is_admin = 0");
    return;
  }
  const { rows: exists } = await query("SELECT 1 FROM users WHERE lower(email) = $1", [ADMIN_EMAIL]);
  if (!exists.length && ADMIN_PASSWORD) {
    // ON CONFLICT DO NOTHING: several build workers can open the database at once.
    const { rowCount } = await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      [ADMIN_NAME, ADMIN_EMAIL, hashPassword(ADMIN_PASSWORD)]
    );
    if (rowCount) console.log(`[admin] Created the admin account ${ADMIN_EMAIL}.`);
  }
  await query("UPDATE users SET is_admin = (lower(email) = $1)::int", [ADMIN_EMAIL]);
}
