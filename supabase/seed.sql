-- Demo and verification seed for the RLS baseline.
--
-- Two jobs, deliberately in one file:
--
--   1. Give the catalog and booking flows something coherent to render.
--   2. Give every policy assertion in tasks 4.1 through 4.7 a real row to act
--      on. A policy test that selects from an empty table proves nothing: an
--      empty result looks identical to a correctly denied read.
--
-- Accounts exist so the four callers in task 4.3 can be impersonated, and so
-- change 2 (auth-session) has a one-click demo sign-in. Both consumers read this
-- file; nothing here is throwaway.
--
-- The rows below mirror `lib/seed.ts` (the SQLite demo data) deliberately, and
-- the identifiers line up with it: creator 1 is Rara Nadia in both stores,
-- business 1 is Warung Kopi Senja in both. That alignment is load-bearing.
-- `lib/auth.ts` resolves a caller to `profiles.umkm_id` / `profiles.influencer_id`,
-- which are Postgres ids, and the pages that render the demo read SQLite. Until
-- catalog-and-booking ports those reads to Postgres, an id means nothing in both
-- places unless the two seeds agree on order. Booking codes are copied for the
-- same reason: CLB-2026-0002 here is the same booking the SQLite booking detail
-- page shows.
--
-- Consequence to be honest about: anything this file cannot mirror diverges.
-- `influencers.rating` and `review_count` are the clearest case - SQLite carries
-- decorative tallies (Rara 4.9 from 127 reviews) while the two reviews seeded
-- below are the only ones that exist here, so the tallies are recomputed from
-- them rather than asserted. Change 5 adds the trigger that keeps them honest.
--
-- The reviews are the other: SQLite's nine bookings carry four reviews, spread
-- across four bookings. Only two of those bookings are seeded here, so this file
-- carries just the mutual pair on the completed one. In particular SQLite's 4-star
-- creator-to-business review sits on CLB-2026-0002, which is still ACCEPTED above;
-- it is not copied onto it, because a review belongs to a finished booking.
--
-- Repeatable by design: every seeded table is emptied in foreign-key-safe order
-- and every identity sequence is rewound, so a second run produces the same
-- identifiers. The assertions therefore quote literal ids. The two mirrored
-- sequences are then pushed past SQLite's maximum at the end of the file - see
-- "Bridge alignment" there for why that is not simply a rewind.

-- ----------------------------------------------------------------------------
-- Reset
--
-- RESTRICT foreign keys mean the children have to go first:
-- reviews.reviewee_* -> influencers/umkms, bookings.* -> umkms/influencers,
-- profiles.* -> umkm_id/influencer_id, packages.influencer_id -> influencers.
-- ----------------------------------------------------------------------------

delete from public.revision_requests;
delete from public.notifications;
delete from public.dispute_infos;
delete from public.disputes;
delete from public.resolution_offers;
delete from public.deliveries;
delete from public.payments;
delete from public.booking_events;
-- `reviews` carries a BEFORE DELETE guard (see the reviews migration) so the
-- reset has to stand it down for its own cleanup. This is the seed, not the
-- application: no app code ever disables the trigger.
alter table public.reviews disable trigger reviews_immutable;
delete from public.reviews;
alter table public.reviews enable trigger reviews_immutable;
delete from public.bookings;
delete from public.packages;
delete from public.profiles;
delete from public.influencers;
delete from public.umkms;
delete from public.categories;

-- Deleting by the "@kolab.id" suffix rather than by a literal id list, so an
-- account added below does not also need to be added here to be cleaned up.
delete from auth.users where email like '%@kolab.id';

-- Rewind identities so ids are stable across runs. Without this the ids drift on
-- the second run and any assertion quoting a literal id silently starts testing
-- the wrong row.
alter table public.revision_requests  alter column id restart with 1;
alter table public.deliveries         alter column id restart with 1;
alter table public.payments           alter column id restart with 1;
alter table public.booking_events     alter column id restart with 1;
alter table public.reviews            alter column id restart with 1;
alter table public.disputes           alter column id restart with 1;
alter table public.dispute_infos      alter column id restart with 1;
alter table public.bookings           alter column id restart with 1;
alter table public.packages           alter column id restart with 1;
alter table public.influencers        alter column id restart with 1;
alter table public.umkms              alter column id restart with 1;
alter table public.categories         alter column id restart with 1;

-- ----------------------------------------------------------------------------
-- Categories
--
-- Five, because the SQLite demo has five creator niches and only four of them
-- map onto the original four categories. `packages.id` and every id below depend
-- on this order, so append rather than insert.
--
--   1 Kuliner              -> Food & Beverage
--   2 Fashion              -> Fashion
--   3 Kecantikan           -> Beauty
--   4 Gadget & Teknologi   -> Technology
--   5 Kesehatan & Fitnes   -> Health & Fitness
-- ----------------------------------------------------------------------------

insert into public.categories (name, slug) values
  ('Food & Beverage', 'food-beverage'),
  ('Fashion',         'fashion'),
  ('Beauty',          'beauty'),
  ('Technology',      'technology'),
  ('Health & Fitness', 'health-fitness');

