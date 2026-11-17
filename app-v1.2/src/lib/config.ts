import "server-only";

// Settings read from .env.local (see .env.local.example).

/** The one account that gets the Admin pages. */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
/** If set, the admin account is created with this password on first start. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;
export const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || "Admin";

export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Listings expire this many days after the lease start date. */
export const EXPIRE_AFTER_START_DAYS = 14;

export function isAdminEmail(email: string) {
  return !!ADMIN_EMAIL && email.trim().toLowerCase() === ADMIN_EMAIL;
}
