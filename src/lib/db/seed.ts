import crypto from "node:crypto";
import type { Query } from "./index";
import { resolveComplexNames } from "./schema";

// Map pins are approximate (placed by hand, not geocoded). Fix them on the
// Admin page by clicking the map; that also marks the location verified.
// BYU-approved status should be checked against BYU's housing list.
const COMPLEXES: [name: string, lat: number, lng: number][] = [
  ["Glenwood", 40.2532, -111.6593],
  ["King Henry", 40.2452, -111.6468],
  ["Joaquin Village", 40.2468, -111.6538],
  ["Liberty Square", 40.2466, -111.6508],
  ["Branbury", 40.2578, -111.6652],
  ["Centre Street", 40.2437, -111.6585],
  ["Alpine Village", 40.2588, -111.6618],
  ["Belmont", 40.2443, -111.6478],
  ["The Village at South Campus", 40.2421, -111.6519],
  ["Riviera", 40.2565, -111.6694],
];

// Sample listings so the matcher and map are not empty on day one.
// They show a "Sample" badge; remove them all from the Admin page once real
// listings come in. Only seeded outside production, see seed() below.
type Sample = {
  complex: string;
  gender: "men" | "women";
  room: "private" | "shared";
  rent: number;
  start: string;
  end: string;
  term: "fall-winter" | "spring-summer";
  incentive?: string;
  parking?: boolean;
  utilities?: boolean;
  description: string;
};

