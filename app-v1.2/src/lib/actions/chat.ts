"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { addMessage, getConversation, startConversation } from "../data/chat";
import { getListing } from "../data/listings";
import { recordSwipe } from "../data/swipes";
import { str } from "../form";

export async function contactSeller(fd: FormData) {
  const listingId = Number(str(fd, "listingId"));
  const user = await requireUser(`/listings/${listingId}`);
  const listing = getListing(listingId);
  if (!listing || listing.seller_id === user.id) redirect(`/listings/${listingId}`);
  const convId = startConversation(listingId, user.id, listing.seller_id);
  // Save the listing too, so it shows up under Saved.
  recordSwipe(user.id, listingId, "like");
  const body = str(fd, "body");
  if (body) addMessage(convId, user.id, body);
  redirect(`/inbox/${convId}`);
}

export async function sendMessage(fd: FormData) {
  const convId = Number(str(fd, "conversationId"));
  const user = await requireUser(`/inbox/${convId}`);
  const body = str(fd, "body");
  if (body && getConversation(convId, user.id)) addMessage(convId, user.id, body);
  revalidatePath(`/inbox/${convId}`);
}