-- ----------------------------------------------------------------------------
-- Influencers
--
-- The first four rows of `lib/seed.ts`, in order, with the same values. handle
-- carries its leading "@" because that is what the UI renders - CreatorCard and
-- the influencer profile both print `handle` verbatim, and a bare handle would
-- render as "raranadia" where SQLite shows "@raranadia".
--
-- starting_price arrives as 0 and is filled in from the cheapest package below,
-- the same shape as the trigger that catalog-and-booking adds. Supplying it by
-- hand here would let the seed disagree with its own packages.
-- ----------------------------------------------------------------------------

insert into public.influencers (name, handle, category_id, city, followers, engagement_rate,
                                bio, verified, rating, review_count, starting_price) values
  ('Rara Nadia',      '@raranadia',    1, 'Bandung',  245000, 0.060,
   'Food creator yang suka mengulik kuliner lokal dan hidden gem. Konten selalu pakai musik & bahasa yang bikin lapar.',
   true, 0, 0, 0),
  ('Bima Prasetyo',   '@bimapras',     4, 'Jakarta',  512000, 0.045,
   'Reviewer gadget & teknologi. Video ulasan mendalam, objektif, dan gampang dipahami untuk audiens umum.',
   true, 0, 0, 0),
  ('Salsa Amalia',    '@salsamakeup',  3, 'Jakarta',  389000, 0.070,
   'Makeup artist & beauty content creator. Spesialis tutorial, unboxing kosmetik lokal, dan skincare routine.',
   false, 0, 0, 0),
  ('Yoga Ardiansyah', '@yogafit',      5, 'Surabaya', 178000, 0.050,
   'Personal trainer yang membagikan tips fitnes, pola makan sehat, dan review suplemen & alat olahraga.',
   false, 0, 0, 0);

-- Three packages per creator, generated by `packagesFor(basePrice)` in
-- lib/seed.ts: Review Video at the base price, Unboxing & Story at 0.6x, and
-- Kampanye Komplit at 1.8x. Prices are therefore identical across both stores and
-- a booking's amount can be checked against its package in either one.
--
-- revision_quota and estimated_days exist only on this side, so they are not
-- mirrored - the values are plausible defaults, not a copy of anything.
insert into public.packages (influencer_id, name, price, summary, includes, revision_quota, estimated_days) values
  (1, 'Review Video',      1200000, '1 video 30-60 detik',
   '["Konten vertikal 30-60 detik","Tayang 7 hari di feed","Musik bebas-hak","Hak pakai konten 30 hari"]'::jsonb, 2, 5),
  (1, 'Unboxing & Story',  720000, 'Reels + 3 Instagram Story',
   '["1 reels unboxing/review singkat","3 Instagram Story interaktif","Poll & quiz di story","Hak pakai konten 14 hari"]'::jsonb, 1, 3),
  (1, 'Kampanye Komplit', 2160000, '2 Reels + Story + Repost Feed',
   '["2 Reels / konten utama","3-5 Instagram Story","Repost feed UMKM di profil","Hak pakai konten 90 hari","Prioritas jadwal tayang"]'::jsonb, 3, 10),
  (2, 'Review Video',      2500000, '1 video 30-60 detik',
   '["Konten vertikal 30-60 detik","Tayang 7 hari di feed","Musik bebas-hak","Hak pakai konten 30 hari"]'::jsonb, 2, 5),
  (2, 'Unboxing & Story',  1500000, 'Reels + 3 Instagram Story',
   '["1 reels unboxing/review singkat","3 Instagram Story interaktif","Poll & quiz di story","Hak pakai konten 14 hari"]'::jsonb, 1, 3),
  (2, 'Kampanye Komplit', 4500000, '2 Reels + Story + Repost Feed',
   '["2 Reels / konten utama","3-5 Instagram Story","Repost feed UMKM di profil","Hak pakai konten 90 hari","Prioritas jadwal tayang"]'::jsonb, 3, 10),
  (3, 'Review Video',      1800000, '1 video 30-60 detik',
   '["Konten vertikal 30-60 detik","Tayang 7 hari di feed","Musik bebas-hak","Hak pakai konten 30 hari"]'::jsonb, 2, 5),
  (3, 'Unboxing & Story',  1080000, 'Reels + 3 Instagram Story',
   '["1 reels unboxing/review singkat","3 Instagram Story interaktif","Poll & quiz di story","Hak pakai konten 14 hari"]'::jsonb, 1, 3),
  (3, 'Kampanye Komplit', 3240000, '2 Reels + Story + Repost Feed',
   '["2 Reels / konten utama","3-5 Instagram Story","Repost feed UMKM di profil","Hak pakai konten 90 hari","Prioritas jadwal tayang"]'::jsonb, 3, 10),
  (4, 'Review Video',       850000, '1 video 30-60 detik',
   '["Konten vertikal 30-60 detik","Tayang 7 hari di feed","Musik bebas-hak","Hak pakai konten 30 hari"]'::jsonb, 2, 5),
  (4, 'Unboxing & Story',   510000, 'Reels + 3 Instagram Story',
   '["1 reels unboxing/review singkat","3 Instagram Story interaktif","Poll & quiz di story","Hak pakai konten 14 hari"]'::jsonb, 1, 3),
  (4, 'Kampanye Komplit',  1530000, '2 Reels + Story + Repost Feed',
   '["2 Reels / konten utama","3-5 Instagram Story","Repost feed UMKM di profil","Hak pakai konten 90 hari","Prioritas jadwal tayang"]'::jsonb, 3, 10);

