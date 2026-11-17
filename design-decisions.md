# Provo Contracts: design decisions

Agreed with Thomas in the "Refactor web app and lock design choices" thread. Base code: v1.1 (Sub_leasing_app_v1.1_matching.tgz).

## Round 1: stack and hosting (2026-11-09)
- Runs on Thomas's local computer for now. Goes online once the design is settled.
- Keep Next.js + React + Tailwind.
- Keep SQLite with raw SQL (no Postgres or ORM yet).

## Round 2: data model (2026-11-09)
- Merge the quick quiz and the buyer profile into one buyer preferences record. The quiz is a short version of the profile.
- Favorite and avoid complexes are picked from the complex list. Google Form imports are matched to complexes by name.
- Google Form buyers stay as profiles without a login, and link automatically when someone signs up with the same email or phone.
- Listings auto-expire 2 weeks after the lease start date. The seller can relist with one tap.

## Round 3: sign-in and accounts (2026-11-09)
- Keep email and password sign-in. Add "forgot password" once the site can send email.
- BYU/UVU email gets a "Student" badge only. Not required to post or message.
- One account can both buy and sell. No role picker.
- Admin is set by email in a local settings file (.env.local, not committed), not "first signup". Admin: Thomas's Gmail. A dev admin account is seeded on first start; its password lives only in .env.local.

## Round 4: matching and screens (2026-11-09)
- Keep the current scoring weights (price 25, distance 20, timing 15, term 10, favorites 10, furnished/washer/utilities/bath 5 each).
- Alerts for buyers scoring 70+ stay stubbed in the outbox until the site is online.
- Match tab opens on swipe for phones and grid for laptops, chosen automatically. The toggle stays.
- Chat stays inside the app.

## Refactor plan
1. Split `src/lib/actions.ts` into one actions file per area: auth, listings, buyers, chat, swipes, admin.
2. Split the SQL into one query module per area (`src/lib/data/listings.ts`, `buyers.ts`, `chat.ts`, `complexes.ts`, `users.ts`, `swipes.ts`), keeping SQLite and raw SQL.
3. Replace `filters.ts` + the profile shape with one buyer preferences type. The quick quiz writes a partial preferences record (a draft profile for signed-in users, URL params otherwise).
4. Add `buyer_complexes` (profile_id, complex_id, kind = like|avoid). Migrate existing free-text favorites and Google Form imports by name matching. The profile form picks from the complex list.
5. Form-only buyers link to an account automatically on signup or profile save when email or phone matches.
6. Listings expire automatically 2 weeks after the lease start date (checked at most once a minute when listings are read). "Relist" sets them active and bumps them.
7. Admin is set by ADMIN_EMAIL in `.env.local`; a dev admin is seeded from ADMIN_EMAIL + ADMIN_PASSWORD. "First signup becomes admin" is removed.
8. Match tab picks swipe or grid by screen size on first load; the toggle remembers the choice.

## Status
Refactor done and packaged as Sub_leasing_app_v1.2_refactor.tgz (2026-11-09).
Small calls made during the refactor:
- Expiry applies to Active and Pending listings. Relisting asks for new lease dates, since the old start date would expire it again right away.
- Contract length in the quick quiz now ranks listings instead of hiding them, the same as in the profile.
- The quiz's "max walk minutes" became the profile's distance choice (walking, 10 min drive, 20 min drive).
- The Map page now uses the buyer profile when signed in.

## Round 5: visual design (2026-11-13)
Thomas picked the "Wasatch" look from three options (Lease Ticket, Wasatch, Sticker Swap) in the "Redesign app with a modern look" thread.
- Pine green (#24483E) and sage neutrals with a sunset coral accent (#E8805E). Slate is re-tinted toward sage in `globals.css`, so existing slate-* classes follow the theme.
- Sora for headings, DM Sans for body text (loaded from Google Fonts in `layout.tsx`).
- Mountain linework behind the top of every page, soft 28px rounded cards with an inset photo, pill buttons, a floating pill tab bar on phones and a pill nav in the header on laptops.
- Listing cards show a "walk to BYU" route line, a dates pill and a coral incentive pill. Photo placeholders are mountain scenes instead of gradients.
- Map tiles switched to CARTO Voyager (free, attribution kept).
- Backup of the pre-redesign code: versions/Sub_leasing_app_v1.2_before_wasatch.tgz.
