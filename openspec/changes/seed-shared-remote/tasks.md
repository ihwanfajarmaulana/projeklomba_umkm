# Tasks

## 1. Preflight

- [ ] 1.1 Confirm editor access to the shared remote project and record its project ref, verifying the Dashboard loads Database and Authentication sections
- [ ] 1.2 Check remote migration parity by listing applied migrations in Dashboard → Database → Migrations and verifying all 7 files from `supabase/migrations/` are present, noting any gaps
- [ ] 1.3 Confirm the local `SUPABASE_SERVICE_ROLE_KEY` for the remote lives in `.env.local` (gitignored) and verifying `git status` shows no secret files staged

## 2. Push migrations

- [ ] 2.1 Link the CLI with `npx supabase link --project-ref <ref>` and verify `npx supabase projects list` shows the shared project
- [ ] 2.2 Run `npx supabase db push` and verify it reports every migration applied with none pending, re-checking the Dashboard migrations list

## 3. Seed the remote

- [ ] 3.1 Execute the byte-identical `supabase/seed.sql` via Dashboard → SQL Editor (CLI `npx supabase db execute --linked -f supabase/seed.sql` as fallback) and verify the run completes with no statement errors
- [ ] 3.2 Assert seed counts on the remote (`auth.users` with `%@kolab.id` = 9, matching `auth.identities` = 9, `profiles` bound per role) and verify each count query returns the expected number
- [ ] 3.3 Contingency only if `auth` writes are rejected: create the 9 users via the Auth Admin API, bind `profiles` to the returned UUIDs, and verify the same counts as 3.2

## 4. Verify sign-in and document

- [ ] 4.1 Sign in against the remote as `budi@kolab.id` and as `rara@kolab.id` with the demo password, verifying the UMKM dashboard and creator dashboard each render with seeded data
- [ ] 4.2 Document the remote-seed procedure in `DEVELOPMENT.md` (§§3 setup, 9 seeding) including the dev-only boundary, and verify the documented commands read correctly end to end
- [ ] 4.3 Run `openspec validate --change seed-shared-remote` and verify it passes with all four artifacts present
