import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  FileText,
  HandCoins,
  HelpCircle,
  MessageSquare,
  Package,
  Scale,
  Timer,
  User,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { BookingFlash } from "@/components/booking";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import { getAdminCaseById, type AdminCase } from "@/lib/data/disputes";
import { DecisionPanel } from "./decision-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Kasus",
  description:
    "Detail kasus sengketa Kolab.id — bukti, riwayat, dan panel keputusan admin.",
};

const DECISION_LABEL: Record<string, string> = {
  RELEASE_FULL: "Cairkan Penuh",
  REFUND_FULL: "Refund Penuh",
  SPLIT: "Bagi Dana",
};

const OFFER_LABEL: Record<string, string> = {
  EXTRA_REVISION: "Revisi tambahan gratis",
  DISCOUNT: "Potongan harga",
  CANCELLATION: "Pembatalan dengan refund",
};

const ACTOR_LABEL: Record<string, string> = {
  umkm: "UMKM",
  influencer: "Kreator",
  admin: "Admin",
  system: "Sistem",
};

const PARTY_LABEL: Record<string, string> = {
  umkm: "UMKM",
  influencer: "Kreator",
};

function ResolvedCard({ kasus }: { kasus: AdminCase }) {
  const creatorShare =
    kasus.decision === "SPLIT"
      ? Math.round(kasus.amount * ((kasus.creatorSharePercent ?? 50) / 100))
      : kasus.amount;
  const umkmShare = kasus.amount - creatorShare;

  const effect = (() => {
    switch (kasus.decision) {
      case "RELEASE_FULL":
        return `${formatRupiah(kasus.amount)} dicairkan penuh ke kreator; booking menjadi Selesai.`;
      case "REFUND_FULL":
        return `${formatRupiah(kasus.amount)} dikembalikan penuh ke UMKM; booking menjadi Dibatalkan.`;
      case "SPLIT":
        return `${formatRupiah(creatorShare)} (${kasus.creatorSharePercent}%) ke kreator, ${formatRupiah(umkmShare)} (${100 - (kasus.creatorSharePercent ?? 50)}%) ke UMKM; booking menjadi Selesai.`;
      default:
        return "";
    }
  })();

  return (
    <div className="rounded-3xl border border-success-200 bg-success-50/60 p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success-100 text-success-600">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="font-head text-base font-bold tracking-[-0.02em] text-success-900">
            Kasus diputuskan —{" "}
            {kasus.decision && DECISION_LABEL[kasus.decision]}
          </p>
          <p className="mt-1 text-sm leading-6 text-success-700">{effect}</p>
          <div className="mt-4 rounded-2xl bg-neutral-0 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Alasan Keputusan
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              “{kasus.decisionNote}”
            </p>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Keputusan tidak bisa diubah. Kedua pihak dapat memberi ulasan.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminKasusDetailPage(
  props: PageProps<"/admin/kasus/[id]">,
) {
  const { id } = await props.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) redirect("/admin/kasus");

  const kasus = await getAdminCaseById(numericId);
  if (!kasus) redirect("/admin/kasus");

  const undecided = kasus.status !== "RESOLVED";
  const searchParams = await props.searchParams;
  const ok = typeof searchParams.ok === "string" ? searchParams.ok : undefined;
  const gagal =
    typeof searchParams.gagal === "string" ? searchParams.gagal : undefined;

  return (
    <AdminShell>
      <nav className="text-sm text-neutral-500">
        <Link href="/admin/kasus" className="hover:text-primary-700">
          Antrian Kasus
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-neutral-700">
          {kasus.bookingCode}
        </span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h2 className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Kasus {kasus.bookingCode}
        </h2>
        <StatusBadge status={kasus.status} />
        {kasus.overdue && undecided && (
          <span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-error-700">
            Terlambat
          </span>
        )}
      </div>

      <div className="mt-5">
        <BookingFlash ok={ok} gagal={gagal} />
      </div>

      {/* Ringkasan */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <ClipboardList className="h-4.5 w-4.5 text-primary-600" /> Ringkasan
        </h3>
        <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              UMKM
            </dt>
            <dd className="mt-1 font-semibold text-neutral-900">
              {kasus.umkmName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Kreator
            </dt>
            <dd className="mt-1 font-semibold text-neutral-900">
              {kasus.creatorName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Paket
            </dt>
            <dd className="mt-1 text-neutral-700">{kasus.packageName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Nominal
            </dt>
            <dd className="mt-1 font-semibold text-neutral-900">
              {formatRupiah(kasus.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Kuota revisi
            </dt>
            <dd className="mt-1 text-neutral-700">
              {kasus.detail.revisionsUsed} dari {kasus.detail.revisionQuota}{" "}
              terpakai
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Dibuka oleh
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-neutral-700">
              <User className="h-3.5 w-3.5" /> {PARTY_LABEL[kasus.openedBy]}
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Alasan pengajuan
            </dt>
            <dd className="mt-1 rounded-2xl bg-neutral-50 p-4 text-neutral-700">
              {kasus.reason}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Dibuka pada
            </dt>
            <dd className="mt-1 text-neutral-700">
              {formatDate(kasus.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Batas keputusan
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-neutral-700">
              <Timer className="h-3.5 w-3.5" /> {formatDate(kasus.dueAt)}
              {kasus.status === "NEED_INFO" && (
                <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-700">
                  Jam berhenti
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Dana ditahan
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-neutral-700">
              <Banknote className="h-3.5 w-3.5 text-primary-600" />
              {kasus.payment
                ? `${formatRupiah(kasus.payment.totalAmount)} · ${kasus.payment.status}`
                : "Belum ada pembayaran"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Brief Terkunci */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <FileText className="h-4.5 w-4.5 text-primary-600" /> Brief Terkunci
        </h3>
        <blockquote className="mt-4 rounded-2xl border-l-4 border-primary-300 bg-neutral-50 p-4 text-sm italic text-neutral-700">
          “{kasus.detail.brief}”
        </blockquote>
      </section>

      {/* Tanya jawab admin */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <HelpCircle className="h-4.5 w-4.5 text-primary-600" /> Tanya Jawab
          Admin
        </h3>
        {kasus.infos.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada pertanyaan yang diajukan ke kedua pihak.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.infos.map((info) => (
              <li
                key={info.id}
                className="rounded-2xl border border-neutral-100 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Ke {PARTY_LABEL[info.targetRole]} ·{" "}
                  {formatDateTime(info.askedAt)}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {info.question}
                </p>
                {info.answer ? (
                  <p className="mt-2 border-l-2 border-neutral-200 pl-3 text-sm text-neutral-700">
                    {info.answer}
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-neutral-400">
                    Menunggu jawaban.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Konten Terkirim */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <Package className="h-4.5 w-4.5 text-primary-600" /> Konten Terkirim
        </h3>
        {kasus.deliveries.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada konten yang dikirim.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.deliveries.map((v) => (
              <li
                key={v.id}
                className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900">
                    Ronde {v.round}{" "}
                    <span className="font-medium text-neutral-400">
                      · {formatDate(v.submittedAt)}
                    </span>
                  </p>
                  <a
                    href={v.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-sm font-semibold text-primary-700 hover:text-primary-800"
                  >
                    {v.contentUrl}
                  </a>
                  {v.note && (
                    <p className="mt-0.5 text-sm text-neutral-600">{v.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Riwayat Revisi */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <HandCoins className="h-4.5 w-4.5 text-primary-600" /> Riwayat Revisi
        </h3>
        {kasus.revisions.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Tidak ada permintaan revisi pada kolaborasi ini.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.revisions.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-neutral-100 p-4"
              >
                <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-700">
                    {r.section}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                    {r.withinBrief ? "Dalam brief" : "Di luar brief"}
                  </span>
                  {formatDateTime(r.createdAt)}
                </p>
                <p className="mt-1.5 text-sm text-neutral-700">{r.note}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tawaran Penyelesaian */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <Scale className="h-4.5 w-4.5 text-primary-600" /> Tawaran Penyelesaian
        </h3>
        {kasus.detail.offers.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada tawaran penyelesaian dari kedua pihak.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.detail.offers.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-100 p-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-neutral-900">
                    {OFFER_LABEL[t.type] ?? t.type}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    Ditawarkan oleh {PARTY_LABEL[t.offeredBy]} · nilai{" "}
                    {formatRupiah(t.value)}
                  </span>
                </span>
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Riwayat Chat */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <MessageSquare className="h-4.5 w-4.5 text-primary-600" /> Riwayat Chat
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Read-only — admin hanya bisa membaca chat pada booking yang sedang
          disengketakan.
        </p>
        {kasus.messages.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada pesan pada kolaborasi ini.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.messages.map((m) => {
              const label = m.from === "system" ? "Sistem" : PARTY_LABEL[m.from];
              return (
                <li key={m.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold text-neutral-0 ${
                      m.from === "umkm"
                        ? "bg-primary-600"
                        : m.from === "influencer"
                          ? "bg-success-600"
                          : "bg-neutral-800"
                    }`}
                  >
                    {label.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl bg-neutral-50 px-4 py-2.5">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span className="font-bold text-neutral-800">{label}</span>
                      {formatDateTime(m.sentAt)}
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">{m.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Timeline */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <Timer className="h-4.5 w-4.5 text-primary-600" /> Timeline
        </h3>
        <ol className="mt-3">
          {kasus.detail.events.map((t, i) => {
            const isLast = i === kasus.detail.events.length - 1;
            return (
              <li key={t.id} className="flex items-start gap-4 pb-5 last:pb-0">
                <span
                  aria-hidden
                  className="flex w-4 shrink-0 flex-col items-center self-stretch"
                >
                  <span className="mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary-500 bg-neutral-0" />
                  {!isLast && (
                    <span className="mt-1 w-px flex-1 bg-neutral-200" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-400">
                    {formatDateTime(t.createdAt)} ·{" "}
                    {ACTOR_LABEL[t.actorRole] ?? t.actorRole}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-800">
                    {t.fromStatus ? `${t.fromStatus} → ${t.toStatus}` : t.toStatus}
                    {t.note ? ` — ${t.note}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Panel keputusan / hasil keputusan */}
      <section className="mt-8">
        {undecided ? (
          <DecisionPanel
            disputeId={kasus.id}
            nominal={kasus.amount}
            bookingKode={kasus.bookingCode}
          />
        ) : (
          <ResolvedCard kasus={kasus} />
        )}
      </section>
    </AdminShell>
  );
}
