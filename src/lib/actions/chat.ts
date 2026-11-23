"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, requireUser } from "../auth";
import {
  addMessage,
  getConversation,
  inbox,
  latestIncomingMessage,
  markRead,
  messagesSince,
  myLastMessageSeen,
  startConversation,
  unreadCount,
} from "../data/chat";
import { getListing } from "../data/listings";
import { recordSwipe } from "../data/swipes";
import { str } from "../form";

export async function contactSeller(fd: FormData) {
  const listingId = Number(str(fd, "listingId"));
  const user = await requireUser(`/listings/${listingId}`);
  const listing = await getListing(listingId);
  if (!listing || listing.seller_id === user.id) redirect(`/listings/${listingId}`);
  const convId = await startConversation(listingId, user.id, listing.seller_id);
  // Save the listing too, so it shows up under Saved.
  await recordSwipe(user.id, listingId, "like");
  const body = str(fd, "body");
  if (body) await addMessage(convId, user.id, body);
  redirect(`/inbox/${convId}`);
}

export async function sendMessage(fd: FormData) {
  const convId = Number(str(fd, "conversationId"));
  const user = await requireUser(`/inbox/${convId}`);
  const body = str(fd, "body");
  if (body && (await getConversation(convId, user.id))) await addMessage(convId, user.id, body);
  revalidatePath(`/inbox/${convId}`);
}

/** Polls for new messages in a conversation, and whether the user's own last message has been seen. */
export async function pollConversation(conversationId: number, afterId: number) {
  const user = await requireUser(`/inbox/${conversationId}`);
  if (!(await getConversation(conversationId, user.id))) return { newMessages: [], myLastSeen: null };
  const newMessages = await messagesSince(conversationId, afterId);
  if (newMessages.length) await markRead(conversationId, user.id);
  const myLastSeen = await myLastMessageSeen(conversationId, user.id);
  return { newMessages, myLastSeen };
}

/** Polls the signed-in user's overall unread count and newest incoming message, for the nav badge and toast. */
export async function pollInbox() {
  const user = await currentUser();
  if (!user) return { unread: 0, latest: null };
  const [unread, latest] = await Promise.all([unreadCount(user.id), latestIncomingMessage(user.id)]);
  return {
    unread,
    latest: latest ? { id: latest.id, conversationId: latest.conversation_id, otherName: latest.other_name, body: latest.body } : null,
  };
}

/** Polls the inbox list. */
export async function getInboxRows() {
  const user = await requireUser("/inbox");
  return inbox(user.id);
}
