# Proposal

## Why

Chat is the channel ARCHITECTURE §2.7 gives the two parties to clarify a brief, agree on a schedule, and discuss revisions, and the `conversations` / `messages` tables already ship in the schema. But the capability was deferred: both tables are policy-less, no code reads or writes them, and the UMKM and creator chat pages render page-local fixture conversations. A collaboration cannot actually be discussed, and the unread badge is fake.

## What Changes

- Make `conversations` and `messages` real: a party-scoped `SELECT` policy on each (resolved through the booking, mirroring `resolution_offers`) and an index on `messages (conversation_id, sent_at)`.
- Add `send_message(p_booking_id, p_actor_role, p_body)` — the only writer of a message — and `mark_conversation_read(p_booking_id, p_actor_role)`, which clears the other party's unread messages. Both resolve the sender/reader from `p_actor_role` and the booking, like `apply_booking_transition`, so they work through the service-role client the Server Actions use.
- Keep chat open from `PENDING` through `DISPUTED`, read-only in `COMPLETED` / `CANCELLED`, and closed in `REJECTED`; `send_message` refuses the finished states, so the rule holds regardless of what the UI sends.
- Create the conversation and its first message (the brief) when the request is submitted, so every booking has a thread.
- Read chat from the database in both dashboards, derive the unread badge from `read_at`, and send through a Server Action with optimistic rendering.
- Seed two demo conversations and extend the RLS verification script.
- **BREAKING** (corrective, not behavioural): amend `rls-access-control` so conversations and messages are no longer listed as "not shipped". The same stale requirement also still names settlement offers, which shipped in the earlier resolution-offers change.

## Capabilities

### New Capabilities
- `chat`: one conversation per request, the messages it holds, who may read and write them, how read state is tracked, and how the chat follows the request's state.

### Modified Capabilities
- `rls-access-control`: a party may read its booking's conversation and messages; the "not shipped" requirement now covers only disputes, dispute information, and notifications.

## Impact

- Database: `supabase/migrations/20261007140000_chat.sql` — two read policies, one index, `send_message`, and `mark_conversation_read`.
- Data layer: `lib/data/chat.ts` (`getChatMessagesForBookings`, `ChatMessageRecord`).
- Server Actions: `sendMessage` and `markChatRead` in `app/actions.ts` (party-scoped read first, service-role RPC after); `submitBooking` writes the brief as the first message.
- UI: `app/(umkm)/dashboard/chat/page.tsx` + `chat-client.tsx`, `app/dashboard/influencer/chat/page.tsx` + `chat-client.tsx`, and `components/chat/types.ts` (`bookingId`).
- Seed and verification: `supabase/seed.sql` (two conversations, seven messages) and `scripts/verify-rls.ps1` (chat party reads, anonymous empty, insert refused, row counts).
- Docs: `DEVELOPMENT.md` (chat functions and policies, and the tables that remain policy-less).
