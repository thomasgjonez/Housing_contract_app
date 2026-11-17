import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "./schema";
import { seed } from "./seed";
import { ensureAdmin } from "./admin";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function open() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  const { n } = db.prepare("SELECT count(*) AS n FROM complexes").get() as { n: number };
  if (n === 0) seed(db);
  ensureAdmin(db);
  return db;
}

// Reuse one connection across hot reloads in dev.
const g = globalThis as unknown as { __db?: Database.Database };
export const db = g.__db ?? (g.__db = open());