update public.influencers i
   set starting_price = cheapest.min_price
  from (select p.influencer_id, min(p.price) as min_price
          from public.packages p
         group by p.influencer_id) cheapest
 where cheapest.influencer_id = i.id;

-- ----------------------------------------------------------------------------
-- UMKM
--
-- The four rows of `lib/seed.ts`, in the same order, with the same values.
-- `budget` has no SQLite counterpart; it is what the booking form offers as the
-- spend ceiling, so a plausible figure per segment is all that is needed.
-- ----------------------------------------------------------------------------

insert into public.umkms (name, owner, category_id, city, budget) values
  ('Warung Kopi Senja', 'Budi Santoso',  1, 'Bandung',    5000000),
  ('Batik Nusantara',   'Siti Rahma',    2, 'Yogyakarta', 8000000),
  ('Kopi & Kita',       'Dewi Lestari',  1, 'Jakarta',    6000000),
  ('Hijab Lovely',      'Nurul Hidayah', 2, 'Jakarta',    4000000);

-- ----------------------------------------------------------------------------
-- Auth identities and profiles
--
-- Nine callers: one per seeded owner, one per seeded creator, and an operator.
-- Every seeded business and creator has an account, because
-- `profiles.umkm_id` / `profiles.influencer_id` are UNIQUE - two accounts cannot
-- own the same record - and because change 2's demo sign-in reads these rows.
--
--   11111111...  Budi,     umkm 1            -> party to booking 1 only
--   22222222...  Rara,     influencer 1      -> party to both bookings
--   33333333...  Siti,     umkm 2            -> signed in, party to neither
--   44444444...  Operator, no party link     -> admin, party to neither
--   55555555...  Dewi,     umkm 3            -> party to booking 2 only
--   66666666...  Bima,     influencer 2      -> signed in, party to neither
--   77777777...  Salsa,    influencer 3      -> signed in, party to neither
--   88888888...  Yoga,     influencer 4      -> signed in, party to neither
--   99999999...  Nurul,    umkm 4            -> signed in, party to neither
--
-- The two bookings deliberately share one party and differ in the other, which
-- is what makes the isolation assertions meaningful: Budi reads booking 1's
-- children and cannot read booking 2's, Dewi the reverse. A stranger test alone
-- would pass just as happily against a policy that denied everyone, so both
-- directions are asserted.
--
-- crypt() and gen_salt() are core in PostgreSQL 13+, so no pgcrypto extension is
-- required for these hashes to resolve.
-- ----------------------------------------------------------------------------

-- The *token and *change columns are nullable in the schema, but GoTrue scans the
-- user row into plain strings and 500s with "converting NULL to string is
-- unsupported" the moment one of them is null. That surfaces to a caller as
-- "Database error querying schema", which says nothing about the real cause. They
-- are set to the empty string rather than null.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        confirmation_token, email_change, email_change_token_current,
                        email_change_token_new, phone_change, phone_change_token,
                        reauthentication_token, recovery_token,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
   'authenticated', 'authenticated', 'budi@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Budi Santoso"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
   'authenticated', 'authenticated', 'rara@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rara Nadia"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333',
   'authenticated', 'authenticated', 'siti@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Siti Rahma"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444',
   'authenticated', 'authenticated', 'admin@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Operator Kolab"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555',
   'authenticated', 'authenticated', 'dewi@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Dewi Lestari"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666',
   'authenticated', 'authenticated', 'bima@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Bima Prasetyo"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777777',
   'authenticated', 'authenticated', 'salsa@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Salsa Amalia"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888888',
   'authenticated', 'authenticated', 'yoga@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Yoga Ardiansyah"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999999',
   'authenticated', 'authenticated', 'nurul@kolab.id', crypt('kolab12345', gen_salt('bf')),
   '','','','','','','','',
   now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nurul Hidayah"}'::jsonb, now(), now());

-- Without a matching auth.identities row GoTrue's password grant fails with a
-- 500 ("Database error querying schema"), because it resolves the login through
-- identities rather than auth.users. email is a generated stored column here, so
-- identity_data has to carry the address.
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select u.id::text,
       u.id,
       jsonb_build_object('email', u.email, 'email_verified', true,
                          'phone_verified', false, 'sub', u.id::text),
       'email', u.created_at, u.updated_at
  from auth.users u
 where u.email like '%@kolab.id';

-- profiles_role_link_chk ties role to exactly one of umkm_id / influencer_id, so
-- the admin profile carries neither. umkm_id and influencer_id are each UNIQUE, so
-- this is the only place an owner or creator is bound to an account.
insert into public.profiles (user_id, full_name, umkm_id, influencer_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'Budi Santoso',     1, null, 'umkm'),
  ('22222222-2222-4222-8222-222222222222', 'Rara Nadia',      null, 1,    'influencer'),
  ('33333333-3333-4333-8333-333333333333', 'Siti Rahma',       2, null, 'umkm'),
  ('44444444-4444-4444-8444-444444444444', 'Operator Kolab', null, null, 'admin'),
  ('55555555-5555-4555-8555-555555555555', 'Dewi Lestari',     3, null, 'umkm'),
  ('66666666-6666-4666-8666-666666666666', 'Bima Prasetyo',  null, 2,    'influencer'),
  ('77777777-7777-4777-8777-777777777777', 'Salsa Amalia',   null, 3,    'influencer'),
  ('88888888-8888-4888-8888-888888888888', 'Yoga Ardiansyah',null, 4,    'influencer'),
  ('99999999-9999-4999-8999-999999999999', 'Nurul Hidayah',    4, null, 'umkm');

