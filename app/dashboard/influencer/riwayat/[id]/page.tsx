import { getUmkmById } from "@/lib/data/catalog";
import { getBookingDetail, getReviewForBookingRole } from "@/lib/data/bookings";
import { getDisputeForBooking } from "@/lib/data/disputes";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { requireInfluencer } from "@/lib/auth";

import { InfluencerShell } from "@/components/InfluencerShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import {
  BookingDetailView,
  BookingFlash,
  CreatorActions,
  SectionCard,
  SengketaCard,
} from "@/components/booking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Kolaborasi",
  description: "Rincian dan aksi kolaborasi dari UMKM di Kolab.id.",
};

export default async function CreatorBookingDetailPage(
  props: PageProps<"/dashboard/influencer/riwayat/[id]">,
) {
  const account = await requireInfluencer();

  const params = await props.params;
  const id = Number(params.id);
  if (!Number.isFinite(id)) redirect("/dashboard/influencer/riwayat");

  const booking = await getBookingDetail(id);
  if (!booking || booking.influencerId !== account.influencerId) {
    redirect("/dashboard/influencer/riwayat");
  }

  const umkm = await getUmkmById(booking.umkmId);
  const reviewed = await getReviewForBookingRole(booking.id, "influencer");
  const dispute = await getDisputeForBooking(booking.id);
  const searchParams = await props.searchParams;
  const ok = typeof searchParams.ok === "string" ? searchParams.ok : undefined;
  const gagal =
    typeof searchParams.gagal === "string" ? searchParams.gagal : undefined;

  return (
    <InfluencerShell>
      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-700">
          <Link
            href="/dashboard/influencer/riwayat"
            className="hover:text-primary-800"
          >
            Riwayat
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-mono normal-case tracking-normal text-neutral-700">
            {booking.code}
          </span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
            Detail Kolaborasi
          </h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1.5 text-neutral-600">
          Brief, paket, progres, dan aksi untuk kolaborasi ini.
        </p>
      </div>

      <div className="mt-8">
        <BookingFlash ok={ok} gagal={gagal} />
      </div>

      <div className="mt-5">
        <BookingDetailView
          perspective="influencer"
          booking={booking}
          counterpart={
            umkm
              ? {
                  name: umkm.name,
                  categorySlug: umkm.categorySlug,
                  category: umkm.category,
                  city: umkm.city,
                }
              : null
          }
        >
          {dispute && (
            <SengketaCard
              dispute={dispute}
              perspective="influencer"
              bookingId={booking.id}
              next={`/dashboard/influencer/riwayat/${booking.id}`}
            />
          )}
          <SectionCard
            title="Aksi"
            action={<StatusBadge status={booking.status} />}
          >
            <div className="space-y-5">
              <CreatorActions booking={booking} />
              {(booking.status === "COMPLETED" ||
                dispute?.status === "RESOLVED") && (
                <Button
                  variant={reviewed ? "secondary" : "primary"}
                  href={`/review/${booking.id}`}
                >
                  <Star className="h-4 w-4" />
                  {reviewed ? "Lihat Ulasan" : "Beri Ulasan"}
                </Button>
              )}
              <Link
                href="/dashboard/influencer/riwayat"
                className="inline-block text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                ← Kembali ke Riwayat
              </Link>
            </div>
          </SectionCard>
        </BookingDetailView>
      </div>
    </InfluencerShell>
  );
}