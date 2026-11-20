import "server-only";
import { query } from "../db";

export type Complex = {
  id: number;
  name: string;
  address: string | null;
  city: string;
  lat: number;
  lng: number;
  byu_approved: number;
  management_company: string | null;
  pms: string | null;
  website: string | null;
  location_verified: number;
};

export async function allComplexes(): Promise<Complex[]> {
  const { rows } = await query<Complex>("SELECT * FROM complexes ORDER BY name");
  return rows;
}

export async function complexOptions(): Promise<{ id: number; name: string }[]> {
  const { rows } = await query<{ id: number; name: string }>("SELECT id, name FROM complexes ORDER BY name");
  return rows;
}

export async function complexExists(id: number) {
  const { rows } = await query("SELECT 1 FROM complexes WHERE id = $1", [id]);
  return rows.length > 0;
}

/** Finds a complex by name, or adds it. Returns its id. */
export async function findOrAddComplex(c: { name: string; address: string | null; lat: number; lng: number; byu_approved: number; city: string }) {
  const { rows: existing } = await query<{ id: number }>("SELECT id FROM complexes WHERE lower(name) = lower($1)", [c.name]);
  if (existing[0]) return existing[0].id;
  const { rows } = await query<{ id: number }>(
    "INSERT INTO complexes (name, address, lat, lng, byu_approved, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [c.name, c.address, c.lat, c.lng, c.byu_approved, c.city]
  );
  return rows[0].id;
}

export async function moveComplexPin(id: number, lat: number, lng: number) {
  await query("UPDATE complexes SET lat = $1, lng = $2, location_verified = 1 WHERE id = $3", [lat, lng, id]);
}

export async function updateComplexDetails(
  id: number,
  c: { name: string; city: string; byu_approved: number; management_company: string | null; pms: string | null }
) {
  await query(
    "UPDATE complexes SET name = $1, city = $2, byu_approved = $3, management_company = $4, pms = $5 WHERE id = $6",
    [c.name, c.city, c.byu_approved, c.management_company, c.pms, id]
  );
}