-- ----------------------------------------------------------------------------
-- Bookings
--
-- Two real bookings out of lib/seed.ts, identified by their SQLite codes, so the
-- demo shows the same collaboration from either data source.
--
-- Booking 1 (CLB-2026-0002) is still moving (ACCEPTED) so it has an unpaid
-- payment and no delivery. Booking 2 (CLB-2026-0007) is finished (COMPLETED) so
-- it has a released payment, a delivery, two reviews and a settled timeline.
-- Task 4.4 needs a child row of each kind to probe.
-- ----------------------------------------------------------------------------

insert into public.bookings (code, umkm_id, influencer_id, package_id, package_name, amount,
                             revision_quota, estimated_days, brief, status,
                             accepted_at, payment_due_at, deadline_at)
values
  ('CLB-2026-0002', 1, 1, 3, 'Kampanye Komplit', 2160000, 3, 10,
   'Kampanye grand opening cabang kedua, fokus ke night vibe.', 'ACCEPTED',
   now() - interval '2 days', now() + interval '1 day', now() + interval '7 days'),

  ('CLB-2026-0007', 3, 1, 1, 'Review Video', 1200000, 2, 5,
   'Review kopi gayo single origin + breakfast set.', 'COMPLETED',
   now() - interval '40 days', now() - interval '39 days', now() - interval '33 days');

update public.bookings
   set funded_at      = accepted_at + interval '1 day',
       submitted_at   = accepted_at + interval '4 days',
       completed_at   = accepted_at + interval '6 days',
       review_due_at  = completed_at + interval '7 days'
 where code = 'CLB-2026-0007';

-- ----------------------------------------------------------------------------
-- Children of the two bookings
--
-- One payment each, because payments.booking_id is UNIQUE. Booking 1's row is the
-- state apply_booking_transition leaves behind on ACCEPTED: the amount is owed
-- and the split is already known, but nothing is held and no gateway has been
-- called. Seeding it keeps the seed honest about what acceptance produces once
-- booking-lifecycle adds the function - that transition will not fire again,
-- because the booking is no longer PENDING.
--
-- Booking 2's row is the settled end of the escrow happy path: UNPAID -> HELD ->
-- RELEASED. The creator share is the released amount and the refund share stays
-- zero, which is the only split this scope builds.
-- ----------------------------------------------------------------------------

insert into public.payments (booking_id, total_amount, creator_amount, umkm_refund_amount, gateway_ref, status, held_at, settled_at)
select id, 2160000, 1728000, 0, null, 'UNPAID', null, null
  from public.bookings
 where code = 'CLB-2026-0002';

insert into public.payments (booking_id, total_amount, creator_amount, umkm_refund_amount, gateway_ref, status, held_at, settled_at)
select id, 1200000, 960000, 0, 'demo-gw-clb-2026-0007', 'RELEASED',
       funded_at, completed_at
  from public.bookings
 where code = 'CLB-2026-0007';

insert into public.deliveries (booking_id, round, content_url, note, submitted_at)
select id, 1, 'https://example.com/deliveries/clb-2026-0007-r1', 'Revisi warna sudah diterapkan.', submitted_at
  from public.bookings
 where code = 'CLB-2026-0007';

-- A coherent history for booking 2, in the order the transitions actually happen.
-- The creator accepts and submits; the business funds and closes. from_status is
-- null on the first row because there is nothing before it.
--
-- The uuid casts are load-bearing: without them UNION ALL resolves the column to
-- text and Postgres rejects the insert against actor_id uuid. actor_role is its
-- own enum, distinct from party_role, and carries admin and system as well.
-- from_status and to_status arrive via ALTER TABLE rather than CREATE TABLE, so
-- they are invisible in a dump read that stops at the closing paren; to_status is
-- NOT NULL.
insert into public.booking_events (booking_id, actor_id, actor_role, from_status, to_status, note, created_at)
select id, '22222222-2222-4222-8222-222222222222'::uuid, 'influencer'::public.actor_role,
       null::public.booking_status, 'ACCEPTED'::public.booking_status,
       'Brief diterima, garansi revisi tiga kali.', created_at
  from public.bookings where code = 'CLB-2026-0007'
union all
select id, '55555555-5555-4555-8555-555555555555'::uuid, 'umkm'::public.actor_role,
       'ACCEPTED'::public.booking_status, 'FUNDED'::public.booking_status,
       'Dana ditahan escrow.', created_at + interval '1 day'
  from public.bookings where code = 'CLB-2026-0007'
union all
select id, '22222222-2222-4222-8222-222222222222'::uuid, 'influencer'::public.actor_role,
       'FUNDED'::public.booking_status, 'SUBMITTED'::public.booking_status,
       'Konten ronde 1 dikirim.', created_at + interval '4 days'
  from public.bookings where code = 'CLB-2026-0007'
