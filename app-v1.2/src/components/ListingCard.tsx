import Link from "next/link";
import { ListingPhoto } from "./ListingPhoto";
import { GENDER_LABEL, TERM_LABEL, dateLabel } from "@/lib/format";

export type CardListing = {
  id: number;
  complex: string;
  photo: string | null;
  rent_monthly: number;
  housing_gender: string;
  room_type: string;
  start_date: string;
  end_date: string;
  contract_term: string;
  walk_minutes: number;
  incentive: string | null;
  status: string;
  source: string;
};

export function StatusBadge({ status, source }: { status: string; source: string }) {
  return (
    <span className="flex gap-1">
      {source === "sample" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Sample</span>}
      {status === "pending" && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">Pending</span>}
      {status === "sold" && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">Sold</span>}
      {status === "expired" && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">Expired</span>}
    </span>
  );
}

export function ListingCard({ l }: { l: CardListing }) {
  return (
    <Link href={`/listings/${l.id}`} className="card block overflow-hidden transition hover:shadow-md">
      <ListingPhoto photo={l.photo} complex={l.complex} id={l.id} className="h-40 w-full" />
      <div className="space-y-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold">${l.rent_monthly}<span className="text-sm font-normal text-slate-500">/mo</span></span>
          <StatusBadge status={l.status} source={l.source} />
        </div>
        <div className="font-semibold">{l.complex}</div>
        <div className="text-sm text-slate-600">
          {GENDER_LABEL[l.housing_gender]} · {l.room_type === "private" ? "Private" : "Shared"} room · {l.walk_minutes} min walk
        </div>
        <div className="text-sm text-slate-600">
          {TERM_LABEL[l.contract_term]}: {dateLabel(l.start_date)} to {dateLabel(l.end_date)}
        </div>
        {l.incentive && <div className="text-sm font-medium text-emerald-700">🎁 {l.incentive}</div>}
      </div>
    </Link>
  );
}
