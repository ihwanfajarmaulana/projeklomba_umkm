# Tasks

## 1. Database: chat becomes real

- [x] 1.1 Add `supabase/migrations/20261007140000_chat.sql` with a party-scoped `SELECT` policy `conversations_party_read` mirroring `bookings_party_read`, a party-scoped `messages_party_read` resolving through the conversation, and an index `messages_conversation_id_idx on (conversation_id, sent_at)`; verify `npx supabase db reset` applies cleanly and both policies and the index exist in `pg_policies` / `pg_indexes`
- [x] 1.2 Implement `public.send_message(p_booking_id, p_actor_role, p_body)` as `security definer` plpgsql: refuse a role that is not `umkm` / `influencer`, refuse an empty body, cap the body at 2000 characters, lock the booking, refuse `COMPLETED` / `CANCELLED` / `REJECTED`, resolve the sender from the role and the booking, create the conversation on demand, insert the message, and return it; verify each refusal and the happy path with SQL assertions
- [x] 1.3 Implement `public.mark_conversation_read(p_booking_id, p_actor_role) returns integer`: resolve the reader from the role and the booking, mark every message the other party sent with `read_at is null` as read, and return the count changed; verify it returns the number of counterparty messages and changes nothing on a second call
- [x] 1.4 Regenerate `utils/supabase/database.types.ts` with `npm run db:types` and confirm the `Functions` block gains `send_message` and `mark_conversation_read`

## 2. Read layer

- [x] 2.1 Add `lib/data/chat.ts` with `getChatMessagesForBookings(bookingIds)` reading through the caller's user-scoped client, resolving conversations first and messages second (messages has no `booking_id`), ordering by `sent_at` / `id`, and mapping rows to a typed `ChatMessageRecord` that carries the owning `bookingId`; verify a party sees its thread and a non-party sees nothing
- [x] 2.2 Add `bookingId` to `ChatConversation` in `components/chat/types.ts` so a loaded thread can be grouped back to its booking; verify `npm run verify:rls` type-checks

## 3. Server Actions

- [x] 3.1 Add `sendMessage(formData)` to `app/actions.ts`: resolve the caller's role, read the booking through that caller's own session (`ownedChat`), refuse when RLS returns nothing, then call `send_message` through the service-role client and revalidate the chat path; verify a party sends and a non-party is refused
- [x] 3.2 Add `markChatRead(formData)` the same way, calling `mark_conversation_read`, and revalidate so the unread badge clears; verify the count comes back and the badge clears on open
- [x] 3.3 Make `submitBooking` insert the brief as the conversation's first message, so every new booking has a thread; verify a submitted booking has one message whose body is the brief

## 4. UI

- [x] 4.1 Wire `app/(umkm)/dashboard/chat/page.tsx` to read conversations and messages from the database, derive unread from `read_at`, and pass real rows to the client; verify Budi sees his thread with his badge and not another business's
- [x] 4.2 Wire `app/dashboard/influencer/chat/page.tsx` the same way for the creator side; verify Rara sees the threads she is named on
- [x] 4.3 Update both `chat-client.tsx` to send through `sendMessage` with `useOptimistic` (chosen over `setState` in an effect to satisfy the `react-hooks/set-state-in-effect` lint rule) and to call `markChatRead` when a thread opens; verify a sent message appears immediately and the thread reconciles
- [x] 4.4 Reflect the state rule in the client: open `PENDING` through `DISPUTED`, read-only `COMPLETED` / `CANCELLED` (the original code left `CANCELLED` writable), and closed `REJECTED`; verify the composer matches the booking state

## 5. Seed and verification

- [x] 5.1 Add two conversations and seven messages to `supabase/seed.sql` (booking `CLB-2026-0002` = four messages, one unread for the creator; booking `CLB-2026-0007` = three messages, all read), anchoring the second booking's messages on `created_at` because its `completed_at` is backdated before `created_at`; update the seed's echoed row counts
- [x] 5.2 Extend `scripts/verify-rls.ps1` for chat: each party reads only its own conversation and messages, an anonymous caller reads none, a browser message insert is refused, and the seeded row counts are conversations = 2 and messages = 7; verify `npm run verify` passes
- [x] 5.3 Run a direct RPC check: `send_message` stores a row, `mark_conversation_read` returns the number of counterparty messages, and `send_message` refuses a `COMPLETED` booking

## 6. Close-out

- [x] 6.1 Update `DEVELOPMENT.md`: document `send_message` and `mark_conversation_read`, the two read policies, the state rule, that the browser key still cannot write, and that `conversations` / `messages` leave the "deliberately policy-less" list (now `disputes`, `dispute_infos`, `notifications`); fix the "coming-soon stub" / "planned" chat lines in the page table
- [x] 6.2 Run `npx tsc --noEmit`, `npm run lint`, and a clean `npm run build` (with the dev server stopped) and confirm all pass
- [x] 6.3 Run `openspec validate chat --strict` and `openspec validate --all` and confirm the change and every spec are valid
