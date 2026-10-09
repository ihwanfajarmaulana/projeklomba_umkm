-- Admin dispute decisions: the operator's half of the mediation ladder
-- (ARCHITECTURE §5.7) - read a disputed booking, ask a party for information, and
-- make one binding decision that moves the held money.
--
-- Three pieces:
--   1. two admin transitions added to `apply_booking_transition`, so DISPUTED can
--      reach COMPLETED / CANCELLED - and only for `admin`;
--   2. read policies that let an operator see every dispute, and a booking (with
--      its children) only while a dispute hangs off it - and nothing else;
--   3. `decide_dispute`, `request_dispute_info` and `answer_dispute_info`, the
--      only writers of a decision and of the mediation Q&A.
--
-- `apply_booking_transition` remains the only writer of `bookings.status`, and
-- the escrow total is never touched - a refund or a split only re-splits it. The
-- party-side settlement rules (resolution_offers) are untouched.
--
-- See openspec/changes/admin-disputes/.

-- ------------------------------------------------------- 0. role predicate --
--
-- `profiles_own_read` lets a caller read only its own profile, so the policy
-- subqueries cannot inline an EXISTS over profiles for an arbitrary caller.
-- SECURITY DEFINER runs the read as the owner (which bypasses the table's own
-- RLS) and the answer is a boolean, not a row.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
     where p.user_id = auth.uid()
       and p.role = 'admin'
  );
$$;

