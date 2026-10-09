# Development Guide — Kolab.id

Technical documentation for developers working on Kolab.id. For the product overview see [README.md](./README.md); for information architecture and task flows see [ARCHITECTURE.md](./ARCHITECTURE.md); for design tokens and components see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

> **Migration status:** the data layer has moved to Supabase/Postgres and Supabase Auth. `rls-access-control` and `auth-session` are applied and archived; the catalog/booking core loop is in progress. Where this guide still says "target" or "pending", treat §6, §8 and §9 as the current truth. No local SQLite, no mock cookie.

## 1. Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Framework | Next.js 16.3.6 (App Router) | Server Components + Server Actions |
| Language | TypeScript 5 | Strict mode (see `tsconfig.json`) |
| UI | React 19.2.8, Tailwind CSS v4 (`@tailwindcss/postcss`) | Utility-first styling; tokens in DESIGN_SYSTEM.md, implemented as `@theme` in `app/globals.css` |
| Icons | lucide-react 1.47.0 | — |
| Database | Supabase (managed Postgres) | Accessed via `@supabase/ssr` + `@supabase/supabase-js`. Replaces local SQLite |
| Auth | Supabase Auth (see §9) | Replaces the mock `kolab_session` cookie |
| Fonts | Plus Jakarta Sans via `next/font/local` | Self-hosted, fully offline (no Google Fonts fetch) |
| Tooling | ESLint 9 + `eslint-config-next`, `tsx` 4.x (seed runner), Supabase CLI (migrations & type gen) | — |

No ORM is required — reads/writes go through the Supabase JS client (PostgREST) and versioned SQL migrations. No local DB file, no native bindings.

## 2. Prerequisites

- **Node.js 20+** (22 LTS recommended). The old `node:sqlite` >= 22.5 requirement no longer applies.
- npm (ships with Node).
- A **Supabase project** (free tier is enough): https://supabase.com/dashboard
- Supabase CLI — optional but recommended for migrations and type generation (`npm i -g supabase`).

## 3. Setup (Local Development)

**Step 1 — Create a Supabase project** and grab the credentials (Dashboard → Project Settings → API):

| Key | Env var | Used where |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Browser + server |
| Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server (safe to expose) |
| Secret key (`sb_secret_...`, formerly service-role) | `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — seeding / admin actions |

> Older projects show a legacy `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) instead of a publishable key — it works the same way in the snippets below.

**Step 2 — Install and configure:**

```bash
npm install
npm install @supabase/ssr @supabase/supabase-js
```

Create `.env.local` (gitignored) in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

**Step 3 — Migrate, seed, run:**

```bash
npm run db:migrate  # apply supabase/migrations/*.sql (or paste the SQL into Dashboard → SQL Editor)
npm run db:seed     # insert demo data (12 creators, 36 packages, 4 UMKMs, 9 bookings + reviews)
npm run dev         # http://localhost:3000
```

Restart `npm run dev` after any `.env.local` change — Next.js only loads env vars at startup.

Re-running `npm run db:seed` resets the demo data (truncate + re-insert).

## 4. NPM Scripts

| Script | Purpose |
| --- | --- |
| `dev` | `next dev` — local dev server with hot reload |
| `build` | `next build` — production build |
| `start` | `next start` — serve the production build |
| `lint` | `eslint` — lint the codebase |
| `db:reset` | Drop, recreate and reseed the **local Postgres** stack (`supabase db reset`), running `supabase/seed.sql` |
| `db:migrate` | Apply `supabase/migrations/*.sql` to the linked project (`supabase db push`) |
| `db:seed` | Seed the retired **SQLite** mirror (`data.db`) from `lib/seed.ts`. The app no longer reads it — see §9 — but the historical verification scripts still compare the two stores |
| `db:types` | Regenerate typed schema (`supabase gen types typescript --local > utils/supabase/database.types.ts`). Use `--linked` instead of `--local` once a remote project is linked |
| `verify:auth` | End-to-end check of sign-up, onboarding, sign-in and sign-out, driven over HTTP (`scripts/verify-auth.ps1`) |
| `verify:rls` | Check every RLS policy against PostgREST, anonymously and as four real accounts (`scripts/verify-rls.ps1`) |
| `verify` | Both of the above |

Two helpers back those checks and are usable on their own: `scripts/sign-in-as.ps1`
signs in as any seeded account and replays the session cookie, which is how the role
matrix is driven; `scripts/sqlite-query.mjs` runs one SQL statement against `data.db`
and prints JSON.

## 5. Production Build

```bash
npm run build
npm start
# open http://localhost:3000
```

Notes:

- Deploy as a Node.js app (Vercel is the path of least resistance for Next.js). Static export is not possible — pages read the DB at runtime.
- Set the same three env vars on the host. Never use a `NEXT_PUBLIC_` prefix for the secret key.
- No local DB file anymore: the SQLite `database is locked` / WAL / writable-filesystem problems disappear. Postgres handles concurrent writers.
- Enable Row Level Security (RLS) policies before launch (see §8) so the publishable key cannot write arbitrarily.

## 6. Project Structure (Target)

