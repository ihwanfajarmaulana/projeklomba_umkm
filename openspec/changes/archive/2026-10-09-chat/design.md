# Design

## Context

- `conversations` (one per booking) and `messages` (with `sender_id`, `body`, `sent_at`, `read_at`) already exist in `supabase/migrations/20261002100608_remote_schema.sql`. RLS is enabled on both with no policy, so they return an empty result rather than an error.
- `submit_booking`, `apply_booking_transition`, `create_offer`, and `respond_to_offer` all follow one pattern: a `security definer` plpgsql function derives the actor from `p_actor_role` plus the booking, so it is callable through the service-role client with no session attached.
- Server Actions authorize by reading the row through the caller's own session first, then call the function through the service-role client (see DEVELOPMENT.md).
- Both chat pages rendered a page-local fixture (`chat/page.tsx`) and the client `chat-client.tsx` held messages in `useState`; there was no reader in `lib/data` and no action.

## Goals / Non-Goals

**Goals:**

- Store and read real conversations and messages, scoped to the booking's two parties.
- Keep every write server-side; the browser key still cannot insert a message or clear a read flag.
- Follow the booking state: usable while the collaboration is in progress, read-only once it is finished.
- Give each request a thread from the moment it is submitted, with the brief as the first message.

**Non-Goals:**

- Admin read access to a disputed booking's chat (ARCHITECTURE §2.7 grants it only while a dispute is undecided, but the admin dispute capability does not exist yet — the existing `rls-access-control` scenario that says an admin reads nothing stays true).
- Attachments, message editing or deletion, typing indicators, or realtime subscriptions.
- Notifications (a separate capability).

## Decisions

### 1. Direct database functions, actor derived from the booking

`send_message` and `mark_conversation_read` are `security definer` functions that resolve the sender/reader from `p_actor_role` and the booking's `umkm_id` / `influencer_id`, not from `auth.uid()`. This matches `apply_booking_transition` and `create_offer`: the function works through the service-role client the action uses, and the action has already proved the caller is a party by reading the booking through that caller's own session.

Alternative: a `security invoker` function relying on `auth.uid()` and an RLS write policy. Rejected — no write policy exists anywhere in this project, and writes are deliberately server-side only.

### 2. Party-scoped `SELECT` policies, no write policy

`conversations_party_read` and `messages_party_read` resolve the caller through the booking exactly like `bookings_party_read` and `resolution_offers_party_read`. `messages` has no `booking_id`, so it reaches the booking through its conversation. No `INSERT`/`UPDATE` policy is created: the browser key cannot write a message, which the RLS verification asserts.

### 3. Read state lives on the message, cleared for the counterparty

`read_at` is a single nullable timestamp per message. `mark_conversation_read` sets it for every message the *other* party sent that is still unread, and returns the number changed. The unread badge is `count(read_at is null and sender <> me)`. A single flag is enough for two-party threads; per-user read receipts are out of scope.

### 4. Chat follows the booking state, enforced in the function

`send_message` refuses `COMPLETED`, `CANCELLED`, and `REJECTED` with "Percakapan sudah ditutup". Reading stays allowed. The page reflects the same rule (read-only composer for `COMPLETED`/`CANCELLED`, closed for `REJECTED`), but the function is the guard, so a crafted request cannot post to a finished thread. The original client treated `CANCELLED` as still open; the fix makes it read-only.

### 5. The brief is the first message

`submit_booking` inserts the booking's brief as the first `messages` row, so a thread exists from submission and the parties see what was agreed. `send_message` still creates the conversation on demand, so an older or seeded booking without a conversation can still receive a message.

### 6. Optimistic send in the client

`chat-client.tsx` uses `useOptimistic` to show the sent message immediately, then the Server Action returns and the server data reconciles. `useOptimistic` was chosen over `setState` in an effect to satisfy the `react-hooks/set-state-in-effect` lint rule. The action revalidates the chat path so the thread and unread badge refetch.

## Risks / Trade-offs

- [A finished thread could still accept a crafted write] → `send_message` refuses the finished states in the database, not only in the UI.
- [An RLS-hidden read returns empty, which could look like "no messages"] → this is the same behaviour as bookings and offers; the pages only ever read bookings the caller is a party to.
- [A single `read_at` cannot represent per-user receipts] → acceptable for a two-party thread; noted as a non-goal.
- [`send_message` truncates a body over 2000 characters] → the action also caps the length, and the truncation is deliberate so a crafted request cannot store an unbounded string.

## Migration Plan

1. Add `supabase/migrations/20261007140000_chat.sql`: the two read policies, the message index, `send_message`, and `mark_conversation_read`.
2. `npx supabase db reset` to apply against the local stack; `npm run db:types` for the RPC type entries.
3. Add the seed conversations/messages and extend `scripts/verify-rls.ps1`.
4. `npm run verify`, `npm run lint`, and a clean `npm run build`.
5. No rollback beyond dropping the two functions and the two policies; the tables already exist.
