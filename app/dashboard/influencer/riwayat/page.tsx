import { getBookingsByInfluencer, getReviewForBookingRole } from "@/lib/data/bookings";
import type { Metadata } from "next";
import { requireInfluencer } from "@/lib/auth";

import { InfluencerShell } from "@/components/InfluencerShell";
import { RiwayatClient } from "./riwayat-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Kolaborasi",
  description: "Semua kolaborasi dan permintaan masuk kreator di Kolab.id.",
};

export default async function InfluencerRiwayatPage(
  props: PageProps<"/dashboard/influencer/riwayat">,
) {
  const account = await requireInfluencer();

  const searchParams = await props.searchParams;
  // Default `menunggu` agar permintaan baru tidak pernah terlewat (§4.6)
  const filter =
    typeof searchParams.filter === "string" ? searchParams.filter : "menunggu";

  const bookings = await getBookingsByInfluencer(account.influencerId);

  // Ulasan yang sudah diberikan kreator ini (untuk kolom aksi)
  const reviewRatings: Record<number, number> = {};
  for (const b of bookings) {
    if (b.status === "COMPLETED") {
      const review = await getReviewForBookingRole(b.id, "influencer");
      if (review) reviewRatings[b.id] = review.rating;
    }
  }

  return (
    <InfluencerShell>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-700">
          Riwayat Kolaborasi
        </p>
        <h1 className="mt-1 type-page-title font-head text-neutral-900">
          Riwayat Kolaborasi
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Konfirmasi permintaan baru dan pantau semua kolaborasi.
        </p>
      </div>

      <div className="mt-6">
        <RiwayatClient
          bookings={bookings}
          reviewRatings={reviewRatings}
          initialFilter={filter}
        />
      </div>
    </InfluencerShell>
  );
}