-- Chat: the conversation thread that hangs off a booking (ARCHITECTURE §2.7).
--
-- `conversations` and `messages` already ship in the remote schema but were left
-- policy-less when this capability was deferred (see rls_baseline.sql). This
-- migration turns them on:
--   1. a party-scoped SELECT policy on each, mirroring resolution_offers: a row
--      is visible when the caller is a party to its booking;
--   2. `send_message`, the only writer of a message. It resolves the sender from
--      the role and the booking (like `apply_booking_transition`), so it needs no
--      actor id and works through the service-role client the actions use;
--   3. `mark_conversation_read`, so an unread badge can clear when a thread is
--      opened.
--
-- Chat state follows the booking: open from PENDING through DISPUTED, read-only
-- once COMPLETED/CANCELLED, closed on REJECTED. `send_message` refuses the three
-- finished states, so the rule holds no matter what the UI sent.
--
-- No write policy is created: the browser key still cannot insert a message.
-- Every write goes through a Server Action's service-role client.

-- ------------------------------------------------- 1. read policies --
--
-- `messages` has no booking_id of its own, so it reaches the booking through its
-- conversation. Both policies resolve the caller the same way bookings does.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'conversations'
       and policyname = 'conversations_party_read'
  ) then
    create policy conversations_party_read on public.conversations
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = conversations.booking_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'messages'
       and policyname = 'messages_party_read'
  ) then
    create policy messages_party_read on public.messages
      for select
      using (
        exists (
          select 1
            from public.conversations c
            join public.bookings b on b.id = c.booking_id
           where c.id = messages.conversation_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;
end
$$;

-- ------------------------------------------------- 2. access paths --
create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, sent_at);

-- -------------------------------------------------- 3. send_message --
--
-- One writer for a new message. The sender is resolved from `p_actor_role` and
-- the booking, so the function is callable through the service-role client with
-- no session attached (the Server Action has already proved the caller is a
-- party by reading the booking through that caller's own session).
--
-- The conversation row is created on demand: `submit_booking` writes one when the
-- booking is made, but an older or seeded booking may not have one yet, and a
-- message must still land.
create or replace function public.send_message(
  p_booking_id bigint,
  p_actor_role actor_role,
  p_body       text
) returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking      public.bookings;
  v_body         text;
  v_sender       uuid;
  v_conversation bigint;
  v_row          public.messages;
begin
  if p_actor_role not in ('umkm', 'influencer') then
    raise exception 'Hanya pihak pada booking yang dapat mengirim pesan'
      using errcode = 'check_violation';
  end if;

  v_body := btrim(coalesce(p_body, ''));
  if v_body = '' then
    raise exception 'Pesan tidak boleh kosong' using errcode = 'check_violation';
  end if;
  -- The database caps the body as well as the action, so a crafted request
  -- cannot store an unbounded string.
  if length(v_body) > 2000 then
    v_body := left(v_body, 2000);
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id
      using errcode = 'no_data_found';
  end if;

  -- Finished collaborations have nothing left to discuss.
  if v_booking.status in ('COMPLETED', 'REJECTED', 'CANCELLED') then
    raise exception 'Percakapan sudah ditutup' using errcode = 'check_violation';
  end if;

  if p_actor_role = 'umkm' then
    select user_id into v_sender from public.profiles where umkm_id = v_booking.umkm_id limit 1;
  else
    select user_id into v_sender from public.profiles where influencer_id = v_booking.influencer_id limit 1;
  end if;
  if v_sender is null then
    raise exception 'Pengirim tidak dikenali' using errcode = 'check_violation';
  end if;

  select id into v_conversation from public.conversations where booking_id = p_booking_id;
  if not found then
    insert into public.conversations (booking_id)
    values (p_booking_id)
    returning id into v_conversation;
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conversation, v_sender, v_body)
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------- 4. mark_conversation_read --
--
-- Marks every message the *other* party sent as read for this caller, and
-- returns how many changed. The reader is resolved from the role and the booking
-- exactly as in `send_message`.
create or replace function public.mark_conversation_read(
  p_booking_id bigint,
  p_actor_role actor_role
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking      public.bookings;
  v_reader       uuid;
  v_conversation bigint;
  v_count        integer;
begin
  if p_actor_role not in ('umkm', 'influencer') then
    raise exception 'Hanya pihak pada booking yang dapat membaca pesan'
      using errcode = 'check_violation';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id
      using errcode = 'no_data_found';
  end if;

  if p_actor_role = 'umkm' then
    select user_id into v_reader from public.profiles where umkm_id = v_booking.umkm_id limit 1;
  else
    select user_id into v_reader from public.profiles where influencer_id = v_booking.influencer_id limit 1;
  end if;

  select id into v_conversation from public.conversations where booking_id = p_booking_id;
  if not found then
    return 0;
  end if;

  update public.messages
     set read_at = now()
   where conversation_id = v_conversation
     and sender_id <> v_reader
     and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
