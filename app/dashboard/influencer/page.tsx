import { getInfluencerById } from "@/lib/data/catalog";
import { getBookingsByInfluencer, getReviewForBookingRole } from "@/lib/data/bookings";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Handshake,
  MessageCircle,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { requireInfluencer } from "@/lib/auth";

import { formatDate, formatRupiah } from "@/lib/format";
import { acceptBooking, declineBooking } from "@/app/actions";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { InfluencerShell } from "@/components/InfluencerShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Kreator",
  description: "Kelola permintaan kolaborasi dari UMKM di Kolab.id.",
};

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  FUNDED: 2,
  SUBMITTED: 3,
  REVISION: 4,
  COMPLETED: 5,
  REJECTED: 6,
  CANCELLED: 7,
};

export default async function InfluencerDashboardPage(
  props: PageProps<"/dashboard/influencer">,
) {
  const account = await requireInfluencer();

  const profile = await getInfluencerById(account.influencerId);
  if (!profile) redirect("/");

  const bookings = await getBookingsByInfluencer(account.influencerId);

  const searchParams = await props.searchParams;
  const reviewSent = searchParams.review === "1";

  // Ulasan yang sudah kreator ini berikan (untuk booking selesai)
  const myReviews = new Map<number, number>();
  for (const b of bookings) {
    if (b.status === "COMPLETED") {
      const review = await getReviewForBookingRole(b.id, "influencer");
      if (review) myReviews.set(b.id, review.rating);
    }
  }

  // KPI kreator per ARCHITECTURE §4.4 (5 kartu)
  const permintaanMasuk = bookings.filter((b) => b.status === "PENDING").length;
  const berjalan = bookings.filter((b) =>
    ["ACCEPTED", "FUNDED", "SUBMITTED", "REVISION"].includes(b.status),
  ).length;
  const selesai = bookings.filter((b) => b.status === "COMPLETED").length;
  // Held and earned amounts are derived from the payment records, not from the
  // status: a cancelled booking keeps its held payment, and that money is still
  // held rather than gone (escrow-payments). A RELEASED payment earns its full
  // total; a SPLIT payment only the negotiated creator share; a REFUNDED or
  // UNPAID payment earns nothing.
  const danaDitahan = bookings
    .filter((b) => b.paymentStatus === "HELD")
    .reduce((sum, b) => sum + b.amount, 0);
  const pemasukan = bookings.reduce((sum, b) => {
    if (b.paymentStatus === "RELEASED") return sum + b.amount;
    if (b.paymentStatus === "SPLIT") return sum + b.paymentCreatorAmount;
    return sum;
  }, 0);

  // Ringkasan riwayat: butuh aksi (Menunggu) paling atas, lalu sisanya
  const summary = [...bookings].sort(
    (a, b) =>
      (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9),
  );

  return (
    <InfluencerShell>
      {/* Header */}
      <div>
        <p className="type-table-head uppercase text-primary-700">
          Dashboard Kreator
        </p>
        <h1 className="mt-1 font-head type-page-title text-neutral-900">
          Halo, {profile.name}! 🎬
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Konfirmasi permintaan dari UMKM sebelum batas jadwal tayang.
        </p>
      </div>

      {/* Profil singkat */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-4 shadow-xs sm:p-5">
        <Avatar name={profile.name} category={profile.categorySlug} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 type-card-title text-neutral-900">
            {profile.name}
            {profile.verified && (
              <BadgeCheck className="h-4 w-4 text-primary-600" />
            )}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {profile.handle} · {profile.category} · {profile.city}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
            {profile.rating.toFixed(1)} ({profile.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <Store className="h-3.5 w-3.5 text-primary-600" /> mulai{" "}
            {formatRupiah(profile.startingPrice)}/video
          </span>
        </div>
        <Link
          href={`/influencers/${profile.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700"
        >
          Lihat Profil Publik <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Banner sukses mengirim rating */}
      {reviewSent && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700">
          <Star className="mt-0.5 h-5 w-5 shrink-0 fill-warning-400 text-warning-400" />
          <div>
            <p className="font-bold">Ulasan terkirim!</p>
            <p className="mt-0.5">
              Terima kasih sudah berbagi pengalamanmu. Rating-mu membantu
              kreator lain memilih UMKM yang tepat.
            </p>
          </div>
        </div>
      )}

      {/* Statistik kreator (ARCHITECTURE §4.4 — 5 KPI) */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          icon={Clock}
          label="Permintaan Masuk"
          value={String(permintaanMasuk)}
          hint="menunggu konfirmasi kamu"
          accent="warning"
          href="/dashboard/influencer/riwayat?filter=menunggu"
          hrefLabel="Lihat antrian"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Sedang Berjalan"
          value={String(berjalan)}
          hint="konten sedang diproduksi"
          accent="primary"
          href="/dashboard/influencer/riwayat?filter=berjalan"
          hrefLabel="Lihat"
        />
        <KpiCard
          icon={Handshake}
          label="Selesai"
          value={String(selesai)}
          hint="konten sudah tayang"
          accent="success"
          href="/dashboard/influencer/riwayat?filter=selesai"
          hrefLabel="Lihat"
        />
        <KpiCard
          icon={Wallet}
          label="Dana Ditahan"
          value={formatRupiah(danaDitahan)}
          hint="dipegang Kolab.id (eskrow)"
          accent="info"
        />
        <KpiCard
          icon={Wallet}
          label="Total Pemasukan"
          value={formatRupiah(pemasukan)}
          hint="dana sudah dicairkan"
          accent="success"
        />
      </div>

      {/* Permintaan kolaborasi (ringkasan) */}
      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 type-table-head uppercase text-primary-700">
              <Handshake className="h-4 w-4" /> Riwayat Kolaborasi
            </p>
            <h2 className="mt-1 font-head type-section-title text-neutral-900">
              Aktivitas terbaru
            </h2>
            <p className="mt-1 type-table text-neutral-500">
              {bookings.length} kolaborasi tercatat. Yang butuh aksimu
              ditampilkan paling atas.
            </p>
          </div>
          {bookings.length > 4 && (
            <Link
              href="/dashboard/influencer/riwayat"
              className="inline-flex items-center gap-1 type-label text-primary-700 hover:text-primary-800"
            >
              Lihat Semua <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-0 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
              <Handshake className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-head type-section-title text-neutral-900">
              Belum ada permintaan
            </h3>
            <p className="mt-1 max-w-sm type-table text-neutral-500">
              Masih sepi? Pastikan profil publikmu lengkap biar UMKM mudah
              menemukanmu.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {summary.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5 shadow-xs"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <Avatar
                      name={b.umkmName}
                      category={b.umkmCategorySlug}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate type-card-title text-neutral-900">
                        {b.umkmName}
                      </p>
                      <p className="truncate type-caption text-neutral-500">
                        {b.umkmOwner} · {b.umkmCategory} · {b.umkmCity}
                      </p>
                      <p className="mt-2 rounded-xl bg-neutral-50 px-3 py-2 type-caption leading-relaxed text-neutral-600">
                        <span className="font-semibold text-neutral-700">
                          Brief:
                        </span>{" "}
                        {b.brief || "—"}
                      </p>
                      <p className="mt-2 type-caption text-neutral-400">
                        Paket{" "}
                        <strong className="text-neutral-600">
                          {b.packageName}
                        </strong>{" "}
                        · {b.code} · {formatDate(b.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p className="font-head type-section-title text-neutral-900">
                        {formatRupiah(b.amount)}
                      </p>
                      <StatusBadge status={b.status} />
                    </div>

                    {b.status === "PENDING" && (
                      <>
                        <div className="flex gap-2">
                          <form action={declineBooking}>
                            <input
                              type="hidden"
                              name="bookingId"
                              value={b.id}
                            />
                            <input
                              type="hidden"
                              name="next"
                              value="/dashboard/influencer"
                            />
                            <button
                              type="submit"
                              className="rounded-xl border border-error-200 bg-error-50 px-4 py-2 text-xs font-bold text-error-700 transition-colors hover:bg-error-100"
                            >
                              Tolak
                            </button>
                          </form>
                          <form action={acceptBooking}>
                            <input
                              type="hidden"
                              name="bookingId"
                              value={b.id}
                            />
                            <input
                              type="hidden"
                              name="next"
                              value="/dashboard/influencer"
                            />
                            <Button type="submit" size="sm">
                              Setujui
                            </Button>
                          </form>
                        </div>
                        <Link
                          href="/dashboard/influencer/chat"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-primary-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Buka Chat
                        </Link>
                      </>
                    )}

                    {(b.status === "FUNDED" ||
                      b.status === "SUBMITTED" ||
                      b.status === "REVISION") && (
                      <>
                        <p className="text-xs text-neutral-400">
                          Kolaborasi sedang berjalan.
                        </p>
                        <Link
                          href="/dashboard/influencer/chat"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-primary-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Buka Chat
                        </Link>
                      </>
                    )}

                    {b.status === "COMPLETED" && (
                      <>
                        {myReviews.get(b.id) ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 type-badge text-primary-700 ring-1 ring-inset ring-primary-200">
                            <StarRating
                              rating={myReviews.get(b.id)!}
                              size="h-3 w-3"
                            />{" "}
                            Ulasanmu terkirim
                          </span>
                        ) : (
                          <Button size="sm" href={`/review/${b.id}`}>
                            <Star className="h-3.5 w-3.5" /> Nilai UMKM Ini
                          </Button>
                        )}
                        <Link
                          href="/dashboard/influencer/chat"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-primary-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Buka Chat
                        </Link>
                      </>
                    )}

                    {b.status === "REJECTED" && (
                      <p className="type-caption text-neutral-400">
                        Ditolak — tidak ada biaya dipotong.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </InfluencerShell>
  );
}