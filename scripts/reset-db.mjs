// Clears every table in the database `DATABASE_URL` points at (the Neon dev
// branch locally, since .env.development.local overrides .env.local) so the
// next request reseeds it with fresh sample data.
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development.local", override: true });

import { Pool } from "@neondatabase/serverless";

const TABLES = [
  "notifications", "matches", "buyer_complexes", "buyer_profiles",
  "messages", "conversations", "swipes", "photos", "listings",
  "complexes", "sessions", "users",
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
await pool.end();
console.log("Database cleared. Start the app again to reseed it.");
