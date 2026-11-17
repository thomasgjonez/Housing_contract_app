"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth";
import { deleteSampleBuyers, importFormBuyers, setProfileActive } from "../data/buyers";
import { moveComplexPin, updateComplexDetails } from "../data/complexes";
import { deleteSampleListings } from "../data/listings";
import { str } from "../form";
import { rowsToProfiles } from "../formImport";

export async function moveComplex(complexId: number, lat: number, lng: number) {
  await requireAdmin();
  moveComplexPin(complexId, lat, lng);
  revalidatePath("/", "layout");
}

export async function updateComplex(fd: FormData) {
  await requireAdmin();
  updateComplexDetails(Number(str(fd, "id")), {
    name: str(fd, "name"),
    city: str(fd, "city") || "Provo",
    byu_approved: fd.get("byuApproved") ? 1 : 0,
    management_company: str(fd, "managementCompany") || null,
    pms: str(fd, "pms") || null,
  });
  revalidatePath("/", "layout");
}

export async function deleteSamples() {
  await requireAdmin();
  deleteSampleListings();
  deleteSampleBuyers();
  revalidatePath("/", "layout");
}

export type ImportState = { error?: string; added?: number; updated?: number; skipped?: number } | undefined;

export async function importBuyers(_: ImportState, fd: FormData): Promise<ImportState> {
  await requireAdmin();
  const file = fd.get("csv");
  const text = file instanceof File && file.size > 0 ? await file.text() : str(fd, "pasted");
  if (!text) return { error: "Choose the CSV you downloaded from the responses sheet." };
  const { profiles, skipped, missing } = rowsToProfiles(text);
  if (missing.length) return { error: `Couldn't find these columns: ${missing.join(", ")}. Download the responses sheet as CSV.` };
  const { added, updated } = importFormBuyers(profiles);
  revalidatePath("/admin/buyers");
  return { added, updated, skipped };
}

export async function setBuyerActive(fd: FormData) {
  await requireAdmin();
  setProfileActive(Number(str(fd, "id")), str(fd, "active") === "1");
  revalidatePath("/admin/buyers");
}