```
app/
  (umkm)/                 # Route group: UMKM pages WITHOUT global navbar/footer (URLs unchanged)
    layout.tsx            # Pass-through (sidebar+header come from UmkmShell per page)
    dashboard/
      page.tsx            # UMKM dashboard: KPI cards, recommendations, history summary
      riwayat/            # Full UMKM collaboration history
      profile/            # UMKM business profile view + edit
      chat/               # Chat list, one thread per booking (ARCHITECTURE.md §2.7)
  actions.ts              # Server Actions: login/logout, submitBooking, submitReview,
                          # booking-lifecycle (accept/decline/pay/submit/revision/approve/cancel/dispute),
                          # updateProfile, sendMessage, markChatRead, offers (see ARCHITECTURE.md)
  page.tsx                # Landing page
  influencers/            # Creator list + filters, creator detail (packages, reviews)
  booking/[influencerId]/ # Collaboration request form: creates PENDING booking + chat room (UMKM-only guard)
  review/[bookingId]/     # Two-way rating & review form (after COMPLETED booking or dispute decision)
  insights/               # Market price insights per category
  dashboard/
    influencer/           # Creator dashboard (chat is live; paket/ and shell planned — see ARCHITECTURE.md §4)
  admin/                  # Admin: dashboard, Antrian Kasus, Detail Kasus, profile (see ARCHITECTURE.md §5)
  login/                  # Login / signup pages (Supabase Auth, see §9)
components/               # Navbar, Footer, DashboardShell (sidebar+header), UmkmShell (server wrapper),
                          # NotificationBell, BookingHistoryList, StarRating, etc.
lib/
  supabase/
    client.ts             # Browser client (createBrowserClient) — "use client" only
    server.ts             # Server client (createServerClient + cookies) — Server Components/Actions
    database.types.ts     # Generated types (npm run db:types). Replaces hand-written types where applicable
  data/                   # Postgres query modules — catalog.ts (public reads),
                          # bookings.ts (party-scoped reads), palette.ts (category colours)
  auth.ts                 # Session/role helpers on top of supabase.auth.getUser() (replaces cookie mock)
  format.ts               # Rupiah / number / date formatting
  types.ts                # Shared TypeScript types
middleware.ts             # Auth session refresh (updateSession) + route guards
supabase/
  migrations/             # Versioned SQL schema. Postgres is the app's only store;
                          # lib/db.ts + lib/seed.ts + scripts/seed.ts remain only to
                          # keep the historical SQLite↔Postgres verification scripts runnable.
```

Key client snippets (per current Supabase docs, `@supabase/ssr`):

```ts
// utils/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

```ts
// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — session refresh is handled by middleware.
          }
        },
      },
    }
  );
}
```

```ts
// middleware.ts — refreshes the session cookie on every request.
// Without this, users get randomly logged out.
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: Request) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

> Do not create the server client once globally and reuse it — always create a new client per request.

## 7. Routes

| Route | Description | Access |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/influencers` | Creator list + search/filter/sort | Public |
| `/influencers/[id]` | Creator profile, packages, UMKM reviews | Public |
| `/booking/[influencerId]` | Submit collaboration request (creates `PENDING` booking + chat room) | Supabase session + `umkm` role |
| `/dashboard` | UMKM dashboard (sidebar shell, KPI cards, recommendations, history summary) | Supabase session + `umkm` role |
| `/dashboard/riwayat` | Full UMKM collaboration history | Supabase session + `umkm` role |
| `/dashboard/profile` | UMKM business profile view + edit | Supabase session + `umkm` role |
| `/dashboard/chat` | UMKM chat list, one conversation per booking, read from the database | Supabase session + `umkm` role |
| `/dashboard/influencer` | Creator dashboard: incoming requests, status updates, income | Supabase session + `influencer` role |
| `/dashboard/influencer/chat` | Creator chat list, one conversation per booking, read from the database | Supabase session + `influencer` role |
| `/dashboard/influencer/paket` | (planned) `Paket & Harga` management — see ARCHITECTURE.md §4.6 | Supabase session + `influencer` role |
| `/admin` | (planned) Admin dashboard: case queue summary — see ARCHITECTURE.md §5 | Supabase session + `admin` role |
| `/admin/kasus` | (planned) `Antrian Kasus` full list — see ARCHITECTURE.md §5.7 | Supabase session + `admin` role |
| `/admin/kasus/[id]` | (planned) `Detail Kasus` + decision panel — see ARCHITECTURE.md §5.7 | Supabase session + `admin` role |
| `/review/[bookingId]` | Two-way rating after `COMPLETED` booking or dispute decision | Involved party only |
| `/insights` | Market price standards per category (min/avg/max) | Public |
| `/login` | Login (Supabase Auth) | Public (redirects away if already signed in) |
| `/signup` | Signup (Supabase Auth) | Public (redirects away if already signed in) |
| `/onboarding` | Role picker + business/creator details (creates `profiles` row) | Signed-in users without a profile |
| `/auth/callback` | OAuth code-exchange callback (no UI) | Public |

Guards move from parsing the mock cookie to `supabase.auth.getUser()` in Server Components/Actions plus middleware redirects.

## 8. Database Schema (Postgres)

The schema lives in versioned migrations (`supabase/migrations/0001_init.sql`), not in app code. It implements the product spec in ARCHITECTURE.md §2 (escrow lifecycle) and §6 (data model): Postgres port of the prototype tables, plus payment/revision/dispute/chat/notification tables.

```sql
create table if not exists influencers (
  id          bigint generated always as identity primary key,
  name        text not null,
  handle      text not null unique,
  niche       text not null,
  city        text not null,
  followers   integer not null,
  base_price  integer not null,
  rating      numeric not null default 0,
  review_count integer not null default 0,
  verified    boolean not null default false,
  bio         text not null default '',
  color       text not null default 'from-indigo-500 to-violet-500'
);