-- ---------------------------------------- 1. admin transitions in the matrix --
--
-- Same function as booking-lifecycle, with only the two new rows. Everything
-- else is copied verbatim so the diff is the matrix and nothing surrogate.
create or replace function public.apply_booking_transition(
  p_booking_id bigint,
  p_to booking_status,
  p_actor_role actor_role
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from  booking_status;
  v_row   public.bookings;
  v_actor uuid;
begin
  select * into v_row from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id using errcode = 'no_data_found';
  end if;
  v_from := v_row.status;

  if not exists (
    select 1 from (values
      ('PENDING'::booking_status,   'ACCEPTED'::booking_status,  'influencer'::actor_role),
      ('PENDING'::booking_status,   'REJECTED'::booking_status,  'influencer'::actor_role),
      ('PENDING'::booking_status,   'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('PENDING'::booking_status,   'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('ACCEPTED'::booking_status,  'FUNDED'::booking_status,    'umkm'::actor_role),
      ('ACCEPTED'::booking_status,  'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('ACCEPTED'::booking_status,  'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('FUNDED'::booking_status,    'SUBMITTED'::booking_status, 'influencer'::actor_role),
      ('FUNDED'::booking_status,    'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('FUNDED'::booking_status,    'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('SUBMITTED'::booking_status, 'REVISION'::booking_status,  'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'COMPLETED'::booking_status, 'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'DISPUTED'::booking_status,  'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'DISPUTED'::booking_status,  'influencer'::actor_role),
      ('SUBMITTED'::booking_status, 'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('REVISION'::booking_status,  'SUBMITTED'::booking_status, 'influencer'::actor_role),
      ('REVISION'::booking_status,  'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('REVISION'::booking_status,  'CANCELLED'::booking_status, 'influencer'::actor_role),
      -- The operator only ever acts on a dispute.
      ('DISPUTED'::booking_status,  'COMPLETED'::booking_status, 'admin'::actor_role),
      ('DISPUTED'::booking_status,  'CANCELLED'::booking_status, 'admin'::actor_role)
    ) as m(from_status, to_status, required_role)
    where m.from_status = v_from
      and m.to_status = p_to
      and m.required_role = p_actor_role
  ) then
    raise exception 'Transisi % -> % oleh % tidak diizinkan', v_from, p_to, p_actor_role
      using errcode = 'check_violation';
  end if;

  perform set_config('kolab.in_transition', '1', true);

  update public.bookings set
    status          = p_to,
    accepted_at     = case when p_to = 'ACCEPTED'  then now() else accepted_at end,
    brief_locked_at = case when p_to = 'ACCEPTED'  then now() else brief_locked_at end,
    payment_due_at  = case when p_to = 'ACCEPTED'  then now() + interval '24 hours' else payment_due_at end,
    funded_at       = case when p_to = 'FUNDED'    then now() else funded_at end,
    deadline_at     = case when p_to = 'FUNDED'    then now() + make_interval(days => estimated_days) else deadline_at end,
    submitted_at    = case when p_to = 'SUBMITTED' then now() else submitted_at end,
    review_due_at   = case when p_to = 'SUBMITTED' then now() + interval '3 days' else review_due_at end,
    completed_at    = case when p_to = 'COMPLETED' then now() else completed_at end,
    cancelled_at    = case when p_to = 'CANCELLED' then now() else cancelled_at end
  where id = p_booking_id
  returning * into v_row;

  if p_to = 'ACCEPTED' then
    insert into public.payments (booking_id, total_amount, status)
    values (p_booking_id, v_row.amount, 'UNPAID')
    on conflict (booking_id) do nothing;
  elsif p_to = 'FUNDED' then
    update public.payments set status = 'HELD', held_at = now()
     where booking_id = p_booking_id;
  elsif p_to = 'COMPLETED' then
    update public.payments
       set status = 'RELEASED', creator_amount = total_amount, settled_at = now()
     where booking_id = p_booking_id;
  end if;

  if p_actor_role = 'umkm' then
    select user_id into v_actor from public.profiles where umkm_id = v_row.umkm_id limit 1;
  elsif p_actor_role = 'influencer' then
    select user_id into v_actor from public.profiles where influencer_id = v_row.influencer_id limit 1;
  end if;

  insert into public.booking_events (booking_id, from_status, to_status, actor_id, actor_role)
  values (p_booking_id, v_from, p_to, v_actor, p_actor_role);

  return v_row;
end;
$$;

-- ------------------------------------------------------ 2. admin read policy --
--
-- An operator reads every dispute, but a booking and its children only while a
-- dispute hangs off that booking. Role alone is not enough: an admin is a party
-- to no collaboration, and the dispute is the only reason it may look at one.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'disputes'
       and policyname = 'disputes_admin_read'
  ) then
    create policy disputes_admin_read on public.disputes
      for select using (public.is_admin());
  end if;
end
$$;

-- The two parties to the booking read its dispute, so the party pages can show
-- what the operator asked and decided.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'disputes'
       and policyname = 'disputes_party_read'
  ) then
    create policy disputes_party_read on public.disputes
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = disputes.booking_id
             and (
                    b.umkm_id       = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'dispute_infos'
       and policyname = 'dispute_infos_admin_read'
  ) then
    create policy dispute_infos_admin_read on public.dispute_infos
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'dispute_infos'
       and policyname = 'dispute_infos_party_read'
  ) then
    create policy dispute_infos_party_read on public.dispute_infos
      for select
      using (
        exists (
          select 1
            from public.disputes d
            join public.bookings b on b.id = d.booking_id
           where d.id = dispute_infos.dispute_id
             and (
                    b.umkm_id       = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;
end
$$;

-- The disputed booking, and each table that hangs off it. Same shape as the
-- party policies, with `is_admin()` AND a dispute in place of the party test.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_admin_dispute_read') then
    create policy bookings_admin_dispute_read on public.bookings
      for select
      using (
        public.is_admin()
        and exists (select 1 from public.disputes d where d.booking_id = bookings.id)
      );
  end if;
end
$$;

do $$
declare
  t text;
begin
  foreach t in array array['deliveries', 'revision_requests', 'payments', 'booking_events', 'resolution_offers']
  loop
    if not exists (
      select 1 from pg_policies
       where schemaname = 'public' and tablename = t
         and policyname = t || '_admin_dispute_read'
    ) then
      execute format(
        'create policy %I on public.%I for select using (public.is_admin() and exists (select 1 from public.disputes d where d.booking_id = %I.booking_id))',
        t || '_admin_dispute_read', t, t
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_admin_dispute_read') then
    create policy conversations_admin_dispute_read on public.conversations
      for select
      using (
        public.is_admin()
        and exists (select 1 from public.disputes d where d.booking_id = conversations.booking_id)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_admin_dispute_read') then
    create policy messages_admin_dispute_read on public.messages
      for select
      using (
        public.is_admin()
        and exists (
          select 1
            from public.conversations c
            join public.disputes d on d.booking_id = c.booking_id
           where c.id = messages.conversation_id
        )
      );
  end if;
end
$$;

-- ------------------------------------------------------------ 3. decide_dispute --
--
-- The single binding decision. It moves the booking through the state machine
-- (which releases the full total on COMPLETED) and then, for a refund or a
-- split, re-splits the same held total - the total itself never changes:
--   RELEASE_FULL -> COMPLETED, payment RELEASED with creator_amount = total
--   REFUND_FULL  -> CANCELLED, payment REFUNDED with umkm_refund = total
--   SPLIT        -> COMPLETED, payment SPLIT with the given creator percentage
create or replace function public.decide_dispute(
  p_dispute_id            bigint,
  p_decision              dispute_decision,
  p_creator_share_percent integer,
  p_note                  text,
  p_decided_by            uuid
) returns public.disputes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispute public.disputes;
  v_booking public.bookings;
  v_percent integer;
  v_creator integer;
begin
  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'Sengketa % tidak ditemukan', p_dispute_id using errcode = 'no_data_found';
  end if;
  if v_dispute.status = 'RESOLVED' then
    raise exception 'Sengketa sudah diputuskan' using errcode = 'check_violation';
  end if;

  if p_note is null or btrim(p_note) = '' then
    raise exception 'Alasan keputusan wajib diisi' using errcode = 'check_violation';
  end if;

  select * into v_booking from public.bookings where id = v_dispute.booking_id for update;
  if v_booking.status <> 'DISPUTED' then
    raise exception 'Booking tidak sedang dalam sengketa' using errcode = 'check_violation';
  end if;

  if p_decision = 'SPLIT' then
    if p_creator_share_percent is null
       or p_creator_share_percent < 0
       or p_creator_share_percent > 100 then
      raise exception 'Porsi kreator harus antara 0 dan 100' using errcode = 'check_violation';
    end if;
    v_percent := p_creator_share_percent;
  end if;

  if p_decision = 'RELEASE_FULL' then
    perform public.apply_booking_transition(v_booking.id, 'COMPLETED', 'admin');

  elsif p_decision = 'REFUND_FULL' then
    perform public.apply_booking_transition(v_booking.id, 'CANCELLED', 'admin');
    update public.payments
       set status             = 'REFUNDED',
           creator_amount     = 0,
           umkm_refund_amount = total_amount,
           settled_at         = now()
     where booking_id = v_booking.id and status = 'HELD';

  elsif p_decision = 'SPLIT' then
    perform public.apply_booking_transition(v_booking.id, 'COMPLETED', 'admin');
    v_creator := round(v_booking.amount * v_percent / 100.0);
    update public.payments
       set status             = 'SPLIT',
           creator_amount     = v_creator,
           umkm_refund_amount = v_booking.amount - v_creator,
           settled_at         = now()
     where booking_id = v_booking.id;
  end if;

  -- `apply_booking_transition` cannot resolve an operator from the booking (there
  -- is no link between an admin and a collaboration), so the event it just wrote
  -- carries a null actor. Stamp the decision's author onto that row.
  update public.booking_events
     set actor_id = p_decided_by
   where booking_id = v_booking.id
     and actor_role = 'admin'
     and actor_id is null;

  update public.disputes
     set status                = 'RESOLVED',
         decision              = p_decision,
         creator_share_percent = v_percent,
         decision_note         = btrim(p_note),
         decided_by            = p_decided_by,
         decided_at            = now(),
         paused_at             = null
   where id = p_dispute_id
  returning * into v_dispute;

  return v_dispute;
end;
$$;

-- ---------------------------------------------------- 4. request_dispute_info --
--
-- The light-mediation step: the operator asks one party a question, the case
-- moves to NEED_INFO, and the decision clock pauses. Answered by the target via
-- `answer_dispute_info`; the clock resumes when the last open question closes.
create or replace function public.request_dispute_info(
  p_dispute_id  bigint,
  p_question    text,
  p_target_role party_role,
  p_asked_by    uuid
) returns public.dispute_infos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispute public.disputes;
  v_row     public.dispute_infos;
begin
  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'Sengketa % tidak ditemukan', p_dispute_id using errcode = 'no_data_found';
  end if;
  if v_dispute.status = 'RESOLVED' then
    raise exception 'Sengketa sudah diputuskan' using errcode = 'check_violation';
  end if;
  if p_question is null or btrim(p_question) = '' then
    raise exception 'Pertanyaan wajib diisi' using errcode = 'check_violation';
  end if;

  insert into public.dispute_infos (dispute_id, asked_by, target_role, question)
  values (p_dispute_id, p_asked_by, p_target_role, btrim(p_question))
  returning * into v_row;

  update public.disputes
     set status    = 'NEED_INFO',
         paused_at = coalesce(paused_at, now())
   where id = p_dispute_id;

  return v_row;
end;
$$;

-- ----------------------------------------------------- 5. answer_dispute_info --
create or replace function public.answer_dispute_info(
  p_info_id     bigint,
  p_actor_role  actor_role,
  p_answer      text,
  p_answered_by uuid
) returns public.dispute_infos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_info    public.dispute_infos;
  v_dispute public.disputes;
  v_open    integer;
begin
  if p_actor_role not in ('umkm', 'influencer') then
    raise exception 'Hanya pihak pada booking yang dapat menjawab'
      using errcode = 'check_violation';
  end if;

  select * into v_info from public.dispute_infos where id = p_info_id for update;
  if not found then
    raise exception 'Pertanyaan % tidak ditemukan', p_info_id using errcode = 'no_data_found';
  end if;
  if v_info.answer is not null then
    raise exception 'Pertanyaan sudah dijawab' using errcode = 'check_violation';
  end if;
  if v_info.target_role <> p_actor_role::text::party_role then
    raise exception 'Pertanyaan ini ditujukan ke pihak lain'
      using errcode = 'check_violation';
  end if;
  if p_answer is null or btrim(p_answer) = '' then
    raise exception 'Jawaban wajib diisi' using errcode = 'check_violation';
  end if;

  update public.dispute_infos
     set answer      = btrim(p_answer),
         answered_by = p_answered_by,
         answered_at = now()
   where id = p_info_id
  returning * into v_info;

  select * into v_dispute from public.disputes where id = v_info.dispute_id for update;

  select count(*) into v_open
    from public.dispute_infos
   where dispute_id = v_info.dispute_id and answer is null;

  -- The clock that paused when the question was asked resumes only when nothing
  -- is outstanding, by adding the paused duration back onto the deadline.
  if v_open = 0 and v_dispute.status = 'NEED_INFO' then
    update public.disputes
       set status    = 'OPEN',
           due_at    = due_at + (now() - coalesce(paused_at, now())),
           paused_at = null
     where id = v_info.dispute_id;
  end if;

  return v_info;
end;
$$;
