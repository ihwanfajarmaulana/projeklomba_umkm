# Proposal

## Why

Login works on your friend's machine but not on yours: `supabase/seed.sql` (9 demo `auth.users` + `auth.identities` rows, `profiles` bindings, demo catalog data) only ever runs via `supabase db reset`, which targets the **local** stack (`127.0.0.1:54321`). The tracked `.env` points the app at the **shared remote** project, which has no seeded users — so the demo credentials (`budi@kolab.id` / `kolab12345`) and any `profiles` rows don't exist there and sign-in fails. Seeding the shared remote once makes one login story true for the whole team.

## What Changes

- Link the Supabase CLI to the shared remote project and push all 7 files in `supabase/migrations/` so the remote schema matches the repo (`db push`).
- Execute `supabase/seed.sql` against the remote (Dashboard SQL Editor paste, CLI `db execute --linked` as fallback), creating the 9 demo auth users, identities, profiles, and demo catalog/booking data.
- Verify with row-count assertions and a sign-in smoke test for both roles (UMKM + creator).
- Document the remote-seed procedure in `DEVELOPMENT.md` (§3/§9) and amend the "no deployed database is seeded" statement to carve out this shared dev project.
- No app code, RLS policy, migration, or seed-data changes. No new demo accounts.

## Capabilities

### New Capabilities

- `seed-management/remote-seed`: what the shared remote project SHALL contain (migrated schema + repeat-safe demo seed) so every developer signs in against the same data.

### Modified Capabilities

(none — no application requirement changes; `auth-session` and `rls-access-control` behavior is untouched.)

## Impact

- **Systems:** shared remote Supabase project (auth users, public tables). Local stacks unaffected.
- **Docs:** `DEVELOPMENT.md` §§3, 9 gain a "shared remote seed" procedure.
- **Risk:** seeding is destructive-by-design on demo tables (seed deletes `%@kolab.id` users and demo rows first) — safe only because the target is the shared *dev* project, never production. The change records that boundary.
- **Team:** everyone points at the same demo data; one person's testing mutates everyone's view (accepted — recorded as a decision).
