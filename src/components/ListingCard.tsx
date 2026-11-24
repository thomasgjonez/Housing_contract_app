import Link from "next/link";
import { ListingPhoto } from "./ListingPhoto";
import { WalkLine } from "./WalkLine";
import { IconGift } from "./Icons";
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
  contracts_available: number;
};

export function StatusBadge({ status, source }: { status: string; source: string }) {
  return (
    <span className="flex gap-1">
      {source === "sample" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Sample</span>}
      {status === "pending" && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">Pending</span>}
      {status === "sold" && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">Sold</span>}
      {status === "expired" && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">Expired</span>}
    </span>
  );
}

/** Dates as a short pill: "Aug 22, 2026 – Apr 25, 2027". */
export function DatesPill({ start, end, term }: { start: string; end: string; term?: string }) {
  return (
    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
      {term ? `${TERM_LABEL[term]} · ` : ""}{dateLabel(start)} – {dateLabel(end)}
    </span>
  );
}

export function IncentivePill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sunset-100 px-3 py-1 text-xs font-medium text-sunset-800">
      <IconGift className="h-3.5 w-3.5" /> {text}
    </span>
  );
}

export function ContractsPill({ n }: { n: number }) {
  if (n <= 1) return null;
  return (
    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
      {n} contracts available
    </span>
  );
}

export function ListingCard({ l }: { l: CardListing }) {
  return (
    <Link href={`/listings/${l.id}`} className="card group block p-2.5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="card-inset relative">
        <ListingPhoto photo={l.photo} complex={l.complex} id={l.id} className="h-40 w-full transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3"><StatusBadge status={l.status} source={l.source} /></div>
      </div>
      <div className="space-y-3 px-2 pb-2 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold">{l.complex}</div>
            <div className="text-sm text-slate-600">{GENDER_LABEL[l.housing_gender]} · {l.room_type === "private" ? "Private" : "Shared"} room</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-xl font-bold">${l.rent_monthly}</div>
            <div className="text-xs text-slate-500">per month</div>
          </div>
        </div>
        <WalkLine minutes={l.walk_minutes} />
        <div className="flex flex-wrap gap-1.5">
          <DatesPill start={l.start_date} end={l.end_date} term={l.contract_term} />
          {l.incentive && <IncentivePill text={l.incentive} />}
          <ContractsPill n={l.contracts_available} />
        </div>
      </div>
    </Link>
  );
}