union all
select id, '55555555-5555-4555-8555-555555555555'::uuid, 'umkm'::public.actor_role,
       'SUBMITTED'::public.booking_status, 'COMPLETED'::public.booking_status,
       'Konten disetujui, escrow dilepas.', created_at + interval '6 days'
  from public.bookings where code = 'CLB-2026-0007';

-- ----------------------------------------------------------------------------
-- Reviews
--
-- The mutual pair on the completed booking: each party reviews the other, which
-- is the only pair reviews_reviewee_chk permits. Both texts are the ones
-- lib/seed.ts attaches to CLB-2026-0007.
--
-- reviewee_* is stored, not derived at read time: reaching it through bookings
-- would be filtered by the party-scoped bookings policy, so a public creator
-- page would render no reviews. Exactly one column is set, per
-- reviews_reviewee_chk, and reviews_booking_id_reviewer_role_key allows one
-- review per party per booking.
-- ----------------------------------------------------------------------------

insert into public.reviews (booking_id, reviewer_role, reviewee_influencer_id, reviewee_umkm_id, rating, comment, created_at)
select b.id, 'umkm'::public.party_role, b.influencer_id, null, 5,
        'Konten kopi gayo single origin-nya bagus banget, ada beberapa pelanggan baru yang datang karena video itu.',
        b.completed_at + interval '1 day'
  from public.bookings b where b.code = 'CLB-2026-0007'
union all
select b.id, 'influencer'::public.party_role, null, b.umkm_id, 5,
        'Brief jelas, produknya enak, jadwal tayang fleksibel. Recommended!',
        b.completed_at + interval '3 days'
  from public.bookings b where b.code = 'CLB-2026-0007';

-- rating and review_count are recomputed from the reviews above rather than left
-- at their column defaults, so the creator card and the review list agree before
-- any trigger exists. Only Rara has a review here, and her tallies are therefore
-- 1 review at 5.0 - not SQLite's decorative 4.9 / 127. See the header note.
update public.influencers i
   set review_count = tallied.total,
       rating       = tallied.mean
  from (select reviewee_influencer_id, count(*) as total, avg(rating)::numeric(2,1) as mean
          from public.reviews
         where reviewee_influencer_id is not null
         group by reviewee_influencer_id) tallied
 where i.id = tallied.reviewee_influencer_id;

-- ----------------------------------------------------------------------------
-- Admin disputes
--
-- Three cases for the operator dashboard (ARCHITECTURE §5.7). Each booking is
-- inserted directly at the state the lifecycle would have reached - DISPUTED for
-- the two open cases, COMPLETED for the decided one - with the child rows that
-- state implies: a payment, a delivery, a full transition history, and the
-- dispute itself (plus its mediation Q&A).
--
-- All three belong to Nurul's Hijab Lovely (umkm 4) and a different creator, so
-- the existing isolation story is untouched: Budi, Dewi and Rara keep exactly
-- the bookings they already had, and Siti stays a party to none. The operator
-- queue therefore shows one business with three partners, not one name repeated.
--
-- The dispute codes are DSP-2026-00NN to mirror open_dispute's own format.
-- ----------------------------------------------------------------------------

insert into public.bookings (code, umkm_id, influencer_id, package_id, package_name, amount,
                             revision_quota, estimated_days, brief, status,
                             accepted_at, brief_locked_at, payment_due_at, funded_at,
                             deadline_at, submitted_at, review_due_at, revisions_used,
                             completed_at)
values
  ('CLB-2026-0011', 4, 2, 5, 'Unboxing & Story', 1500000, 1, 3,
   'Unboxing edisi terbatas, tone hangat, tayang H-3 peluncuran.', 'DISPUTED',
   now() - interval '14 days', now() - interval '14 days', now() - interval '13 days',
   now() - interval '12 days', now() - interval '9 days', now() - interval '6 days',
   now() - interval '3 days', 1, null),
  ('CLB-2026-0012', 4, 3, 7, 'Review Video', 1800000, 2, 5,
   'Review rangkaian koleksi terbaru, satu video 30-60 detik.', 'DISPUTED',
   now() - interval '10 days', now() - interval '10 days', now() - interval '9 days',
   now() - interval '8 days', now() - interval '3 days', now() - interval '2 days',
   now() + interval '1 day', 2, null),
  ('CLB-2026-0013', 4, 4, 12, 'Kampanye Komplit', 1530000, 3, 10,
   'Kampanye koleksi edisi peluncuran bulan depan, tone elegan.', 'COMPLETED',
   now() - interval '30 days', now() - interval '30 days', now() - interval '29 days',
   now() - interval '28 days', now() - interval '18 days', now() - interval '20 days',
   now() - interval '17 days', 3, now() - interval '15 days');

-- One payment each. The two open cases hold the full total; the decided case is
-- already SPLIT 70/30, which is the same held total re-divided, never a new one.
insert into public.payments (booking_id, total_amount, creator_amount, umkm_refund_amount, gateway_ref, status, held_at, settled_at)
select id, amount, 0, 0, 'demo-gw-' || lower(code), 'HELD'::public.payment_status, funded_at, null
  from public.bookings where code in ('CLB-2026-0011', 'CLB-2026-0012')