create table if not exists packages (
  id             bigint generated always as identity primary key,
  influencer_id  bigint not null references influencers(id) on delete cascade,
  name           text not null,
  price          integer not null,
  summary        text not null default '',
  includes       jsonb not null default '[]',
  revision_quota integer not null default 1 check (revision_quota between 1 and 5),
  estimated_days integer not null default 3
);

create table if not exists umkms (
  id       bigint generated always as identity primary key,
  name     text not null,
  owner    text not null,
  category text not null,
  city     text not null
);

create table if not exists bookings (
  id                 bigint generated always as identity primary key,
  code               text not null unique,
  influencer_id      bigint not null references influencers(id),
  umkm_id            bigint not null references umkms(id),
  package_name       text not null,
  amount             integer not null,
  message            text not null default '',
  status             text not null default 'PENDING'
    check (status in ('PENDING','ACCEPTED','FUNDED','SUBMITTED','REVISION','DISPUTED','COMPLETED','REJECTED','CANCELLED')),
  -- Snapshot of package terms at submit time (later package edits don't affect running bookings)
  revision_quota     integer not null default 1,
  estimated_days     integer not null default 3,
  revisions_used     integer not null default 0,
  brief_locked_at    timestamptz,
  funded_at          timestamptz,
  submitted_at       timestamptz,
  review_due_at      timestamptz,
  -- Simulated escrow (no real money moves in the prototype)
  payment_status     text not null default 'UNPAID'
    check (payment_status in ('UNPAID','HELD','RELEASED','REFUNDED','SPLIT')),
  creator_amount     integer not null default 0,
  umkm_refund_amount integer not null default 0,
  created_at         timestamptz not null default now()
);

-- One content version per round submitted by the creator
create table if not exists deliveries (
  id          bigint generated always as identity primary key,
  booking_id  bigint not null references bookings(id) on delete cascade,
  round       integer not null,
  content_url text not null default '',
  note        text not null default '',
  submitted_at timestamptz not null default now(),
  unique (booking_id, round)
);

-- Revision requests; off_brief = flagged as not matching the locked brief (no quota consumed)
create table if not exists revision_requests (
  id         bigint generated always as identity primary key,
  booking_id bigint not null references bookings(id) on delete cascade,
  round      integer not null,
  section    text not null default '',
  note       text not null default '',
  off_brief  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Settlement offers (extra revision, discount, cancellation): no extra booking statuses needed
create table if not exists resolution_offers (
  id           bigint generated always as identity primary key,
  booking_id   bigint not null references bookings(id) on delete cascade,
  offered_by   text not null check (offered_by in ('umkm','influencer')),
  kind         text not null check (kind in ('extra_revision','discount','cancellation')),
  value_text   text not null default '',
  value_amount integer not null default 0,
  status       text not null default 'PENDING'
    check (status in ('PENDING','ACCEPTED','DECLINED','EXPIRED')),
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- One conversation per booking
create table if not exists conversations (
  id         bigint generated always as identity primary key,
  booking_id bigint not null unique references bookings(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id              bigint generated always as identity primary key,
  conversation_id bigint not null references conversations(id) on delete cascade,
  sender_role     text not null check (sender_role in ('umkm','influencer','admin')),
  body            text not null default '',
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists disputes (
  id                    bigint generated always as identity primary key,
  booking_id            bigint not null unique references bookings(id) on delete cascade,
  opened_by             text not null check (opened_by in ('umkm','influencer')),
  reason                text not null default '',
  status                text not null default 'OPEN'
    check (status in ('OPEN','NEED_INFO','RESOLVED')),
  decision              text check (decision in ('RELEASE_FULL','REFUND_FULL','SPLIT')),
  creator_share_percent integer,
  decision_note         text not null default '',
  decided_by            uuid references auth.users(id),
  decided_at            timestamptz,
  due_at                timestamptz not null,
  created_at            timestamptz not null default now()
);

create table if not exists notifications (
  id         bigint generated always as identity primary key,
  recipient  uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  booking_id bigint references bookings(id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id                     bigint generated always as identity primary key,
  booking_id             bigint not null references bookings(id) on delete cascade,
  reviewer_role          party_role not null,
  reviewee_umkm_id       bigint references umkms(id) on delete restrict,
  reviewee_influencer_id bigint references influencers(id) on delete restrict,
  rating                 integer not null check (rating between 1 and 5),
  comment                text,
  created_at             timestamptz not null default now(),
  unique (booking_id, reviewer_role),
  check (num_nonnulls(reviewee_umkm_id, reviewee_influencer_id) = 1)
);

-- The reviewer is one of the booking's two parties and the reviewee is the
-- other, so both are derived from the booking and never taken from the request
-- body. Reviews open once the booking is COMPLETED (a dispute decision would
-- open them too, but that capability does not exist yet, so the only reachable
-- path is COMPLETED). A review's rating and count live on `influencers` and are
-- maintained by a database trigger; a recorded review is immutable.

-- One login per UMKM / creator / admin. Links Supabase Auth users to domain rows.
-- Admins are created manually (no signup/onboarding) with both FKs null.
create table if not exists profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('umkm', 'influencer', 'admin')),
  umkm_id       bigint references umkms(id) on delete cascade,
  influencer_id bigint references influencers(id) on delete cascade,
  created_at    timestamptz not null default now(),
  check (
    (role = 'umkm'       and umkm_id is not null       and influencer_id is null) or
    (role = 'influencer' and influencer_id is not null and umkm_id is null) or
    (role = 'admin'      and umkm_id is null           and influencer_id is null)
  )
);
```

Type differences from SQLite to be aware of when porting `lib/data.ts`:

- `INTEGER PRIMARY KEY AUTOINCREMENT` → `bigint generated always as identity primary key`
- `verified INTEGER 0/1` → `boolean`
- `includes TEXT` (JSON string) → `jsonb`
- `created_at TEXT` (ISO string) → `timestamptz default now()`
- `rating REAL` → `numeric` (comes back from PostgREST as a string — cast with `Number()`)

### Row Level Security (RLS)

**Applied.** RLS is enabled on all 17 tables and the baseline policies ship in
`supabase/migrations/20261003103000_rls_baseline.sql`. Do not re-run the
`enable row level security` block below — the dump already enables it, and the
`ensure_rls` event trigger in the dump turns it on for any table created later
regardless.

Read policies, all `for select` only:

| Table | Policy | Who |
| --- | --- | --- |
| `categories`, `influencers`, `packages`, `umkms`, `reviews` | `*_public_read` using `(true)` | anyone, including signed out |
| `profiles` | `profiles_own_read` using `user_id = auth.uid()` | the profile owner |
| `bookings` | `bookings_party_read` | the UMKM or creator named on the row |
| `deliveries`, `revision_requests`, `payments`, `booking_events` | `*_party_read` | the two parties of the parent booking |

Party scope is a subquery against `profiles`, repeated in each child policy
rather than factored into a helper, so authorizing a booking and forgetting its
children would be a visible omission instead of a shared predicate that silently
propagates the mistake.

`reviews.reviewee_umkm_id` / `reviews.reviewee_influencer_id` exist so creator
reviews are reachable without joining through `bookings`. Under the policy above
that join is party-scoped, so a signed-out visitor on a public creator page would
otherwise get zero reviews. Those columns say *which creator* was reviewed, but
not *which business wrote the review* — that business is only recorded on
`bookings`. `public.influencer_reviews` (a read-only, owner-rights view created by
the reviews migration) resolves that link once and exposes only the public review
fields plus the public business profile, which is what lets a signed-out visitor
see the author's name. Public review reads go through the view, not `reviews`.

**No write policy exists anywhere.** Writes go through Server Actions using a
service-role client, which bypasses RLS and therefore authorizes in application
code. The publishable key can read the catalog and nothing more.

**The read/write split, in one rule:** reads run on the *user-scoped* server
client (`utils/supabase/server.ts`), so the policy decides what comes back — a
read for a booking that is not yours returns `200` with no rows, never a `403`.
Writes run on the *service-role* client (`utils/supabase/admin.ts`), which
bypasses RLS, so the Server Action must do the authorization the policy would
have done: resolve the caller with `requireUmkm()` / `requireInfluencer()`, then
scope the statement to an id the caller's session proved (for example
`.eq("influencer_id", account.influencerId)`).

`createAdminClient()` is **forbidden outside `app/actions.ts`**. It carries
`import "server-only"`, so any page or Client Component that reaches it fails the
build rather than shipping the key, and it reads `SUPABASE_SERVICE_ROLE_KEY` —
a name with **no `NEXT_PUBLIC_` prefix**. That prefix is what makes Next inline a
value into the browser bundle; dropping it from this one variable is deliberate,
not a naming inconsistency, so do not "fix" it by adding the prefix.

**Three tables are deliberately policy-less:** `disputes`, `dispute_infos`, and
`notifications`. They belong to capabilities that are out of scope for now. RLS is
enabled with no policy, so they return an empty result rather than an error. In
particular **a dispute can be opened but not read back** — it is recorded as
awaiting a decision. Each gains its policy when its capability lands; do not add
one early. `resolution_offers`, `conversations`, and `messages` left this list when
their capabilities landed: each now carries a party-scoped `SELECT` policy
(`resolution_offers_party_read`, `conversations_party_read`, `messages_party_read`)
that resolves the caller through the booking exactly like `bookings_party_read`.

Write model: **all writes go through Server Actions using a service-role client**
(server-only, bypasses RLS). Service role is only ever used on rows the caller
could already read through their own session, so it authorizes rather than
bypasses. This is mandatory for dispute decisions and payment status changes: they
must never be writable from the browser. For production hardening, replace
service-role writes with per-user RLS policies matching `auth.uid()` against
`profiles`.

**Booking lifecycle writes go through database functions, not loose updates.**
Every booking mutation — accept, decline, pay, submit content, request a revision,
submit a revision, approve and release, cancel, open a dispute — is one call to a
`plpgsql` function in `supabase/migrations/20261006120000_booking_lifecycle.sql`.
`apply_booking_transition(p_booking_id, p_to, p_actor_role)` owns the transition
matrix (which `(from, to, required_actor_role)` triples are legal) and is **the
only writer of `bookings.status`**; a `BEFORE UPDATE` guard trigger raises when
`status` changes without that function's transaction-local flag. The same call
records the implied timestamp, moves the `payments` row, and appends the
`booking_events` timeline entry. `submit_delivery`, `request_revision`, and
`open_dispute` are thin wrappers that delegate to it in the same transaction, so a
forced failure leaves both the booking and its child row unchanged.
`extend_review_window` is the one separate function. Do not add a direct
`update ... set status` anywhere: it will be refused, and that is the point.

**Settlement offers are the other database-owned flow.**
`supabase/migrations/20261007130000_resolution_offers.sql` adds `create_offer` and
`respond_to_offer`, the only writers of a `resolution_offers` row and the only path
that moves a held payment to `SPLIT` or `REFUNDED`. `create_offer` locks the booking,
refuses a finished booking or a non-party, enforces the per-type role/state table,
checks the type-dependent `value`, clears any overdue sibling (`status = 'PENDING'`
and `expires_at <= now()` become `EXPIRED`), and inserts a `PENDING` offer with
`expires_at = now() + interval '48 hours'`. A partial unique index
`resolution_offers_one_open on (booking_id) where status = 'PENDING'` makes a second
open offer impossible. `fee` is always written as `0` (free extra revisions only,
because the escrow total is immutable and there is no second charge path).

`respond_to_offer` locks the offer, then: an overdue offer is recorded `EXPIRED` and
returned without raising (raising would roll the record back); a decided offer, the
offerer, and non-parties are refused; a decline records `DECLINED` with no other
change. Accepting calls `apply_booking_transition` for the status move and settles
`payments` in the same transaction — `EXTRA_REVISION` only raises `revision_quota`
with no state change; `DISCOUNT` completes the booking then overwrites the release
to `SPLIT` with `creator_amount = value`; `CANCELLATION` cancels the booking and
writes `REFUNDED` (full) or `SPLIT` (partial), but only when the payment is `HELD`,
so a mutual cancellation on an unpaid `ACCEPTED` request just ends with no money
recorded as moved.

The `value` column is type-dependent: `EXTRA_REVISION` is a count (`>= 1`);
`DISCOUNT` is the creator's accepted amount (`0 < value < amount`); `CANCELLATION`
is the amount refunded to the business (`0 < value <= amount`). Expiry is lazy —
there is no scheduler, so an overdue `PENDING` offer is marked `EXPIRED` when a
sibling is created or a decision is attempted, and reads show it expired in
between. A direct cancellation still settles nothing; the cancellation *offer* is
the negotiated, money-settling path.

**Settlement states flow through the app as amounts, not just labels.** A booking
list row carries a payment stub (`status`, `creator_amount`, `umkm_refund_amount`),
so a dashboard derives money from the payment record rather than guessing from the
booking status. The creator dashboard counts a `RELEASED` payment's full total and a
`SPLIT` payment's `creator_amount` as earnings, keeps a `HELD` payment in "Dana
Ditahan", and counts nothing for `REFUNDED` or `UNPAID`. The booking detail renders
each state honestly: `SPLIT` shows both shares ("Dana dibagi"), `REFUNDED` shows the
amount returned to the business. Only `resolution_offers` writes `SPLIT`/`REFUNDED`;
`apply_booking_transition` writes `RELEASED`.

The Server Action side is unchanged and mandatory: it **fetches the booking
through the caller's own session first** (`getBookingById`, user-scoped client),
refuses when RLS returns nothing, and only then calls the function through the
service-role client. Authorization is never delegated to the service role.

**Four timestamps are displayed only; nothing reads them.**
`bookings.payment_due_at`, `bookings.deadline_at`, `bookings.review_due_at`, and
`disputes.due_at` are recorded and shown to the parties, but **no code reads them
to change a state**. There is no cron, no scheduler, and no job that fires when a
deadline passes; every transition is user-initiated. If you are looking for the
job that acts on these columns, there isn't one and there is not meant to be one
yet — do not add a background sweep without a product decision.

**Chat is the third database-owned flow.**
`supabase/migrations/20261007140000_chat.sql` adds the party-scoped read policies
`conversations_party_read` and `messages_party_read` (no write policy: the browser
key still cannot insert a message), an index on `messages (conversation_id,
sent_at)`, and two functions. `send_message(p_booking_id, p_actor_role, p_body)`
locks the booking, refuses a role that is not a party and an empty body, truncates a
body over 2000 characters, refuses `COMPLETED` / `CANCELLED` / `REJECTED`, resolves
the sender from the role and the booking, creates the conversation on demand, and
inserts the message. `mark_conversation_read(p_booking_id, p_actor_role)` marks
every message the other party sent with `read_at is null` as read and returns the
number changed; the unread badge is that count on read. `submit_booking` writes the
brief as the conversation's first message, so every booking has a thread. Chat is
open from `PENDING` through `DISPUTED`, read-only in `COMPLETED` / `CANCELLED`, and
closed in `REJECTED`.

Admin read access to a booking's chat arrives with the admin dispute capability and
applies **only** while its dispute is undecided (`OPEN` / `NEED_INFO`); until then an
admin who is not a party reads no chat:

```sql
create policy "dispute chat read for admin" on messages
  for select using (
    exists (
      select 1 from profiles p
      join conversations c on c.id = messages.conversation_id
      join disputes d on d.booking_id = c.booking_id
      where p.user_id = auth.uid()
        and p.role = 'admin'
        and d.status in ('OPEN', 'NEED_INFO')
    )
  );
```

**A creator's rating and review count are maintained by a database trigger.**
Influencer `rating` / `review_count` stay denormalized. `reviews_rollup`
(`AFTER INSERT ON reviews`) recomputes both from the reviews naming that creator
— `round(avg(rating), 1)`, not an increment — so the summary is a function of the
rows rather than of the action that wrote them. `reviews_immutable`
(`BEFORE UPDATE OR DELETE ON reviews`) raises for every update and delete: a
recorded review is permanent, and with no update or delete path the recomputed
number cannot drift. No application code writes `influencers.rating`.

**Deleting a booking would leave the creator's rating high.** The `reviews`
foreign key is `ON DELETE CASCADE`, so deleting a booking removes its reviews,
and the rollup trigger reacts only to inserts — the rating would not be corrected.
`reviews_immutable` is written to stand aside for that cascade (it raises only
when the parent booking still exists), because a deletion path is where the
correction belongs and there is no such path yet. No capability deletes a
booking: completed, declined, and cancelled requests are terminal and keep their
record. A future deletion path must correct the rollup in the same transaction
(or the guard must be tightened to refuse the cascade too). The note names the
cascade so that the first person to add deletion finds it.

Reviewing is gated on `COMPLETED` only. The spec also allows reviews after a
dispute decision, but no request can leave `DISPUTED` until the dispute
capability exists, so a disputed request is refused by the review screen. That
scenario is specified but not yet exercisable — recorded here so it is not read
as untested behaviour.

## 9. Auth — Supabase Auth (decided)

**Decision: Supabase Auth.** No extra vendor — it ships with the database, and its JWTs plug directly into RLS policies.

This section describes what is built, not a plan. The mock session is gone; `components/admin-session.ts`, the `kolab_session` cookie reader and the mock login actions have all been deleted, and nothing reads a role from the browser any more.

### Methods

| Method | Status | Notes |
| --- | --- | --- |
| Email + password | Primary | `signUp` / `signInWithPassword` in Server Actions. Zero config |
| Google OAuth | Primary | `signInWithOAuth({ provider: "google" })` + `/auth/callback` code exchange. **Implemented but unverified** — the local stack has no Google client, so only the code path was exercised |
| Demo one-click sign-in | Development only | Two buttons on `/login` for the seeded business owner and the seeded creator. Refused in a production build |
| Magic link / email OTP | Deferred | Revisit post-launch; depends on email deliverability |
| Phone OTP (SMS) | Out of scope | Per-message SMS cost — unjustified for this project |

### `lib/auth.ts` — the only answer to "who is asking"

Every page and action resolves identity through this file and nowhere else:

| Function | Behaviour |
| --- | --- |
| `getUser()` | The session's `auth.uid`, or `null`. No redirect. |
| `getUserContext()` | `{ userId, role, umkmId, influencerId }` from the session's `profiles` row, or `null` if the session has no profile yet. Wrapped in React `cache()`, so one request does one lookup no matter how many shells and layouts a route mounts. |
| `requireUser()` | `getUserContext()` or a redirect: no session → `/login?next=…`, no profile → `/onboarding`, otherwise the context. |
| `requireRole(...roles)` | `requireUser()` restricted to the listed roles; anything else goes to its own dashboard. |
| `requireUmkm()` / `requireInfluencer()` | The two special cases of the above. |
| `requireParty(bookingId)` | The session, resolved to the `umkm_id` or `influencer_id` that actually appears on that booking. Returns `null` for a non-party and for an admin. |

`DASHBOARD_BY_ROLE` is the one place the role → landing path mapping is written down.

Two rules the code follows so that no path can answer the question differently:

- **The role is never taken from the request.** Not from a query string, not from a form field, not from a cookie. `role` is read from `profiles` and only then narrowed, and the narrowing helpers compare explicitly against both values so TypeScript can prove the type without a cast.
- **The proxy and the DAL answer different questions.** `proxy.ts` only asks whether a session exists; `lib/auth.ts` asks who it belongs to. Duplicating the second question in the proxy would mean two answers to one question, so the proxy does not try.

### Onboarding

`/onboarding` collects the role choice plus the fields that differ between the two, then the `onboard` Server Action:

1. Insert the domain row (`umkms` or `influencers`) with the service-role client.
2. Insert the `profiles` row binding `auth.uid()` to that row's id, with compensating deletes if step 2 fails.
3. While SQLite is still the read store, also mirror the row into it **under the same id**, so both stores agree until the catalog change removes the mirror.
4. Redirect to the role dashboard.

`onboard` deliberately does **not** call `requireUser()`. `requireUser()` sends a profileless session to `/onboarding`, and `/onboarding` is the one page that cannot accept a redirect to itself — it would loop. `onboard` therefore uses `getUser()` plus a separate `getUserContext()` check for "does a profile already exist". This is the only page that reads the context without demanding one.

Validation happens before any insert: required fields, the category and city the catalog already knows, the price shape for a creator. A `handle` that is already taken is reported as a field error naming the reason, not as a generic failure. Only `umkm` and `influencer` are offered, and the rendered form contains no admin option.

### Sign-in

- `/login` posts to `signIn`, which reads `email`, `password` and an optional `next`.
- **`next` is honoured only when it is a relative path.** `safeNext` rejects anything protocol-relative (`//evil.example/steal`) as well as absolute URLs, so a crafted `next` cannot bounce a freshly authenticated visitor off-site. A rejected `next` falls back to the role dashboard.
- A wrong password returns `200` with a field error and no session. Server Actions report failure by *returning* state through `useActionState`; they do not throw, so a failed attempt renders instead of the error boundary.
- The demo one-click buttons call `demoSignIn(role)`, which takes **no form input at all** — the credential is a constant in the module, so there is nothing for the browser to tamper with. The guard is `process.env.NODE_ENV === "production"`, evaluated before any credential is used, and the buttons themselves are gated on the same check so a production `/login` renders two forms instead of four.

  The build does **not** remove the function: `app/actions.ts` is a `"use server"` module, so every export is a callable endpoint and cannot be tree-shaken. `kolab12345` and both demo addresses therefore remain in the server chunk of a production build — verified rather than assumed. That is not a leak, because they were never secrets: `supabase/seed.sql` commits the same values, the accounts exist only after a local `supabase db reset`, and no deployed database is seeded by this repository.

### Route protection (`proxy.ts`)

Next 16 renamed `middleware` to `proxy`: the file must export a single function named `proxy`, and `config.matcher` still selects paths.

- Public: `/`, `/influencers*`, `/insights`, `/login`, `/signup`, `/auth/*`.
- No session → redirected away from `/dashboard*`, `/booking*`, `/review/[bookingId]`, `/admin/*`, with `?next=` carrying the original destination for the form to return to.
- A session → redirected away from `/login` and `/signup`.
- `/onboarding` is **not** in the protected set. It is the one authenticated route a profileless session must be able to reach, and protecting it would be the same loop as above.
- `/admin/*` additionally requires `requireRole("admin")`; any other role lands on its own dashboard. Because the proxy cannot know the role, `/login` and `/signup` send a signed-in visitor to `/dashboard`, which then resolves the role — one extra hop, and only one place that knows the mapping.

### Writes and the service-role key

The RLS baseline defines **SELECT policies only**. There is no INSERT, UPDATE or DELETE policy on any table, so a publishable key cannot write anything — not even its own `profiles` row, because `profiles_own_read` is a SELECT policy and an UPDATE with no policy matches zero rows and is discarded silently rather than refused.

Every write therefore goes through the service-role client in `utils/supabase/admin.ts`, inside a Server Action. That is the current design, not an oversight: phase-2 hardening replaces the service-role writes with per-user policies, starting with a UMKM being able to insert only its own bookings.

One consequence worth stating: because the party policies key on `umkm_id` / `influencer_id` and an admin's profile carries neither, **an admin currently reads zero bookings**. That is deliberate — admin visibility arrives with the dispute policies, not with the party ones.

### Admin provisioning

No signup or onboarding path creates an admin. `profiles_role_link_chk` requires an admin to carry neither `umkm_id` nor `influencer_id`, so the row is inserted by hand:

1. Supabase Dashboard → Authentication → Users → **Add user**, with *Auto Confirm User* ticked. Copy the generated UUID.
2. Bind it:

```sql
insert into public.profiles (user_id, full_name, role)
values ('<the-uuid-from-step-1>', 'Operator Kolab', 'admin');
```

`umkm_id` and `influencer_id` are each `UNIQUE`, so this is also the only place an existing business owner or creator can be bound to an account.

### Email confirmation

`signUp` auto-confirms the address through the service role **only when `NODE_ENV !== "production"`**, so development does not need a mail server. In a production build the address is left unconfirmed and the account cannot sign in until it is confirmed. The local stack also sets `enable_confirmations = false`, so both paths are open locally; the unconfirmed-sign-in path is therefore reasoned about rather than exercised.

### Seeding

`supabase/seed.sql` creates an `auth.users` row plus an `auth.identities` row for all nine seeded accounts, so every seeded business owner and creator can sign in with the credentials the seed records. Three details are load-bearing and easy to get wrong: an identity row per user is required, the nullable `*_token` / `*_change` columns must be `''` and not NULL, and `actor_role` is an enum distinct from `party_role`.

The seed ends by setting `influencers_id_seq` to 12 and `umkms_id_seq` to 4 — past `lib/seed.ts`'s maxima. Every id is `GENERATED ALWAYS AS IDENTITY` and rejects an explicit insert without `OVERRIDING SYSTEM VALUE`, so onboarding cannot choose its id; the sequences must instead start somewhere the SQLite mirror has not already used, or the mirror fails on a duplicate key. `setval` is used rather than `ALTER … RESTART WITH` because a restart stores its value nowhere queryable, which would make the one number the block exists to set impossible to assert.

### Verification

There is no test runner, so the checks that stand in for one are HTTP scripts. Both
need a running dev server (`npm run dev`) and a seeded local stack (`npm run db:reset`).

```bash
npm run verify        # both suites
npm run verify:auth   # sign-up -> onboarding -> sign-in -> sign-out, both stores
npm run verify:rls    # 40 assertions against PostgREST
```

`verify-auth` drives the real Server Actions with a multipart POST carrying React's own
`$ACTION_*` fields, so it reaches the cookie write, the redirects and the database
writes that a GET cannot. It also creates accounts, and removes every row it created
before it exits, so the seed's own assertions still hold afterwards.

`verify-rls` asks the database rather than the page. That distinction matters: a page
could refuse a cross-party request on its own logic while the policy would have handed
the row over. Reading a row RLS hides returns an empty `200`, never a `403`, so the
checks assert row counts; the insert checks are the ones that assert `42501`.

Two traps when editing either script. A Server Action id changes on recompile, so the
form fields must be re-harvested immediately before each POST. And PowerShell strips
inner quotes from `node -e`, which is why every SQL string goes through a file.

### Local development

- Postgres is the app's only store. The catalog change deleted `lib/data.ts`, so nothing in the app import graph reaches `node:sqlite` and the app renders with `data.db` absent. `lib/db.ts` + `lib/seed.ts` + `scripts/seed.ts` + `npm run db:seed` survive **only** so the historical verification scripts (`verify-auth.ps1`) can keep comparing the old SQLite mirror against Postgres; they are not part of the app. `npm run db:reset` seeds Postgres.
- Do not run `npm run build` while `npm run dev` is running. `tsconfig.json` includes `.next/dev/types/**/*.ts`, so the build type-checks files the dev server is actively rewriting; the two writers interleave and produce files that fail to parse.
- Run `npx tsc --noEmit` *after* a build, not before one on a clean `.next`. `PageProps` and `LayoutProps` are generated into `.next/types` by the build, so a fresh checkout type-checks against globals that do not exist yet.

## 10. Rendering & Data Fetching Notes

- Keep `export const dynamic = "force-dynamic"` on DB-backed pages initially — same as before. Add per-page caching deliberately later, not by accident.
- Server Components and Server Actions must use the per-request server client (`utils/supabase/server.ts`), never a module-level singleton.
- PostgREST returns `numeric` columns as strings — cast ratings/amounts with `Number()` at the boundary (`lib/data/catalog.ts`, `lib/data/bookings.ts`).
- UI must use design-token utilities (`bg-primary-600`, `text-success-700`, `rounded-xl`, `shadow-sm`, ...) per DESIGN_SYSTEM.md §16 — never raw hex or arbitrary values. Custom values live in `@theme` in `app/globals.css`.
- Category colours are looked up in **source**, not stored: `lib/data/palette.ts` maps a `categories.slug` to a static Tailwind gradient class, and `<Avatar category={slug} />` does the lookup. Tailwind v4 only emits classes it can see in the source; a gradient assembled from a database string is never compiled and disappears silently at runtime, which is why the slug — not the class — is the thing passed around. Unknown or missing slugs fall through to a fixed fallback.
- Notification feed: the prototype derives it from bookings; the target reads the `notifications` table (unread = `read_at is null`) with badge counts, refreshed via revalidation. No realtime subscription in the prototype.
- Currency formatting still uses `lib/format.ts` (IDR/Rupiah helpers).

## 11. Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| Queries return zero rows with no error | RLS policy missing/deny. Check policies in Dashboard → Authentication → Policies, or test with the service-role key to confirm it's RLS, not the query |
| Users randomly logged out | `middleware.ts` session refresh missing or matcher excluding routes. Ensure `updateSession` runs on every non-static request |
| `NEXT_PUBLIC_SUPABASE_* is undefined` | `.env.local` missing or dev server not restarted after editing it |
| Seed/auth-admin calls fail with 401/403 | Publishable key used where the secret key is required (or vice versa). Seeding and user-admin scripts must use `SUPABASE_SERVICE_ROLE_KEY`, server-side only |
| Signup succeeds but user can't log in | "Confirm email" is on and the inbox wasn't confirmed. Turn it off for the dev project or confirm the user in the Dashboard |
| Google OAuth loops back to login | Redirect/callback URL not allowlisted in Supabase URL Configuration, or `SITE_URL` still points at localhost in prod |
| `numeric` rating arrives as `"4.8"` (string) | Expected PostgREST behavior — cast with `Number()` |
| Admin locked out of chat, or decision/payment write denied | RLS: admin chat reads apply only while the dispute is `OPEN`/`NEED_INFO`; decisions and payment changes must use the service-role client, never the publishable key |
| Old SQLite errors (`database is locked`, `node:sqlite` missing) | Leftover from the pre-Supabase code. Upgrading Node isn't the fix anymore — finish the migration in §6/§8 |

## 12. Deployment Checklist

1. Supabase **prod** project: migrations applied, RLS policies on, seed/demo data replaced with real (or clearly-marked demo) data.
2. Auth configured: `SITE_URL` + redirect URLs set to the prod domain, Google OAuth client wired, email templates translated to Bahasa Indonesia, "Confirm email" set per launch policy.
3. Host (Vercel recommended): set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. `npm run build` passes; smoke-test login → booking → pay → review flows for both roles, plus the dispute path (`Ajukan Sengketa` → decision → review).
5. Mock-auth cleanup done: no `kolab_session` code paths, no one-click demo backdoor in prod.
6. Backups: Supabase daily backups are on free-tier-daily / PITR on paid — verify before launch.
7. Admin account provisioned manually (auth user + `profiles` row with `role = 'admin'`); no signup path exists for it.
8. Status migration applied: prototype bookings (`PENDING`/`APPROVED`/`DONE`/`REJECTED`) mapped onto the nine-value lifecycle in §8, with package snapshots (`revision_quota`, `estimated_days`) backfilled.
