import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "@neondatabase/serverless";
import { AsyncLocalStorage } from "node:async_hooks";
import { migrate } from "./schema";
import { seed } from "./seed";
import { ensureAdmin } from "./admin";

const als = new AsyncLocalStorage<PoolClient>();

const g = globalThis as unknown as { __pool?: Pool; __ready?: Promise<void> };

function pool() {
  return g.__pool ?? (g.__pool = new Pool({ connectionString: process.env.DATABASE_URL }));
}

// Runs schema creation, pending migrations, first-time seeding, and the
// admin-account check inside one transaction, serialized across concurrent
// cold starts with an advisory lock (otherwise two instances starting at the
// same moment could both try to run the same migration or seed twice).
async function bootstrap() {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(727274)");
    await als.run(client, async () => {
      await migrate(query);
      const { rows } = await query<{ n: string }>("SELECT count(*) AS n FROM complexes");
      if (Number(rows[0].n) === 0) await seed(query);
      await ensureAdmin(query);
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

function ready() {
  return g.__ready ?? (g.__ready = bootstrap());
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const client = als.getStore();
  if (!client) await ready();
  const c = als.getStore();
  return (c ?? pool()).query<T>(text, params);
}

export type Query = typeof query;

/**
 * Runs fn inside a transaction. If already inside one (a transactional
 * function called from another transactional function), joins it instead of
 * starting a nested one — Postgres transactions aren't nestable, and this
 * matches better-sqlite3's savepoint-based nesting closely enough for how
 * this app uses it.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (als.getStore()) return fn();
  await ready();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await als.run(client, fn);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