union all
select id, amount, 1071000, 459000, 'demo-gw-clb-2026-0013', 'SPLIT'::public.payment_status, funded_at, now() - interval '15 days'
  from public.bookings where code = 'CLB-2026-0013';

insert into public.deliveries (booking_id, round, content_url, note, submitted_at)
select id, 1, 'https://example.com/deliveries/' || lower(code) || '-r1',
       'Ronde 1 dikirim mengikuti brief.', submitted_at
  from public.bookings where code like 'CLB-2026-001%';

-- Transition history, in order. The decided case ends with the operator's move,
-- which `apply_booking_transition` owns; here it is written directly because the
-- row is inserted already COMPLETED.
insert into public.booking_events (booking_id, actor_id, actor_role, from_status, to_status, note, created_at)
select id, '66666666-6666-4666-8666-666666666666'::uuid, 'influencer'::public.actor_role,
       null::public.booking_status, 'ACCEPTED'::public.booking_status,
       'Brief diterima.', accepted_at
  from public.bookings where code = 'CLB-2026-0011'
union all
select id, '99999999-9999-4999-8999-999999999999'::uuid, 'umkm'::public.actor_role,
       'ACCEPTED'::public.booking_status, 'FUNDED'::public.booking_status,
       'Dana ditahan escrow.', funded_at
  from public.bookings where code = 'CLB-2026-0011'
union all
select id, '66666666-6666-4666-8666-666666666666'::uuid, 'influencer'::public.actor_role,
       'FUNDED'::public.booking_status, 'SUBMITTED'::public.booking_status,
       'Konten ronde 1 dikirim.', submitted_at
  from public.bookings where code = 'CLB-2026-0011'
union all
select id, '66666666-6666-4666-8666-666666666666'::uuid, 'influencer'::public.actor_role,
       'SUBMITTED'::public.booking_status, 'DISPUTED'::public.booking_status,
       'Sengketa dibuka: permintaan revisi di luar brief setelah kuota habis.', submitted_at + interval '1 day'
  from public.bookings where code = 'CLB-2026-0011'
union all
select id, '77777777-7777-4777-8777-777777777777'::uuid, 'influencer'::public.actor_role,
       null::public.booking_status, 'ACCEPTED'::public.booking_status,
       'Brief diterima.', accepted_at
  from public.bookings where code = 'CLB-2026-0012'
union all
select id, '99999999-9999-4999-8999-999999999999'::uuid, 'umkm'::public.actor_role,
       'ACCEPTED'::public.booking_status, 'FUNDED'::public.booking_status,
       'Dana ditahan escrow.', funded_at
  from public.bookings where code = 'CLB-2026-0012'
union all
select id, '77777777-7777-4777-8777-777777777777'::uuid, 'influencer'::public.actor_role,
       'FUNDED'::public.booking_status, 'SUBMITTED'::public.booking_status,
       'Konten ronde 1 dikirim.', submitted_at
  from public.bookings where code = 'CLB-2026-0012'
union all
select id, '99999999-9999-4999-8999-999999999999'::uuid, 'umkm'::public.actor_role,
       'SUBMITTED'::public.booking_status, 'DISPUTED'::public.booking_status,
       'Sengketa dibuka: konten belum tayang melewati jadwal.', submitted_at + interval '1 day'
  from public.bookings where code = 'CLB-2026-0012'
union all
select id, '88888888-8888-4888-8888-888888888888'::uuid, 'influencer'::public.actor_role,
       null::public.booking_status, 'ACCEPTED'::public.booking_status,
       'Brief diterima.', accepted_at
  from public.bookings where code = 'CLB-2026-0013'
union all
select id, '99999999-9999-4999-8999-999999999999'::uuid, 'umkm'::public.actor_role,
       'ACCEPTED'::public.booking_status, 'FUNDED'::public.booking_status,
       'Dana ditahan escrow.', funded_at
  from public.bookings where code = 'CLB-2026-0013'
union all
select id, '88888888-8888-4888-8888-888888888888'::uuid, 'influencer'::public.actor_role,
       'FUNDED'::public.booking_status, 'SUBMITTED'::public.booking_status,
       'Konten kampanye dikirim.', submitted_at
  from public.bookings where code = 'CLB-2026-0013'
union all
select id, '99999999-9999-4999-8999-999999999999'::uuid, 'umkm'::public.actor_role,
       'SUBMITTED'::public.booking_status, 'DISPUTED'::public.booking_status,
       'Sengketa dibuka: hasil dinilai belum sesuai kesepakatan.', submitted_at + interval '2 days'
  from public.bookings where code = 'CLB-2026-0013'
union all
select id, '44444444-4444-4444-8444-444444444444'::uuid, 'admin'::public.actor_role,
       'DISPUTED'::public.booking_status, 'COMPLETED'::public.booking_status,
       'Diputuskan: Bagi Dana 70% kreator / 30% UMKM.', completed_at
  from public.bookings where code = 'CLB-2026-0013';

-- The disputes themselves. due_at is in the past for the overdue OPEN case and
-- in the future for NEED_INFO, whose paused_at records when the clock stopped.
insert into public.disputes (code, booking_id, reason, opened_by, status, due_at, paused_at,
                             decision, creator_share_percent, decision_note, decided_by, decided_at, created_at)
