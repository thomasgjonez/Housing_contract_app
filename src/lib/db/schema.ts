import type { Query } from "./index";
import { nameList, nameMatchesComplex } from "../matching";

// The full current schema. New databases are created from this; existing ones
// are brought up to date by MIGRATIONS below.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  school_email_verified INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS complexes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Provo',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  byu_approved INTEGER NOT NULL DEFAULT 1,
  management_company TEXT,
  pms TEXT,
  website TEXT,
  location_verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  complex_id INTEGER NOT NULL REFERENCES complexes(id),
  unit TEXT,
  housing_gender TEXT NOT NULL CHECK (housing_gender IN ('men','women','coed')),
  room_type TEXT NOT NULL CHECK (room_type IN ('private','shared')),
  rent_monthly INTEGER NOT NULL,
  deposit INTEGER,
  utilities_included INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  contract_term TEXT NOT NULL CHECK (contract_term IN ('fall-winter','spring-summer','full-year','other')),
  incentive TEXT,
  parking INTEGER NOT NULL DEFAULT 0,
  furnished INTEGER NOT NULL DEFAULT 1,
  washer_dryer TEXT NOT NULL DEFAULT 'on-site',
  private_bath INTEGER NOT NULL DEFAULT 0,
  pets_allowed INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  contact_note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','pending','sold','expired')),
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user','seeded','sample')),
  bumped_at TEXT NOT NULL DEFAULT (now()),
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS swipes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like','skip')),
  created_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (now()),
  UNIQUE (listing_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (now())
);

-- Buyer profiles: one per buyer, either filled in on the site (user_id set)
-- or imported from the Google Form (source = 'form', no account).
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app','form')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  social TEXT,
  contact_method TEXT,
  school TEXT,
  contracts_needed INTEGER NOT NULL DEFAULT 1,
  group_pref TEXT NOT NULL DEFAULT 'solo',
  gender TEXT NOT NULL DEFAULT 'any',
  needs_approved TEXT NOT NULL DEFAULT 'unsure',
  move_in TEXT,
  flex_days INTEGER NOT NULL DEFAULT 14,
  semesters TEXT NOT NULL DEFAULT '',
  term TEXT NOT NULL DEFAULT 'any',
  max_rent INTEGER,
  utilities TEXT NOT NULL DEFAULT 'any',
  room TEXT NOT NULL DEFAULT 'any',
  bath TEXT NOT NULL DEFAULT 'any',
  furnished TEXT NOT NULL DEFAULT 'any',
  washer TEXT NOT NULL DEFAULT 'any',
  areas TEXT NOT NULL DEFAULT '',
  distance TEXT NOT NULL DEFAULT 'any',
  -- Complex names from the Google Form that didn't match a known complex.
  -- Matched ones are in buyer_complexes. Shown to the admin only.
  like_complexes TEXT NOT NULL DEFAULT '',
  avoid_complexes TEXT NOT NULL DEFAULT '',
  parking TEXT NOT NULL DEFAULT 'none',
  pets TEXT NOT NULL DEFAULT 'none',
  takeover_ok TEXT NOT NULL DEFAULT 'yes',
  notes TEXT,
  alerts TEXT NOT NULL DEFAULT 'email' CHECK (alerts IN ('email','text','both','off')),
  active INTEGER NOT NULL DEFAULT 1,
  -- 0 when only the quick quiz has been answered.
  complete INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (now()),
  updated_at TEXT NOT NULL DEFAULT (now())
);

-- Favorite (like) and avoided complexes for each buyer.
CREATE TABLE IF NOT EXISTS buyer_complexes (
  profile_id INTEGER NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  complex_id INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('like','avoid')),
  PRIMARY KEY (profile_id, complex_id)
);

-- Strong matches found when a listing is posted. Drives alerts and the
-- "New for you" strip.
CREATE TABLE IF NOT EXISTS matches (
  profile_id INTEGER NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  reasons TEXT NOT NULL DEFAULT '[]',
  seen INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (now()),
  PRIMARY KEY (profile_id, listing_id)
);

-- Outbox for email and text alerts. With no provider configured, alerts are
-- written here with status 'stubbed' instead of being sent.
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  to_address TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stubbed',
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS profiles_email ON buyer_profiles(lower(email));

CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
`;

async function addColumn(query: Query, table: string, column: string, def: string) {
  await query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${def}`);
}

/**
 * Matches free-text complex names to complex ids. Returns the ids found and
 * the names that matched nothing.
 */
export async function resolveComplexNames(query: Query, text: string) {
  const { rows: complexes } = await query<{ id: number; name: string }>("SELECT id, name FROM complexes");
  const ids = new Set<number>();
  const unmatched: string[] = [];
  for (const name of nameList(text)) {
    const hit = complexes.filter((c) => nameMatchesComplex(name, c.name));
    if (hit.length) hit.forEach((c) => ids.add(c.id));
    else unmatched.push(name);
  }
  return { ids: [...ids], unmatched: unmatched.join(", ") };
}

// Each step runs once, tracked in schema_migrations.
const MIGRATIONS: ((query: Query) => Promise<void>)[] = [
  // 1: v1.1 listing and complex fields.
  async (query) => {
    await addColumn(query, "complexes", "city", "TEXT NOT NULL DEFAULT 'Provo'");
    await addColumn(query, "listings", "furnished", "INTEGER NOT NULL DEFAULT 1");
    await addColumn(query, "listings", "washer_dryer", "TEXT NOT NULL DEFAULT 'on-site'");
    await addColumn(query, "listings", "private_bath", "INTEGER NOT NULL DEFAULT 0");
    await addColumn(query, "listings", "pets_allowed", "INTEGER NOT NULL DEFAULT 0");
  },
  // 2: v1.2 favorite/avoid complexes move from text to buyer_complexes.
  async (query) => {
    await addColumn(query, "buyer_profiles", "complete", "INTEGER NOT NULL DEFAULT 1");
    const { rows } = await query<{ id: number; like_complexes: string; avoid_complexes: string }>(
      "SELECT id, like_complexes, avoid_complexes FROM buyer_profiles"
    );
    for (const r of rows) {
      const avoid = await resolveComplexNames(query, r.avoid_complexes);
      const like = await resolveComplexNames(query, r.like_complexes);
      for (const id of avoid.ids) {
        await query("INSERT INTO buyer_complexes (profile_id, complex_id, kind) VALUES ($1, $2, 'avoid') ON CONFLICT DO NOTHING", [r.id, id]);
      }
      for (const id of like.ids) {
        await query("INSERT INTO buyer_complexes (profile_id, complex_id, kind) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING", [r.id, id]);
      }
      await query("UPDATE buyer_profiles SET like_complexes = $1, avoid_complexes = $2 WHERE id = $3", [
        like.unmatched,
        avoid.unmatched,
        r.id,
      ]);
    }
  },
];

export async function migrate(query: Query) {
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
    await query(stmt);
  }
  const { rows } = await query<{ version: number }>("SELECT version FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.version));
  for (let v = 0; v < MIGRATIONS.length; v++) {
    if (applied.has(v)) continue;
    await MIGRATIONS[v](query);
    await query("INSERT INTO schema_migrations (version) VALUES ($1)", [v]);
  }
}
