// Runs schema creation and any pending migrations by hand, separate from the
// automatic (advisory-lock-guarded) run on the app's first request. Useful
// before a first deploy, or any time you want migrations applied without
// waiting for traffic to trigger them.
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development.local", override: true });

import { Pool, type QueryResultRow } from "@neondatabase/serverless";
import { migrate } from "../src/lib/db/schema";
import type { Query } from "../src/lib/db/index";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const query: Query = (<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) =>
    client.query<T>(text, params)) as Query;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(727274)");
    await migrate(query);
    await client.query("COMMIT");
    console.log("Migrations applied.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