select 'DSP-2026-0011', id,
       'UMKM meminta penggantian konten penuh di luar brief setelah kuota revisi habis; kreator menolak mengulang tanpa kesepakatan baru.',
       'influencer'::public.party_role, 'OPEN'::public.dispute_status,
       now() - interval '2 days', null::timestamptz, null::public.dispute_decision,
       null::integer, null::text, null::uuid, null::timestamptz, now() - interval '5 days'
  from public.bookings where code = 'CLB-2026-0011'
union all
select 'DSP-2026-0012', id,
       'Konten belum tayang melewati jadwal yang disepakati; UMKM meminta kepastian tanggal tayang.',
       'umkm'::public.party_role, 'NEED_INFO'::public.dispute_status,
       now() + interval '2 days', now() - interval '1 day', null::public.dispute_decision,
       null::integer, null::text, null::uuid, null::timestamptz, now() - interval '3 days'
  from public.bookings where code = 'CLB-2026-0012'
union all
select 'DSP-2026-0013', id,
       'Kualitas konten dinilai belum sesuai kesepakatan; kedua pihak sepakat menyelesaikan lewat mediasi.',
       'umkm'::public.party_role, 'RESOLVED'::public.dispute_status,
       now() - interval '15 days', null, 'SPLIT'::public.dispute_decision, 70,
       'Konten diterima sebagian. Dana dibagi 70% ke kreator, 30% kembali ke UMKM.',
       '44444444-4444-4444-8444-444444444444'::uuid, now() - interval '16 days', now() - interval '22 days'
  from public.bookings where code = 'CLB-2026-0013';

-- Mediation Q&A. The open case has an answered exchange; the NEED_INFO case has
-- one unanswered question, which is what keeps it paused. The decided case keeps
-- the exchange that preceded the split.
insert into public.dispute_infos (dispute_id, asked_by, target_role, question, answer, answered_by, answered_at, created_at)
select d.id, '44444444-4444-4444-8444-444444444444'::uuid, 'influencer'::public.party_role,
       'Apakah permintaan penggantian masih dalam cakupan brief awal?',
       'Tidak. Permintaan mengubah gaya penyajian total, di luar brief.',
       '66666666-6666-4666-8666-666666666666'::uuid, now() - interval '3 days', now() - interval '4 days'
  from public.disputes d where d.code = 'DSP-2026-0011'
union all
select d.id, '44444444-4444-4444-8444-444444444444'::uuid, 'umkm'::public.party_role,
       'Mohon konfirmasi tanggal tayang final yang disepakati kedua pihak.',
       null, null, null, now() - interval '2 days'
  from public.disputes d where d.code = 'DSP-2026-0012'
union all
select d.id, '44444444-4444-4444-8444-444444444444'::uuid, 'umkm'::public.party_role,
       'Berapa bagian konten yang sudah memenuhi brief?',
       'Bagian pembuka dan penutup sudah sesuai; bagian tengah belum.',
       '99999999-9999-4999-8999-999999999999'::uuid, now() - interval '18 days', now() - interval '19 days'
  from public.disputes d where d.code = 'DSP-2026-0013';

-- ----------------------------------------------------------------------------
-- Chat
--
-- One conversation per booking, created the moment the booking is made (the same
-- rule `submit_booking` follows), plus a short exchange so the chat page has
-- something to render before anyone types. The business's first message is the
-- brief itself, which is why it repeats the booking's `brief`.
--
-- read_at records when the *recipient* saw a message. On the open booking
-- (ACCEPTED) Rara's last reply is left unread, so Budi's chat list shows a badge;
-- on the finished booking every message is read, because the thread is already
-- read-only.
-- ----------------------------------------------------------------------------

insert into public.conversations (booking_id)
select id from public.bookings order by id;

-- Booking 1: Budi (umkm 1) x Rara (influencer 1), still moving.
insert into public.messages (conversation_id, sender_id, body, sent_at, read_at)
select c.id, '11111111-1111-4111-8111-111111111111'::uuid, b.brief,
       b.created_at, b.created_at + interval '3 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0002'
union all
select c.id, '22222222-2222-4222-8222-222222222222'::uuid,
       'Halo kak Budi! Brief-nya sudah saya baca. Night vibe grand opening-nya seru, saya mulai dari sesi golden hour ya.',
       b.created_at + interval '3 hours', b.created_at + interval '1 day'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0002'
union all
select c.id, '11111111-1111-4111-8111-111111111111'::uuid,
       'Mantap, ditunggu! Kalau butuh info menu baru tinggal chat ya.',
       b.created_at + interval '1 day', b.created_at + interval '1 day 3 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0002'
union all
select c.id, '22222222-2222-4222-8222-222222222222'::uuid,
       'Siap! Draft ronde pertama saya kirim lewat delivery ya kak.',
       b.created_at + interval '1 day 3 hours', null::timestamptz
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0002';

-- Booking 2: Dewi (umkm 3) x Rara (influencer 1), finished. Every message read.
-- Timestamps hang off `created_at`, not `completed_at`: the seeded finished
-- booking is backdated on completion only, so `completed_at` sits before
-- `created_at` and anchoring there would put the last message first.
insert into public.messages (conversation_id, sender_id, body, sent_at, read_at)
select c.id, '55555555-5555-4555-8555-555555555555'::uuid, b.brief,
       b.created_at, b.created_at + interval '3 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0007'
