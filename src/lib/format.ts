// Display labels and date formatting shared by server and client components.

export const TERM_LABEL: Record<string, string> = {
  "fall-winter": "Fall-Winter",
  "spring-summer": "Spring-Summer",
  "full-year": "Full year",
  "one-semester": "One semester",
  other: "Other",
};

export const GENDER_LABEL: Record<string, string> = {
  men: "Men's",
  women: "Women's",
  coed: "Coed",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function dateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Today as YYYY-MM-DD (UTC, matching SQLite's date('now')). */
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number) {
  return new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
}
