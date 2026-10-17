# Design: seed-shared-remote

## Context

See proposal.md (Why) for motivation. Current state and constraints:

- 7 migration files in `supabase/migrations/` (remote schema baseline, RLS baseline, starting-price trigger, package snapshot, booking lifecycle, reviews, resolution offers).
- `supabase/seed.sql` (472 lines) is repeat-safe and self-contained: FK-ordered deletes, sequence restarts, fixed UUIDs, `crypt()` hashes (core since PG13 — no extension needed), `auth.identities` rows, empty-string (not NULL) token columns per GoTrue's scanner requirements.
- No Supabase CLI link state exists on this machine; the `supabase` binary is not on PATH, but the repo carries it as a dependency (`npx supabase` works).
- Tracked `.env` already points the app at the shared remote, so no env change is needed to consume the seed — only to perform it (service-role key, gitignored in `.env.local`).

## Goals / Non-Goals

- Goals: migration parity on the remote; remote holds the full demo seed; verified sign-in for both roles; procedure documented in `DEVELOPMENT.md`.
- Non-goals: new seed data or accounts; RLS/policy changes; new migrations; production provisioning; changing what `db:reset` does locally.

## Decisions

1. **Push via linked CLI (`npx supabase link` + `db push`), not hand-applied SQL.**
   Why: the migration history table becomes the source of truth, so future `db push` runs stay incremental. Alternative (pasting each migration into SQL Editor) leaves the history table empty and re-applies risk on every future push.

2. **Seed via Dashboard SQL Editor paste, CLI `db execute --linked` as fallback.**
   Why: the SQL Editor runs as `postgres`, which can write `auth.users`/`auth.identities` directly — the same privilege `db reset` uses locally. Editor paste also gives immediate visible errors per statement. CLI execute is equivalent and kept as fallback for scripting.

3. **Keep the seed file byte-identical.**
   Why: any edit risks diverging remote from local; the file is already repeat-safe and its fixed UUIDs keep verification assertions stable. No fork, no remote-only variant.

4. **Verify with counts + live sign-in, not just "no errors".**
   Why: an empty-table seed and an RLS denial look identical (zero rows, 200). Assertions: 9 `auth.users` with `%@kolab.id`, 9 identities, profiles bound per role, then real sign-in as both demo roles.

## Risks / Trade-offs

- [Risk] Seed deletes `%@kolab.id` users and demo rows first — on the shared project a teammate's in-flight test data under those addresses disappears → Mitigation: announce the seed run; scope deletes to the `@kolab.id` suffix only (already true in the file).
- [Risk] `auth` schema writes rejected on hosted → Mitigation: SQL Editor runs as `postgres`; if restricted, fall back to creating the 9 users via Auth Admin API + the rest via SQL, binding `profiles` to the returned UUIDs (documented as contingency in tasks).
- [Risk] Shared mutable demo data (one person's booking action changes everyone's view) → Mitigation: accepted by requester; recorded in proposal and docs. Re-seed any time to restore.
- [Risk] Service-role key handling → Mitigation: key stays in `.env.local`, never committed, never pasted into chat; only used for link/push/verify.

## Migration Plan

1. `npx supabase link --project-ref <ref>` (editor access confirmed).
2. `npx supabase db push` — expect 7/7 applied.
3. Execute `supabase/seed.sql` on remote (Editor paste, else CLI execute).
4. Run count assertions + sign-in smoke tests.
5. Update `DEVELOPMENT.md` §§3, 9; commit the doc + archived change only (no app code changes, nothing to deploy, no rollback beyond re-running the seed).

## Open Questions

None — access confirmed, approach verified read-only against the repo. Only deferrable item: whether to later automate remote seeding per-merge is out of scope for this change.
