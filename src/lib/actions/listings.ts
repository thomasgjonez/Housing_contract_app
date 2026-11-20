"use server";

import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, requireUser } from "../auth";
import { EXPIRE_AFTER_START_DAYS } from "../config";
import { matchNewListing } from "../data/buyers";
import { complexExists, findOrAddComplex } from "../data/complexes";
import { bump, insertListing, isListingOwner, relist, setStatus } from "../data/listings";
import { setPhone } from "../data/users";
import { addDays, todayIso } from "../format";
import { pick, str, type FormState } from "../form";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Lease dates that won't expire the moment they're saved. */
function checkDates(start: string, end: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start) {
    return "Enter a start date and an end date after it.";
  }
  if (addDays(start, EXPIRE_AFTER_START_DAYS) < todayIso()) {
    return `That start date is more than ${EXPIRE_AFTER_START_DAYS} days ago. Use the date the next person would move in.`;
  }
  return null;
}

export async function createListing(_: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Log in first so buyers can message you." };

  let complexId = Number(str(fd, "complexId"));
  if (str(fd, "complexId") === "other") {
    const name = str(fd, "newComplexName");
    const lat = Number(str(fd, "lat"));
    const lng = Number(str(fd, "lng"));
    if (!name) return { error: "Enter the name of your complex." };
    if (!lat || !lng) return { error: "Tap the map to place your complex." };
    complexId = await findOrAddComplex({
      name,
      address: str(fd, "newComplexAddress") || null,
      lat,
      lng,
      byu_approved: fd.get("newComplexApproved") ? 1 : 0,
      city: str(fd, "newComplexCity") || "Provo",
    });
  }
  if (!complexId || !(await complexExists(complexId))) return { error: "Pick your complex." };

  const rent = Number(str(fd, "rent"));
  const start = str(fd, "startDate");
  const end = str(fd, "endDate");
  const gender = str(fd, "gender");
  const room = str(fd, "room");
  const term = str(fd, "term");
  if (!["men", "women", "coed"].includes(gender)) return { error: "Pick men's, women's or coed housing." };
  if (!["private", "shared"].includes(room)) return { error: "Pick private or shared room." };
  if (!["fall-winter", "spring-summer", "full-year", "other"].includes(term)) return { error: "Pick the contract term." };
  if (!rent || rent < 50 || rent > 5000) return { error: "Enter the monthly rent in dollars." };
  const dateError = checkDates(start, end);
  if (dateError) return { error: dateError };

  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 8);
  for (const f of files) {
    if (!IMAGE_TYPES[f.type]) return { error: `${f.name} is not a JPG, PNG, WebP or GIF image.` };
    if (f.size > 8 * 1024 * 1024) return { error: `${f.name} is over 8 MB.` };
  }
  const photoNames: string[] = [];
  for (const f of files) {
    const name = `${crypto.randomBytes(12).toString("hex")}${IMAGE_TYPES[f.type]}`;
    const blob = await put(name, Buffer.from(await f.arrayBuffer()), { access: "public" });
    photoNames.push(blob.url);
  }

  const listingId = await insertListing(
    {
      seller_id: user.id,
      complex_id: complexId,
      unit: str(fd, "unit") || null,
      housing_gender: gender,
      room_type: room,
      rent_monthly: Math.round(rent),
      deposit: Number(str(fd, "deposit")) || null,
      utilities_included: fd.get("utilities") ? 1 : 0,
      start_date: start,
      end_date: end,
      contract_term: term,
      incentive: str(fd, "incentive") || null,
      parking: fd.get("parking") ? 1 : 0,
      description: str(fd, "description") || null,
      contact_note: str(fd, "contactNote") || null,
      source: user.is_admin && fd.get("seeded") ? "seeded" : "user",
      furnished: fd.get("furnished") ? 1 : 0,
      washer_dryer: pick(str(fd, "washer"), ["in-unit", "on-site", "none"] as const, "on-site"),
      private_bath: str(fd, "bath") === "private" ? 1 : 0,
      pets_allowed: fd.get("pets") ? 1 : 0,
    },
    photoNames
  );

  const phone = str(fd, "phone");
  if (phone) await setPhone(user.id, phone);

  // Check the new listing against every active buyer and alert strong matches.
  const { matched, alerted } = await matchNewListing(listingId);

  revalidatePath("/", "layout");
  redirect(`/listings/${listingId}?posted=1&matched=${matched}&alerted=${alerted}`);
}

async function ownListing(listingId: number) {
  const user = await requireUser(`/listings/${listingId}`);
  if (!user.is_admin && !(await isListingOwner(listingId, user.id))) throw new Error("Not your listing");
}

export async function setListingStatus(fd: FormData) {
  const id = Number(str(fd, "listingId"));
  const status = str(fd, "status");
  if (status !== "active" && status !== "pending" && status !== "sold") return;
  await ownListing(id);
  await setStatus(id, status);
  if (status === "active") await matchNewListing(id);
  revalidatePath("/", "layout");
}

export async function bumpListing(fd: FormData) {
  const id = Number(str(fd, "listingId"));
  await ownListing(id);
  await bump(id);
  revalidatePath("/", "layout");
}

export type RelistState = { error?: string } | undefined;

/** Puts an expired listing back up with new lease dates. */
export async function relistListing(_: RelistState, fd: FormData): Promise<RelistState> {
  const id = Number(str(fd, "listingId"));
  await ownListing(id);
  const start = str(fd, "startDate");
  const end = str(fd, "endDate");
  const dateError = checkDates(start, end);
  if (dateError) return { error: dateError };
  await relist(id, start, end);
  await matchNewListing(id);
  revalidatePath("/", "layout");
  redirect(`/listings/${id}`);
}
