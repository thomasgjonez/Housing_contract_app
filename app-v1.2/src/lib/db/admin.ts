import type Database from "better-sqlite3";
import { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } from "../config";
import { hashPassword } from "../passwords";

/**
 * Admin is whoever ADMIN_EMAIL in .env.local names, and nobody else. If that
 * account doesn't exist yet and ADMIN_PASSWORD is set, it is created.
 */
export function ensureAdmin(db: Database.Database) {
  if (!ADMIN_EMAIL) {
    console.warn("[admin] ADMIN_EMAIL is not set in .env.local, so nobody has admin access.");
    db.prepare("UPDATE users SET is_admin = 0").run();
    return;
  }
  const exists = db.prepare("SELECT 1 FROM users WHERE lower(email) = ?").get(ADMIN_EMAIL);
  if (!exists && ADMIN_PASSWORD) {
    // OR IGNORE: several build workers can open the database at once.
    const res = db
      .prepare("INSERT OR IGNORE INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(ADMIN_NAME, ADMIN_EMAIL, hashPassword(ADMIN_PASSWORD));
    if (res.changes) console.log(`[admin] Created the admin account ${ADMIN_EMAIL}.`);
  }
  db.prepare("UPDATE users SET is_admin = (lower(email) = ?)").run(ADMIN_EMAIL);
}