union all
select c.id, '22222222-2222-4222-8222-222222222222'::uuid,
       'Terima kasih kak Dewi! Saya review kopi gayo single origin plus breakfast set-nya ya.',
       b.created_at + interval '3 hours', b.created_at + interval '5 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0007'
union all
select c.id, '55555555-5555-4555-8555-555555555555'::uuid,
       'Hasilnya bagus banget, terima kasih!',
       b.created_at + interval '5 hours', b.created_at + interval '6 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0007';

-- The three disputed bookings each get a short exchange, so the operator's case
-- view has both sides' words. The NEED_INFO case's last message is the creator
-- waiting on the business, which is exactly what the operator asked about.
insert into public.messages (conversation_id, sender_id, body, sent_at, read_at)
select c.id, '66666666-6666-4666-8666-666666666666'::uuid,
       'Konten ronde 1 sudah mengikuti brief awal ya kak.',
       b.created_at + interval '8 days', b.created_at + interval '8 days 2 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0011'
union all
select c.id, '99999999-9999-4999-8999-999999999999'::uuid,
       'Kami butuh konten diulang total, bukan sekadar revisi kecil.',
       b.created_at + interval '8 days 3 hours', null::timestamptz
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0011'
union all
select c.id, '99999999-9999-4999-8999-999999999999'::uuid,
       'Jadwal tayang sudah lewat, mohon kepastian tanggalnya.',
       b.created_at + interval '8 days', b.created_at + interval '8 days 1 hour'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0012'
union all
select c.id, '77777777-7777-4777-8777-777777777777'::uuid,
       'Draf sudah siap; saya menunggu konfirmasi jadwal tayang dari pihak UMKM.',
       b.created_at + interval '9 days', null::timestamptz
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0012'
union all
select c.id, '88888888-8888-4888-8888-888888888888'::uuid,
       'Kampanye sudah tayang, terima kasih untuk kerja samanya.',
       b.created_at + interval '12 days', b.created_at + interval '12 days 2 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0013'
union all
select c.id, '99999999-9999-4999-8999-999999999999'::uuid,
       'Terima kasih, hasilnya membantu penjualan kami.',
       b.created_at + interval '12 days 3 hours', b.created_at + interval '12 days 4 hours'
  from public.conversations c join public.bookings b on b.id = c.booking_id
 where b.code = 'CLB-2026-0013';

-- ----------------------------------------------------------------------------
-- Bridge alignment
--
-- `onboard` writes to Postgres and mirrors the record into SQLite under the
-- *same* id, because until catalog-and-booking ports the reads, the SQLite pages
-- resolve a caller with `profiles.umkm_id` / `profiles.influencer_id` and then
-- look that id up in SQLite. So an id Postgres hands out must be one SQLite is
-- not already using - and SQLite is the larger of the two here.
--
-- `lib/seed.ts` creates twelve creators and four businesses. This file mirrors
-- the first four of each, so a plain sequence would hand out creator 5 and land
-- on top of a seeded SQLite creator, and onboarding would fail on a constraint
-- while creating nothing. Both sequences are therefore started past the SQLite
-- maximum: creators at 13, businesses at 5.
--
-- The invariant this maintains is "the Postgres sequence is never below SQLite's
-- highest id". It holds from here on because the mirror only ever raises the two
-- together, and `npm run db:seed` rewinds SQLite downwards rather than upwards.
--
-- The gap left in the Postgres ids is deliberate and cosmetic: nothing renders an
-- id, and catalog-and-booking drops the mirror entirely.
--
-- `setval` rather than `ALTER ... RESTART WITH`, because a restart leaves
-- `pg_sequences.last_value` NULL and stores its value nowhere queryable - which
-- would make the one number this block exists to set impossible to assert.
-- setval(..., 12, true) means "next nextval returns 13", and reads back as 12.
-- ----------------------------------------------------------------------------

select setval('public.influencers_id_seq', 12, true);
select setval('public.umkms_id_seq',        4, true);

-- ----------------------------------------------------------------------------
-- What was written
--
-- Echoed so `supabase db reset` output shows the shape of the database without
-- a separate query, which is what task 5.1 and 5.2 are checked against.
-- ----------------------------------------------------------------------------

select 'categories'   as table_name, count(*) from public.categories
union all select 'influencers',     count(*) from public.influencers
union all select 'packages',        count(*) from public.packages
union all select 'umkms',           count(*) from public.umkms
union all select 'profiles',        count(*) from public.profiles
union all select 'bookings',        count(*) from public.bookings
union all select 'deliveries',      count(*) from public.deliveries
union all select 'payments',        count(*) from public.payments
union all select 'booking_events',  count(*) from public.booking_events
union all select 'reviews',         count(*) from public.reviews
union all select 'conversations',   count(*) from public.conversations
union all select 'messages',        count(*) from public.messages
union all select 'disputes',        count(*) from public.disputes
union all select 'dispute_infos',   count(*) from public.dispute_infos
union all select 'auth_users',      count(*) from auth.users where email like '%@kolab.id'
order by 1;