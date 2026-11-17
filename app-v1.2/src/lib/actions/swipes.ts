"use server";

import { revalidatePath } from "next/cache";
import { currentUser, requireUser } from "../auth";
import { markMatchSeen } from "../data/buyers";
import { clearSkips, recordSwipe, removeSwipe } from "../data/swipes";

export async function setLike(listingId: number, liked: boolean) {
  const user = await currentUser();
  if (!user) return { saved: false };
  if (liked) recordSwipe(user.id, listingId, "like");
  else removeSwipe(user.id, listingId);
  markMatchSeen(user.id, listingId);
  return { saved: true };
}

export async function swipe(listingId: number, direction: "like" | "skip") {
  const user = await currentUser();
  if (!user) return { saved: false };
  recordSwipe(user.id, listingId, direction);
  markMatchSeen(user.id, listingId);
  return { saved: true };
}

export async function resetSkips() {
  const user = await currentUser();
  if (user) clearSkips(user.id);
  revalidatePath("/match");
}

export async function unsave(listingId: number) {
  const user = await requireUser("/me");
  removeSwipe(user.id, listingId);
  revalidatePath("/me");
}
