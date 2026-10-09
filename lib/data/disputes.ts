import { createClient } from "@/utils/supabase/server";
import {
  getBookingDetail,
  getDeliveries,
  getPaymentForBooking,
  getRevisionRequests,
} from "@/lib/data/bookings";
import { getChatMessagesForBookings } from "@/lib/data/chat";
import { formatRupiah } from "@/lib/format";
import type {
  BookingDetail,
  Delivery,
  PartyRole,
  Payment,
  RevisionRequest,
  UmkmNotification,
} from "@/lib/types";

/**
 * Dispute reads, on Postgres.
 *
 * Two audiences share this file:
 *
 *   - the operator dashboard, which reads through the admin's own session and is
 *     admitted by the `*_admin_dispute_read` policies added in
 *     `20261009120000_admin_disputes.sql`: every dispute, and a booking (with its
 *     children) only while a dispute hangs off it;
 *   - a party to the booking, which reads its own dispute through
 *     `disputes_party_read` / `dispute_infos_party_read`.
 *
 * Neither branch resolves the caller itself. The policy decides, so a caller who
 * is not an operator or a party gets an empty `200`, never a `403` - an RLS-hidden
 * row is indistinguishable from a missing one, which is the point.
 */

export type DisputeStatus = "OPEN" | "NEED_INFO" | "RESOLVED";
export type DisputeDecision = "RELEASE_FULL" | "REFUND_FULL" | "SPLIT";

/** The keys `ADMIN_CASE_FILTER_TABS` uses. */
export type AdminCaseFilter =
  | "semua"
  | "dibuka"
  | "menunggu-info"
  | "terlambat"
  | "diputuskan";

/** One row of the operator queue, flattened for the table and the KPIs. */
export type AdminCase = {
  id: number;
  code: string;
  status: DisputeStatus;
  decision: DisputeDecision | null;
  creatorSharePercent: number | null;
  decisionNote: string | null;
  decidedAt: string | null;
  dueAt: string;
  pausedAt: string | null;
  /** The decision clock ran out while the case is still open. */
  overdue: boolean;
  openedBy: PartyRole;
  reason: string;
  createdAt: string;
  bookingId: number;
  bookingCode: string;
  amount: number;
  packageName: string;
  umkmId: number;
  influencerId: number;
  umkmName: string;
  creatorName: string;
};

export type AdminCaseInfo = {
  id: number;
  targetRole: PartyRole;
  question: string;
  answer: string | null;
  askedAt: string;
  answeredAt: string | null;
};

export type AdminCaseMessage = {
  id: number;
  /** Resolved from the booking's own transition actors, never guessed. */
  from: PartyRole | "system";
  body: string;
  sentAt: string;
};

/** Everything the case page renders. */
export type AdminCaseDetail = AdminCase & {
  detail: BookingDetail;
  payment: Payment | null;
  deliveries: Delivery[];
  revisions: RevisionRequest[];
  infos: AdminCaseInfo[];
  messages: AdminCaseMessage[];
};

/* ------------------------------------------------------------------ */
/* Row types                                                            */
/* ------------------------------------------------------------------ */

type One<T> = T | T[] | null;

