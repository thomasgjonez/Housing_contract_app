import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getListing, getPhotos } from "@/lib/data/listings";
import { conversationFor } from "@/lib/data/chat";
import { publicSeller } from "@/lib/data/users";
import { GENDER_LABEL, TERM_LABEL, addDays, dateLabel } from "@/lib/format";
import { EXPIRE_AFTER_START_DAYS } from "@/lib/config";
import { bumpListing, setListingStatus } from "@/lib/actions/listings";
import { contactSeller } from "@/lib/actions/chat";
import { ListingPhoto } from "@/components/ListingPhoto";
import { IncentivePill, StatusBadge } from "@/components/ListingCard";
import { WalkLine } from "@/components/WalkLine";
import { IconCheck } from "@/components/Icons";
import { CopyLink } from "./CopyLink";
import { buyersForListing, markMatchSeen, profileForUser } from "@/lib/data/buyers";
import { ALERT_MIN_SCORE, scoreListing } from "@/lib/matching";
import { RelistForm } from "./RelistForm";
import { ScoreBadge } from "@/components/ScoreBadge";

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { posted, matched, alerted } = await searchParams;
  const l = await getListing(Number(id));
  if (!l) notFound();
  const photos = await getPhotos(l.id);
  const user = await currentUser();
  const isOwner = user && (user.id === l.seller_id || user.is_admin);
  const seller = await publicSeller(l.seller_id);
  const existing = user ? await conversationFor(l.id, user.id) : null;
  const expired = l.status === "expired";

  const buyers = isOwner ? await buyersForListing(l.id) : [];
  const strong = buyers.filter((b) => b.match.score >= ALERT_MIN_SCORE).length;
  const myProfile = user && !isOwner ? await profileForUser(user.id) : null;
  const myMatch = myProfile ? scoreListing(myProfile, l) : null;
  if (user && !isOwner) await markMatchSeen(user.id, l.id);
  const WD: Record<string, string> = { "in-unit": "In unit", "on-site": "On-site laundry", none: "None" };

  const facts: [string, string][] = [
    ["Rent", `$${l.rent_monthly}/month`],
    ["Deposit", l.deposit ? `$${l.deposit}` : "Not listed"],
    ["Utilities", l.utilities_included ? "Included" : "Not included"],
    ["Housing", `${GENDER_LABEL[l.housing_gender]}, ${l.room_type} room`],
    ["Contract", `${TERM_LABEL[l.contract_term]}, ${dateLabel(l.start_date)} to ${dateLabel(l.end_date)}`],
    ["Parking", l.parking ? "Included" : "No"],
    ["Bathroom", l.private_bath ? "Private" : "Shared"],
    ["Washer/dryer", WD[l.washer_dryer] ?? l.washer_dryer],
    ["Furnished", l.furnished ? "Yes" : "No"],
    ["Pets", l.pets_allowed ? "Allowed" : "Not allowed"],
    ["Area", l.city],
    ["Walk to campus", `About ${l.walk_minutes} min`],
    ["BYU-approved", l.byu_approved ? "Yes" : "No"],
  ];
  if (l.unit) facts.splice(4, 0, ["Unit", l.unit]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {posted && (
        <div className="rounded-[28px] bg-brand-600 p-6 text-white shadow-lift">
          <div className="font-display text-lg font-semibold">Your contract is live</div>
          <p className="mt-1 text-sm text-brand-100">
            Share this link in your Facebook housing group posts too. Buyers get photos, a map and a way to message you.
          </p>
          {matched !== undefined && (
            <p className="mt-2 text-sm font-semibold text-white">
              {Number(matched) === 0
                ? "No buyer profiles match it yet. We'll keep checking as buyers sign up."
                : `It fits ${matched} active ${Number(matched) === 1 ? "buyer" : "buyers"}${Number(alerted) ? `, and ${alerted} strong ${Number(alerted) === 1 ? "match was" : "matches were"} alerted` : ""}.`}
            </p>
          )}
          <CopyLink path={`/listings/${l.id}`} />
        </div>
      )}

      <div className={`grid gap-2 overflow-hidden rounded-[28px] bg-white p-2.5 shadow-soft ${photos.length > 1 ? "sm:grid-cols-[2fr_1fr]" : ""}`}>
        <ListingPhoto photo={photos[0] ?? null} complex={l.complex} id={l.id} className="h-72 w-full rounded-[20px] sm:h-96" />
        {photos.length > 1 && (
        <div className="hidden grid-rows-2 gap-2 sm:grid">
          {photos.slice(1, 3).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={p} alt="" className="h-full w-full rounded-[20px] object-cover" />
          ))}
        </div>
        )}
      </div>
      {photos.length > 3 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.slice(3).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={p} alt="" className="h-24 w-32 shrink-0 rounded-2xl object-cover" />
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2"><StatusBadge status={l.status} source={l.source} /></div>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <h1 className="text-3xl font-semibold md:text-4xl">{l.complex}</h1>
              <div className="font-display text-3xl font-bold">${l.rent_monthly}<span className="text-base font-medium text-slate-500"> /month</span></div>
            </div>
            <div className="mt-3 max-w-md"><WalkLine minutes={l.walk_minutes} /></div>
            {myProfile && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                {myMatch ? (
                  <>
                    <ScoreBadge score={myMatch.score} />
                    {myMatch.reasons.map((r) => <span key={r} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"><IconCheck /> {r}</span>)}
                  </>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Doesn&apos;t fit one of your dealbreakers</span>
                )}
              </div>
            )}
            {l.incentive && <div className="mt-3"><IncentivePill text={l.incentive} /></div>}
          </div>
          {l.description && <p className="whitespace-pre-line text-slate-700">{l.description}</p>}
          <dl className="card divide-y divide-slate-100 px-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-slate-500">
            When you agree on a deal, the transfer is finished with {l.complex}&apos;s office. Ask them about their transfer fee before you pay anyone.
          </p>
        </div>

        <aside id="message" className="space-y-4">
          <div className="card space-y-3 p-5">
            <div className="text-sm text-slate-500">Listed by</div>
            <div className="font-semibold">
              {seller.name} {seller.school_email_verified ? <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700"><IconCheck className="h-3 w-3" /> Student</span> : null}
            </div>
            {l.contact_note && <p className="text-sm text-slate-600">{l.contact_note}</p>}
            {isOwner ? (
              <p className="text-sm text-slate-600">This is your listing.</p>
            ) : l.source === "sample" ? (
              <p className="text-sm text-amber-800">This is a sample listing to show how the app works.</p>
            ) : expired ? (
              <p className="text-sm text-slate-600">This listing has expired.</p>
            ) : existing ? (
              <Link href={`/inbox/${existing.id}`} className="btn-primary w-full">Open your conversation</Link>
            ) : user ? (
              <form action={contactSeller} className="space-y-2">
                <input type="hidden" name="listingId" value={l.id} />
                <textarea name="body" required rows={3} className="input" defaultValue={`Hi! Is your ${l.complex} contract still available?`} />
                <button className="btn-primary w-full">Message seller</button>
              </form>
            ) : (
              <Link href={`/login?next=/listings/${l.id}`} className="btn-primary w-full">Log in to message</Link>
            )}
          </div>

          {isOwner && (
            <div className="card space-y-3 p-5">
              <div className="font-semibold">Manage listing</div>
              {expired ? (
                <RelistForm listingId={l.id} />
              ) : (
              <>
              <p className="text-xs text-slate-500">
                Expires on its own {dateLabel(addDays(l.start_date, EXPIRE_AFTER_START_DAYS))}, two weeks after the lease start date.
              </p>
              <form action={setListingStatus} className="flex flex-wrap gap-2">
                <input type="hidden" name="listingId" value={l.id} />
                {(["active", "pending", "sold"] as const).map((s) => (
                  <button key={s} name="status" value={s} disabled={l.status === s} className={l.status === s ? "btn-primary !py-1.5" : "btn-ghost !py-1.5"}>
                    {s === "active" ? "Active" : s === "pending" ? "Pending" : "Sold"}
                  </button>
                ))}
              </form>
              <div className="rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
                <b>{buyers.length}</b> active {buyers.length === 1 ? "buyer fits" : "buyers fit"} this listing{strong ? <>, <b>{strong}</b> strongly</> : null}.
              </div>
              <form action={bumpListing}>
                <input type="hidden" name="listingId" value={l.id} />
                <button className="btn-ghost w-full !py-1.5">Bump to the top</button>
              </form>
              </>
              )}
            </div>
          )}

          {user?.is_admin && buyers.length > 0 ? (
            <div className="card space-y-2 p-5">
              <div className="font-semibold">Matching buyers <span className="text-xs font-normal text-slate-500">(admin only)</span></div>
              <ul className="divide-y divide-slate-100 text-sm">
                {buyers.slice(0, 12).map(({ profile: b, match }) => (
                  <li key={b.id} className="space-y-0.5 py-2">
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{b.name}</span><ScoreBadge score={match.score} /></div>
                    <div className="text-xs text-slate-500">{[b.contact_method, b.phone, b.email].filter(Boolean).join(" · ")}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
