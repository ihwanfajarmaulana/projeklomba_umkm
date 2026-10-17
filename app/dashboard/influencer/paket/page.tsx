import type { Metadata } from "next";
import { getAllPackagesByInfluencer } from "@/lib/data/catalog";
import { requireInfluencer } from "@/lib/auth";
import { InfluencerShell } from "@/components/InfluencerShell";
import { PaketClient } from "./paket-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paket & Harga",
  description: "Kelola paket, harga, dan kuota revisi kreator di Kolab.id.",
};

/**
 * The creator's package manager.
 *
 * Reads every package including deactivated ones: this is the one screen whose
 * job is to show them and offer reactivation, so it passes the unfiltered embed
 * while public pages filter on `isActive` themselves.
 */
export default async function InfluencerPaketPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await requireInfluencer();
  const searchParams = await props.searchParams;

  const packages = await getAllPackagesByInfluencer(account.influencerId);

  // `setPackageActive` reports through a redirect, so its failures arrive as a
  // query parameter. `saveInfluencerPackage` returns its errors inline instead.
  const gagal = typeof searchParams.gagal === "string" ? searchParams.gagal : "";
  const errorMessage =
    gagal === "terakhir"
      ? "Itu paket aktif terakhirmu. Tambahkan atau aktifkan paket lain dulu."
      : gagal === "akses"
        ? "Paket itu bukan milikmu."
        : gagal
          ? "Gagal memperbarui paket. Coba lagi."
          : null;

  return (
    <InfluencerShell>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-700">
          Paket & Harga
        </p>
        <h1 className="mt-1 type-page-title font-head text-neutral-900">
          Paket & Harga
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Harga yang transparan adalah inti Kolab.id — ini yang dilihat UMKM
          saat memilih kamu.
        </p>
      </div>

      {errorMessage && (
        <p className="mt-6 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-8">
        <PaketClient packages={packages} />
      </div>
    </InfluencerShell>
  );
}