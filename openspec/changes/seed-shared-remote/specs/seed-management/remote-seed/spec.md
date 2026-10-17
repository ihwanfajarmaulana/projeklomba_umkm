# seed-management/remote-seed Specification

## Purpose

Define what the shared remote Supabase project contains so every developer signs in against the same migrated schema and demo data instead of only their own local stack.

## ADDED Requirements

### Requirement: The shared remote carries every committed migration

The system SHALL have all files in `supabase/migrations/` applied on the shared remote project, in version order, before any seed is executed there.

#### Scenario: Migrations are pushed before seeding

- **WHEN** the team prepares the shared remote
- **THEN** `supabase db push` against the linked project reports every migration applied and none pending

#### Scenario: Seed runs on an unmigrated remote

- **WHEN** the seed is executed while a committed migration is missing from the remote
- **THEN** the run is stopped and the missing migration is applied first, rather than seeding a partial schema

### Requirement: The shared remote holds the demo seed

The system SHALL contain the same demo dataset on the shared remote that a local `supabase db reset` produces: the 9 demo auth users with matching `auth.identities` rows, one `profiles` row per user bound to its role and linked record, and the demo catalog, package, booking, and review rows from `supabase/seed.sql`.

#### Scenario: A developer signs in on the remote

- **WHEN** a developer opens the app pointed at the shared remote and signs in as `budi@kolab.id` with the documented demo password
- **THEN** a session is established and the UMKM dashboard renders with the seeded bookings

#### Scenario: A creator signs in on the remote

- **WHEN** a developer signs in as `rara@kolab.id` with the documented demo password
- **THEN** a session is established and the creator dashboard renders with the seeded packages

#### Scenario: Seeding repeats

- **WHEN** the seed is executed a second time against the same remote
- **THEN** the remote holds exactly one copy of each demo row and all 9 demo accounts still sign in (repeat-safe deletes and sequence restarts)

### Requirement: Seeding the shared remote stays out of production

The system SHALL document that the demo seed targets the shared development project only, and SHALL NOT apply demo users or demo data to any production project.

#### Scenario: A production project is provisioned

- **WHEN** the team provisions the production Supabase project
- **THEN** migrations are applied there with no demo seed, and no `%@kolab.id` account exists on it
