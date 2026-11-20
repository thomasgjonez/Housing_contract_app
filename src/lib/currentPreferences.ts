import "server-only";
import type { User } from "./auth";
import { profileForUser, type BuyerProfile } from "./data/buyers";
import { DEFAULT_PREFERENCES, hasQuizParams, parsePreferences, QUIZ_FIELDS, type BuyerPreferences } from "./preferences";

export type PreferenceSource = "url" | "profile" | "none";

/**
 * Which preferences drive the Match and Map pages: quiz answers in the URL
 * (a shared link, or someone not signed in) win; otherwise the signed-in
 * buyer's active profile; otherwise nothing, which shows every listing.
 */
export async function currentPreferences(
  sp: Record<string, string | string[] | undefined>,
  user: User | null
): Promise<{ prefs: BuyerPreferences; source: PreferenceSource; profile: BuyerProfile | null }> {
  const profile = user ? await profileForUser(user.id) : null;
  if (hasQuizParams(sp)) return { prefs: parsePreferences(sp, DEFAULT_PREFERENCES, QUIZ_FIELDS), source: "url", profile };
  if (profile?.active) return { prefs: profile, source: "profile", profile };
  return { prefs: DEFAULT_PREFERENCES, source: "none", profile };
}