const SAMPLES: Sample[] = [
  { complex: "Glenwood", gender: "women", room: "private", rent: 575, start: "2027-01-06", end: "2027-04-24", term: "fall-winter", incentive: "$100 off January", parking: true, description: "Leaving for an internship in January. Quiet 4-person apartment, great roommates." },
  { complex: "King Henry", gender: "men", room: "shared", rent: 365, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", utilities: true, description: "Getting married in December, need someone to take over winter semester." },
  { complex: "Joaquin Village", gender: "women", room: "shared", rent: 395, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", parking: true, description: "Shared room, short walk to campus. Covered parking spot included." },
  { complex: "Liberty Square", gender: "men", room: "private", rent: 610, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", incentive: "I'll cover the transfer fee", description: "Private room with own bathroom. Gym and hot tub in the complex." },
  { complex: "Branbury", gender: "women", room: "private", rent: 520, start: "2027-05-01", end: "2027-08-15", term: "spring-summer", parking: true, description: "Spring/Summer contract. Pool and big kitchen." },
  { complex: "Centre Street", gender: "men", room: "private", rent: 640, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", utilities: true, parking: true, description: "Graduating early, moving for a job. Newer building, washer/dryer in unit." },
  { complex: "Alpine Village", gender: "men", room: "shared", rent: 340, start: "2027-05-01", end: "2027-08-15", term: "spring-summer", description: "Cheapest way to spend summer in Provo. Easy roommates." },
  { complex: "Belmont", gender: "women", room: "private", rent: 590, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", incentive: "$150 Venmo when you sign", description: "Study abroad in winter. Private room, very close to campus." },
  { complex: "The Village at South Campus", gender: "women", room: "shared", rent: 425, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", parking: true, utilities: true, description: "Shared room in a 6-person unit. Clubhouse and study rooms." },
  { complex: "Riviera", gender: "men", room: "private", rent: 495, start: "2027-05-01", end: "2027-08-15", term: "spring-summer", parking: true, description: "Spring/Summer, private room, free parking." },
  { complex: "Glenwood", gender: "men", room: "shared", rent: 355, start: "2027-01-01", end: "2027-04-30", term: "fall-winter", description: "Mission call came early. Shared room, friendly ward." },
  { complex: "King Henry", gender: "women", room: "private", rent: 545, start: "2027-05-01", end: "2027-08-15", term: "spring-summer", incentive: "First month $50 off", description: "Spring/Summer private room, pool access." },
];

async function seedSampleListingsAndBuyers(query: Query, ids: Map<string, number>) {
  const { rows: seller } = await query<{ id: number }>(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
    ["Sample Seller", "samples@provo-contracts.local", "!" + crypto.randomBytes(16).toString("hex")]
  );
  const sellerId = seller[0].id;

  for (const s of SAMPLES) {
    await query(
      `INSERT INTO listings (seller_id, complex_id, housing_gender, room_type, rent_monthly, deposit,
         utilities_included, start_date, end_date, contract_term, incentive, parking, description, source)
       VALUES ($1, $2, $3, $4, $5, 150, $6, $7, $8, $9, $10, $11, $12, 'sample')`,
      [
        sellerId, ids.get(s.complex), s.gender, s.room, s.rent, s.utilities ? 1 : 0,
        s.start, s.end, s.term, s.incentive ?? null, s.parking ? 1 : 0, s.description,
      ]
    );
  }
  // A few amenities so the matcher has something to tell apart.
  await query(`UPDATE listings SET washer_dryer = 'in-unit' WHERE description LIKE '%washer/dryer in unit%'`);
  await query(`UPDATE listings SET private_bath = 1 WHERE description LIKE '%own bathroom%'`);
  await query(
    `UPDATE listings SET washer_dryer = 'in-unit', private_bath = 1
     WHERE complex_id IN (SELECT id FROM complexes WHERE name IN ('Belmont', 'Liberty Square')) AND room_type = 'private'`
  );

  // Sample buyers, shaped like Google Form responses, so a new listing has
  // someone to match against. "Delete all samples" on Admin removes them.
  const buyers = [
    { name: "Sample: Kate R.", gender: "women", move_in: "2027-01-02", flex: 7, semesters: "Winter", term: "any", max_rent: 600, room: "private", washer: "in-unit", distance: "walk", like: "Belmont, Glenwood", contact: "Text", alerts: "text" },
    { name: "Sample: Josh M.", gender: "men", move_in: "2027-01-01", flex: 7, semesters: "Winter", term: "any", max_rent: 400, room: "shared", washer: "any", distance: "any", like: "", contact: "Email", alerts: "email" },
    { name: "Sample: Emma L.", gender: "women", move_in: "2027-05-01", flex: 21, semesters: "Spring,Summer", term: "spring-summer", max_rent: 550, room: "any", washer: "any", distance: "drive10", like: "Branbury", contact: "Email", alerts: "email" },
    { name: "Sample: Tyler B.", gender: "men", move_in: "2027-01-01", flex: 14, semesters: "Winter", term: "any", max_rent: 700, room: "private", washer: "in-unit", distance: "walk", like: "Liberty Square", contact: "Text", alerts: "both" },
  ];
  for (const [i, { like, ...b }] of buyers.entries()) {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO buyer_profiles (source, name, email, phone, contact_method, school, gender, needs_approved,
         move_in, flex_days, semesters, term, max_rent, room, washer, areas, distance, alerts)
       VALUES ('form', $1, $2, $3, $4, 'BYU', $5, 'yes', $6, $7, $8, $9, $10, $11, $12, 'Provo', $13, $14)
       RETURNING id`,
      [
        b.name, `buyer${i + 1}@sample.provo-contracts.local`, `801-555-01${10 + i}`, b.contact,
        b.gender, b.move_in, b.flex, b.semesters, b.term, b.max_rent, b.room, b.washer, b.distance, b.alerts,
      ]
    );
    const id = rows[0].id;
    const { ids: likeIds } = await resolveComplexNames(query, like);
    for (const complexId of likeIds) {
      await query("INSERT INTO buyer_complexes (profile_id, complex_id, kind) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING", [id, complexId]);
    }
  }
}

export async function seed(query: Query) {
  const ids = new Map<string, number>();
  for (const [name, lat, lng] of COMPLEXES) {
    const { rows } = await query<{ id: number }>(
      "INSERT INTO complexes (name, lat, lng, byu_approved) VALUES ($1, $2, $3, 1) RETURNING id",
      [name, lat, lng]
    );
    ids.set(name, rows[0].id);
  }
  // Fake listings/buyers would be confusing on the live site.
  if (process.env.NODE_ENV !== "production") await seedSampleListingsAndBuyers(query, ids);
}
