import { getRecommendedInfluencers, getUmkmById } from "@/lib/data/catalog";
import { getBookingsByUmkm, getReviewForBookingRole } from "@/lib/data/bookings";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  PartyPopper,
  Sparkles,
  Star,
} from "lucide-react";
import { requireUmkm } from "@/lib/auth";

import { formatRupiah } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { BookingHistoryList } from "@/components/BookingHistoryList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard UMKM",
  description: "Pantau kolaborasi UMKM-mu di Kolab.id.",
};

export default async function UmkmDashboardPage(
  props: PageProps<"/dashboard">,
) {
  const account = await requireUmkm();

  const searchParams = await props.searchParams;
  const baru = searchParams.status === "baru";
  const reviewSent = searchParams.review === "1";
  const bookings = await getBookingsByUmkm(account.umkmId);

  const umkm = await getUmkmById(account.umkmId);
  const recommended = umkm ? await getRecommendedInfluencers(umkm, 3) : [];

  // Ulasan yang sudah diberikan UMKM ini untuk booking yang DONE
  // Ulasan yang sudah diberikan UMKM ini untuk booking yang selesai
  const myReviews = new Map<number, number>();
  for (const b of bookings) {
    if (b.status === "COMPLETED") {
      const review = await getReviewForBookingRole(b.id, "umkm");
      if (review) myReviews.set(b.id, review.rating);
    }
  }

  const total = bookings.length;
  const menunggu = bookings.filter((b) => b.status === "PENDING").length;
  const berjalan = bookings.filter((b) =>
    ["ACCEPTED", "FUNDED", "SUBMITTED", "REVISION"].includes(b.status),
  ).length;
  const selesai = bookings.filter((b) => b.status === "COMPLETED").length;

  return (
    <>
      {/* Header */}
      <div>
        <p className="type-table-head uppercase text-primary-700">
          Dashboard
        </p>
        <h1 className="mt-1 font-head type-page-title text-neutral-900">
          Halo, {account.fullName}!
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Ini ringkasan semua kolaborasi dengan kreator.
        </p>
      </div>

      {/* Banner sukses booking baru */}
      {baru && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-success-200 bg-success-50 p-4 text-sm text-success-700">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Pengajuan terkirim!</p>
            <p className="mt-0.5">
              Kreator akan mengonfirmasi lewat dashboard-nya. Statusnya bisa
              kamu pantau di bawah.
            </p>
          </div>
        </div>
      )}

      {/* Banner sukses mengirim rating */}
      {reviewSent && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700">
          <Star className="mt-0.5 h-5 w-5 shrink-0 fill-warning-500 text-warning-500" />
          <div>
            <p className="font-bold">Ulasan terkirim!</p>
            <p className="mt-0.5">
              Terima kasih sudah berbagi pengalamanmu. Rating-mu membantu UMKM
              lain memilih kreator yang tepat.
            </p>
          </div>
        </div>
      )}

      {/* KPI Card (ARCHITECTURE §3.4 — 4 kartu) */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FileText}
          label="Total Pengajuan"
          value={String(total)}
          hint="semua pengajuan kolaborasi"
          accent="primary"
          href="/dashboard/riwayat?filter=semua"
        />
        <KpiCard
          icon={Clock}
          label="Menunggu Respons"
          value={String(menunggu)}
          hint="menunggu konfirmasi kreator"
          accent="warning"
          href="/dashboard/riwayat?filter=menunggu"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Sedang Berjalan"
          value={String(berjalan)}
          hint="konten sedang diproduksi"
          accent="primary"
          href="/dashboard/riwayat?filter=berjalan"
        />
        <KpiCard
          icon={BadgeCheck}
          label="Selesai"
          value={String(selesai)}
          hint="kolaborasi selesai"
          accent="success"
          href="/dashboard/riwayat?filter=selesai"
        />
      </div>

      {/* Rekomendasi Creator */}
      {recommended.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 type-table-head uppercase text-primary-700">
                <Sparkles className="h-4 w-4" /> Rekomendasi untukmu
              </p>
              <h2 className="mt-1 font-head type-section-title text-neutral-900">
                Kreator yang cocok dengan {account.fullName}
              </h2>
              <p className="mt-1 type-table text-neutral-500">
                Dicocokkan otomatis dari kategori usaha, kota, dan budget-mu.
              </p>
            </div>
            <Link
              href="/influencers"
              className="inline-flex items-center gap-1 type-label text-primary-700 hover:text-primary-800"
            >
              Lihat semua kreator <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-0 p-5 shadow-xs transition-all duration-150 ease-standard hover:-translate-y-1 hover:border-primary-200 hover:shadow-sm"
              >
                <Link
                  href={`/influencers/${rec.id}`}
                  className="group flex items-center gap-3"
                >
                  <Avatar name={rec.name} category={rec.categorySlug} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate type-card-title text-neutral-900 group-hover:text-primary-700">
                      {rec.name}
                      {rec.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary-600" />
                      )}
                    </p>
                    <p className="truncate type-caption text-neutral-500">
                      {rec.handle} · {rec.category} · {rec.city}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 type-caption text-neutral-400">
                      <Star className="h-3 w-3 fill-warning-500 text-warning-500" />
                      {rec.rating.toFixed(1)} · {rec.reviewCount} ulasan
                    </p>
                  </div>
                </Link>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rec.matchReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 type-badge text-primary-700"
                    >
                      <Sparkles className="h-3 w-3" /> {reason}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                  <div>
                    <p className="type-caption text-neutral-500">Mulai dari</p>
                    <p className="font-head type-card-title text-primary-700">
                      {formatRupiah(rec.startingPrice)}{" "}
                      <span className="type-caption text-neutral-500">
                        / video
                      </span>
                    </p>
                  </div>
                  <Button size="sm" href={`/booking/${rec.id}`}>
                    Ajukan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Riwayat Kolaborasi */}
      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-head type-section-title text-neutral-900">
              Riwayat Kolaborasi
            </h2>
            <p className="mt-1 type-table text-neutral-500">
              {bookings.length} pengajuan tercatat. Klik kreator untuk melihat
              profil lengkap.
            </p>
          </div>
          {bookings.length > 3 && (
            <Link
              href="/dashboard/riwayat"
              className="inline-flex items-center gap-1 type-label text-primary-700 hover:text-primary-800"
            >
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <BookingHistoryList bookings={bookings.slice(0, 3)} reviews={myReviews} />
      </div>
    </>
  );
}