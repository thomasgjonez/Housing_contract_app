// Roughly the middle of BYU campus.
export const CAMPUS = { lat: 40.2518, lng: -111.6493 };

// Straight-line distance to campus, padded for streets, at a 80 m/min walk.
export function walkMinutes(lat: number, lng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat - CAMPUS.lat);
  const dLng = toRad(lng - CAMPUS.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(CAMPUS.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  const meters = 2 * R * Math.asin(Math.sqrt(a));
  return Math.max(1, Math.round((meters * 1.3) / 80));
}
