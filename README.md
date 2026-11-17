# Provo Contracts

A marketplace for Provo students to sell or sublease housing contracts: a swipe matcher, a map, a "list your contract" form, and in-app messaging. It runs locally on your machine.

## Run it

Needs Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**Settings live in `.env.local`** (copy `.env.local.example` if you don't have one). `ADMIN_EMAIL` is the only account with the Admin pages. If `ADMIN_PASSWORD` is set, that account is created the first time the app starts, so you can log in straight away. `.env.local` is never committed. To try it on your phone, connect to the same Wi-Fi and open `http://<your-mac's-IP>:3000` (find the IP in System Settings > Wi-Fi > Details).

The first time it starts, it creates `data/app.db` (SQLite) with 10 Provo complexes and 12 **sample** listings so the matcher and map aren't empty. Uploaded photos go in `data/uploads/`.

- **Admin is whoever `ADMIN_EMAIL` names.** The Admin page lets you fix complex map pins, edit complex details, and delete all sample listings.
- `npm run reset-db` deletes the database so the next start reseeds it.

## Buyer matching (new in v1.1)

Sellers are plentiful and buyers are picky, so buyers fill out a profile once and the site does the matching.

- **Buyer profile** (`/profile`, or "Get matched" on the home page): the same questions as the Google Form. Dealbreakers (men's/women's, BYU-approved, budget, private or shared room, move-in date and flexibility, area, parking, pets, complexes to avoid, must-have furnished or utilities) hide listings that won't work.
- **Ranking**: everything left gets a 0–100 score from the nice-to-haves: price under budget (25), distance to campus (20), move-in timing (15), contract length or semesters (10), favorite complexes (10), and furnished, washer/dryer, utilities and private bathroom (5 each). Complexes a buyer has already swiped right on get a small boost. Each card shows its % match and the top reasons.
- **Swipe / Grid toggle** on the Match tab. Both use the same profile or filters and the same likes: a right swipe and a ♥ in the grid land in the same Saved list. The grid sorts by match, price, walk or move-in date.
- **New listings are matched automatically.** When a listing is posted (or set back to Active), it's checked against every active buyer. The seller sees how many buyers it fits; buyers scoring 70+ get an alert and a "New" badge.
- **Alerts are stubbed.** No email or text service is connected, so alerts are saved to an outbox (Admin → Buyers and matching) and printed in the terminal. Connect a provider in `src/lib/notify.ts`.
- **Import your Google Form responses**: Admin → Buyers and matching → upload the responses sheet as CSV. Re-importing updates buyers by email or phone instead of duplicating them. The admin page lists every buyer with their top matches and contact info, and each listing page shows admins which buyers fit it.
- The quick search (`/find`) still works for people without a profile, through the same matcher.

Existing databases are upgraded in place on start (new listing fields default to furnished, on-site laundry, shared bath, no pets). A fresh database also gets 4 sample buyers, removed with "Delete all samples".

The matching rules are in `src/lib/matching.ts`; weights are at the top of the file.

## What changed in v1.2

- **One buyer preferences model.** The quick quiz (`/find`) is the first questions of the buyer profile, built from the same fields (`src/components/PreferenceFields.tsx`) and parsed by the same code (`src/lib/preferences.ts`). Signed in, quiz answers start or update your profile. Signed out, they go in the URL, so a link can be shared.
- **Favorite and avoided complexes are picked from the complex list** and stored in `buyer_complexes`. Google Form answers are matched to complexes by name; names that match nothing are shown to the admin on Buyers and matching.
- **Google Form buyers link to accounts.** When someone signs up, logs in or saves a profile with the same email or phone as a form response (or a form response is imported for an existing account), the two are joined.
- **Listings expire two weeks after the lease start date.** The seller sees a Relist form with new dates on the listing page.
- **Match tab** opens on swipe on phones and the grid on laptops, and remembers which one you last picked.
- The Map uses your profile too, not only quiz answers.
- Existing databases upgrade themselves on start (tracked with SQLite's `user_version`).

## What's where

| Page | File |
| --- | --- |
| Home | `src/app/page.tsx` |
| Quick quiz | `src/app/find/page.tsx` |
| Match (swipe and grid) | `src/app/match/` |
| Buyer profile | `src/app/profile/` |
| Admin: buyers, import, alert outbox | `src/app/admin/buyers/` |
| Map | `src/app/map/` (Leaflet + OpenStreetMap tiles) |
| Listing detail | `src/app/listings/[id]/` |
| List your contract | `src/app/sell/` |
| Inbox and chat | `src/app/inbox/` |
| My listings and saved | `src/app/me/page.tsx` |
| Admin | `src/app/admin/` |

Logic lives in `src/lib/`:

- `db/`: the connection (`index.ts`), schema and migrations (`schema.ts`), sample data (`seed.ts`), admin setup (`admin.ts`).
- `data/`: every SQL query, one file per area: `listings.ts` (including expiry), `buyers.ts` (profiles, form linking and import, new-listing matching), `chat.ts`, `complexes.ts`, `users.ts`, `swipes.ts`.
- `actions/`: every form and button that changes data, one file per area: `auth.ts`, `buyers.ts`, `listings.ts`, `chat.ts`, `swipes.ts`, `admin.ts`.
- `preferences.ts` (what a buyer wants), `matching.ts` (dealbreakers and scoring), `currentPreferences.ts` (profile vs URL), `formImport.ts` (Google Form CSV), `notify.ts` (alerts), `auth.ts` (sessions), `config.ts` (settings from `.env.local`), `format.ts`, `geo.ts`.

## Known limits of v1

- Complex map pins are approximate until fixed on the Admin page, and BYU-approved flags should be checked.
- Walk times are estimated from straight-line distance to the middle of campus.
- Messages refresh every 4 seconds. Match alerts are stubbed (saved to an outbox, not sent) until an email or text provider is connected.
- No password reset and no email verification. A BYU or UVU email gets a "Student" badge without being verified (badge only, by design).
- Built for one machine. Going online is the next step once the design is settled; the SQL is already split by area to make that move easier.
- Quick quiz links from v1.1 (`?maxRent=...`) no longer apply their filters; the URL now uses the profile field names (`?max_rent=...`).