function one<T>(value: One<T>): T | null {
  if (value === null || value === undefined) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type BookingEmbed = {
  id: number;
  code: string;
  amount: number;
  package_name: string;
  umkm_id: number;
  influencer_id: number;
  umkms: { name: string } | { name: string }[] | null;
  influencers: { name: string } | { name: string }[] | null;
};

type DisputeRow = {
  id: number;
  code: string;
  status: DisputeStatus;
  decision: DisputeDecision | null;
  creator_share_percent: number | null;
  decision_note: string | null;
  decided_at: string | null;
  due_at: string;
  paused_at: string | null;
  opened_by: PartyRole;
  reason: string;
  created_at: string;
  bookings: One<BookingEmbed>;
};

const DISPUTE_SELECT =
  "id, code, status, decision, creator_share_percent, decision_note, decided_at, due_at, paused_at, opened_by, reason, created_at, bookings(id, code, amount, package_name, umkm_id, influencer_id, umkms(name), influencers(name))";

function mapAdminCase(row: DisputeRow): AdminCase | null {
  const booking = one(row.bookings);
  if (!booking) return null;

  const umkm = one(booking.umkms);
  const creator = one(booking.influencers);

  return {
    id: row.id,
    code: row.code,
    status: row.status,
    decision: row.decision,
    creatorSharePercent: row.creator_share_percent,
    decisionNote: row.decision_note,
    decidedAt: row.decided_at,
    dueAt: row.due_at,
    pausedAt: row.paused_at,
    // The clock stops while a question is outstanding, so only an OPEN case can
    // be late. A NEED_INFO case is on hold by design, not overdue.
    overdue: row.status === "OPEN" && new Date(row.due_at).getTime() < Date.now(),
    openedBy: row.opened_by,
    reason: row.reason,
    createdAt: row.created_at,
    bookingId: booking.id,
    bookingCode: booking.code,
    amount: booking.amount,
    packageName: booking.package_name,
    umkmId: booking.umkm_id,
    influencerId: booking.influencer_id,
    umkmName: umkm?.name ?? "UMKM",
    creatorName: creator?.name ?? "Kreator",
  };
}

/* ------------------------------------------------------------------ */
/* Operator reads                                                       */
/* ------------------------------------------------------------------ */

/** Every dispute, soonest deadline first. */
export async function getAdminCases(): Promise<AdminCase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select(DISPUTE_SELECT)
    .order("due_at", { ascending: true });

  if (error) {
    console.error(`[disputes] getAdminCases failed: ${error.message}`);
    return [];
  }

  return ((data as unknown as DisputeRow[] | null) ?? [])
    .map(mapAdminCase)
    .filter((c): c is AdminCase => c !== null);
}

/** Apply the queue's tab filter in memory; the queue is small by design. */
export function filterAdminCases(
  cases: AdminCase[],
  filter: AdminCaseFilter,
): AdminCase[] {
  switch (filter) {
    case "dibuka":
      return cases.filter((c) => c.status !== "RESOLVED");
    case "menunggu-info":
      return cases.filter((c) => c.status === "NEED_INFO");
    case "terlambat":
      return cases.filter((c) => c.overdue && c.status !== "RESOLVED");
    case "diputuskan":
      return cases.filter((c) => c.status === "RESOLVED");
    default:
      return cases;
  }
}

export type AdminKpis = {
  terbuka: number;
  menungguInfo: number;
  melewatiBatas: number;
  danaDitahan: number;
};

export function adminKpis(cases: AdminCase[]): AdminKpis {
  const open = cases.filter((c) => c.status !== "RESOLVED");
  return {
    terbuka: open.length,
    menungguInfo: cases.filter((c) => c.status === "NEED_INFO").length,
    melewatiBatas: open.filter((c) => c.overdue).length,
    danaDitahan: open.reduce((sum, c) => sum + c.amount, 0),
  };
}

export async function getAdminCase(id: number): Promise<AdminCase | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select(DISPUTE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`[disputes] getAdminCase failed: ${error.message}`);
    return null;
  }
  return data ? mapAdminCase(data as unknown as DisputeRow) : null;
}

async function getDisputeInfos(disputeId: number): Promise<AdminCaseInfo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("dispute_infos")
    .select("id, target_role, question, answer, created_at, answered_at")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`[disputes] getDisputeInfos failed: ${error.message}`);
    return [];
  }

  return ((data as {
    id: number;
    target_role: PartyRole;
    question: string;
    answer: string | null;
    created_at: string;
    answered_at: string | null;
  }[] | null) ?? []).map((row) => ({
    id: row.id,
    targetRole: row.target_role,
    question: row.question,
    answer: row.answer,
    askedAt: row.created_at,
    answeredAt: row.answered_at,
  }));
}

