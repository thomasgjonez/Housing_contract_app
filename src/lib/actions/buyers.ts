"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, requireUser } from "../auth";
import { blankProfile, linkFormProfile, profileForUser, upsertProfile, type ProfileInput } from "../data/buyers";
import { setPhone } from "../data/users";
import { pick, str, type FormState } from "../form";
import { QUIZ_FIELDS, parsePreferences, quizQuery } from "../preferences";

/**
 * The quick quiz. Signed in, the answers go straight into the buyer profile
 * (starting one if needed). Signed out, they ride along in the URL.
 */
export async function saveQuiz(fd: FormData) {
  const view = str(fd, "view") === "map" ? "map" : "match";
  const user = await currentUser();
  if (!user) {
    const q = quizQuery(parsePreferences(fd, undefined, QUIZ_FIELDS));
    redirect(`/${view}${q ? `?${q}` : ""}`);
  }
  await linkFormProfile(user);
  const current = (await profileForUser(user.id)) ?? blankProfile(user);
  const prefs = parsePreferences(fd, current, QUIZ_FIELDS);
  await upsertProfile({ ...current, ...prefs, active: 1 }, { userId: user.id });
  revalidatePath("/", "layout");
  redirect(`/${view}`);
}

/** The full buyer profile form. */
export async function saveProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/profile");
  await linkFormProfile({ ...user, phone: str(fd, "phone") || user.phone });
  const input: ProfileInput = {
    ...parsePreferences(fd),
    name: str(fd, "name") || user.name,
    email: str(fd, "email") || user.email,
    phone: str(fd, "phone") || null,
    social: str(fd, "social") || null,
    contact_method: str(fd, "contact_method") || null,
    school: str(fd, "school") || null,
    contracts_needed: Math.max(1, Math.min(6, Number(str(fd, "contracts_needed")) || 1)),
    group_pref: pick(str(fd, "group_pref"), ["solo", "same-unit", "same-complex"] as const, "solo"),
    takeover_ok: "yes",
    notes: str(fd, "notes") || null,
    alerts: pick(str(fd, "alerts"), ["email", "text", "both", "off"] as const, "email"),
    active: fd.get("paused") ? 0 : 1,
    complete: 1,
  };
  if ((input.alerts === "text" || input.alerts === "both") && !input.phone) {
    return { error: "Add a phone number for text alerts, or pick email." };
  }
  if (!input.move_in) return { error: "Pick a move-in date." };
  const existing = await profileForUser(user.id);
  await upsertProfile(
    { ...input, unmatched_like: existing?.unmatched_like, unmatched_avoid: existing?.unmatched_avoid },
    { userId: user.id }
  );
  if (input.phone && !user.phone) await setPhone(user.id, input.phone);
  revalidatePath("/", "layout");
  redirect("/match?saved=1");
}