/** One case in full, or null when the caller is not the operator (or it is gone). */
export async function getAdminCaseById(
  id: number,
): Promise<AdminCaseDetail | null> {
  const base = await getAdminCase(id);
  if (!base) return null;

  const [detail, payment, deliveries, revisions, infos] = await Promise.all([
    getBookingDetail(base.bookingId),
    getPaymentForBooking(base.bookingId),
    getDeliveries(base.bookingId),
    getRevisionRequests(base.bookingId),
    getDisputeInfos(id),
  ]);

  // `detail` needs the party-or-admin read on the booking. For an operator the
  // dispute read already admitted the row, so a null here means the two policies
  // disagree and the case is not renderable.
  if (!detail) return null;

  const rawMessages = await getChatMessagesForBookings([base.bookingId]);

  // Label a message by which party sent it. The message row carries only an auth
  // user id, and an operator cannot read other profiles; the booking's own
  // transition events name its two actors, which is exactly the mapping needed.
  const roleById = new Map<string, PartyRole>();
  for (const event of detail.events) {
    if (
      event.actorId &&
      (event.actorRole === "umkm" || event.actorRole === "influencer")
    ) {
      roleById.set(event.actorId, event.actorRole);
    }
  }

  const messages: AdminCaseMessage[] = rawMessages.map((m) => ({
    id: m.id,
    from: roleById.get(m.senderId) ?? "system",
    body: m.body,
    sentAt: m.sentAt,
  }));

  return { ...base, detail, payment, deliveries, revisions, infos, messages };
}

/**
 * The operator's notification strip and the badge count.
 *
 * Derived from the disputes themselves rather than from `notifications`, which
 * exists but is still unwritten (the deferred capability). Every item is a real
 * case the operator can open.
 */
export async function getAdminAttention(): Promise<{
  items: UmkmNotification[];
  attentionCount: number;
  openCasesCount: number;
}> {
  const cases = await getAdminCases();
  const items: UmkmNotification[] = [];
  let attentionCount = 0;

  for (const c of cases) {
    if (c.status === "RESOLVED") continue;

    const desc = `${c.bookingCode} · ${formatRupiah(c.amount)}`;
    const href = `/admin/kasus/${c.id}`;

    if (c.status === "NEED_INFO") {
      attentionCount += 1;
      items.push({
        key: `need-${c.id}`,
        kind: "pending",
        title: `Menunggu jawaban: ${c.bookingCode}`,
        desc,
        href,
      });
    } else if (c.overdue) {
      attentionCount += 1;
      items.push({
        key: `late-${c.id}`,
        kind: "rejected",
        title: `Melewati batas: ${c.bookingCode}`,
        desc,
        href,
      });
    } else {
      items.push({
        key: `open-${c.id}`,
        kind: "accepted",
        title: `Kasus dibuka: ${c.bookingCode}`,
        desc,
        href,
      });
    }
  }

  return {
    items: items.slice(0, 5),
    attentionCount,
    openCasesCount: cases.filter((c) => c.status !== "RESOLVED").length,
  };
}

/* ------------------------------------------------------------------ */
/* Party read                                                           */
/* ------------------------------------------------------------------ */

export type BookingDisputeInfo = {
  id: number;
  targetRole: PartyRole;
  question: string;
  answer: string | null;
  askedAt: string;
  answeredAt: string | null;
};

export type BookingDispute = {
  id: number;
  code: string;
  status: DisputeStatus;
  reason: string;
  openedBy: PartyRole;
  dueAt: string;
  pausedAt: string | null;
  decision: DisputeDecision | null;
  creatorSharePercent: number | null;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  infos: BookingDisputeInfo[];
};

/**
 * The booking's dispute, as its two parties see it, or null when there is none
 * or the caller is not a party. `disputes_party_read` decides.
 */
export async function getDisputeForBooking(
  bookingId: number,
): Promise<BookingDispute | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select(
      "id, code, status, reason, opened_by, due_at, paused_at, decision, creator_share_percent, decision_note, decided_at, created_at",
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) {
    console.error(`[disputes] getDisputeForBooking failed: ${error.message}`);
    return null;
  }
  if (!data) return null;

  const infos = await getDisputeInfos(data.id);

  return {
    id: data.id,
    code: data.code,
    status: data.status,
    reason: data.reason,
    openedBy: data.opened_by,
    dueAt: data.due_at,
    pausedAt: data.paused_at,
    decision: data.decision,
    creatorSharePercent: data.creator_share_percent,
    decisionNote: data.decision_note,
    decidedAt: data.decided_at,
    createdAt: data.created_at,
    infos,
  };
}
