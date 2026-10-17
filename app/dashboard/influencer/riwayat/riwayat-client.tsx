"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareText, SearchX, Star } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BOOKING_FILTER_TABS, FilterTabs } from "@/components/FilterTabs";
import { DataTable, type TableColumn } from "@/components/DataTable";
import { StatusBadge, type StatusKey } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { formatDate, formatRupiah } from "@/lib/format";
import { acceptBooking, declineBooking } from "@/app/actions";
import type { BookingWithUmkm } from "@/lib/types";

/**
 * Client wrapper riwayat kolaborasi kreator (ARCHITECTURE §4.6): tab filter
 * Semua/Menunggu/Berjalan/Sengketa/Selesai/Batal dengan default `menunggu`,
 * plus aksi inline Setujui/Tolak lewat acceptBooking/declineBooking dan tautan
 * Detail. Filter client-side;
 * data dikirim serializable dari server page.
 */
type BookingRow = BookingWithUmkm;

const FILTER_MAP: Record<string, StatusKey[]> = {
  semua: [],
  menunggu: ["PENDING"],
  berjalan: ["ACCEPTED", "FUNDED", "SUBMITTED", "REVISION"],
  sengketa: ["DISPUTED"],
  selesai: ["COMPLETED"],
  batal: ["REJECTED", "CANCELLED"],
};

const EMPTY_DESC: Record<string, string> = {
  menunggu: "Tidak ada permintaan baru yang menunggu konfirmasi.",
  berjalan: "Tidak ada kolaborasi yang sedang berjalan.",
  sengketa: "Tidak ada kolaborasi bersengketa.",
  selesai: "Belum ada kolaborasi yang selesai.",
  batal: "Tidak ada kolaborasi yang batal atau ditolak.",
  semua: "Belum ada kolaborasi sama sekali.",
};

export function RiwayatClient({
  bookings,
  reviewRatings,
  initialFilter = "menunggu",
}: {
  bookings: BookingRow[];
  /** rating ulasan kreator per bookingId (ada = sudah dinilai) */
  reviewRatings: Record<number, number>;
  initialFilter?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState(initialFilter);

  const selectFilter = (key: string) => {
    setFilter(key);
    router.replace(`/dashboard/influencer/riwayat?filter=${key}`, {
      scroll: false,
    });
  };

  const rows = useMemo(() => {
    const allowed = FILTER_MAP[filter] ?? [];
    if (filter === "semua") return bookings;
    return bookings.filter((b) => allowed.includes(b.status));
  }, [bookings, filter]);

  const columns: TableColumn<BookingRow>[] = [
    {
      key: "kode",
      header: "Kode",
      cell: (b) => (
        <span className="font-mono type-badge text-neutral-900">
          {b.code}
        </span>
      ),
    },
    {
      key: "umkm",
      header: "UMKM",
      cell: (b) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={b.umkmName} category={b.umkmCategorySlug} size="sm" />
          <div className="min-w-0">
            <p className="truncate type-card-title text-neutral-900">
              {b.umkmName}
            </p>
            <p className="truncate type-caption text-neutral-500">
              {b.umkmOwner} · {b.umkmCity}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "paket",
      header: "Paket",
      cell: (b) => (
        <span className="type-table text-neutral-900">{b.packageName}</span>
      ),
    },
    {
      key: "nominal",
      header: "Nominal",
      cell: (b) => (
        <span className="type-label font-head text-neutral-900">
          {formatRupiah(b.amount)}
        </span>
      ),
    },
    {
      key: "tanggal",
      header: "Tanggal",
      cell: (b) => (
        <span className="type-table text-neutral-500">{formatDate(b.createdAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "aksi",
      header: "Aksi",
      cellClassName: "text-right",
      cell: (b) => {
        return (
          <div className="flex items-center justify-end gap-2">
            {b.status === "PENDING" && (
              <>
                <form action={declineBooking}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input
                    type="hidden"
                    name="next"
                    value="/dashboard/influencer/riwayat?filter=menunggu"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-error-200 bg-error-50 px-3 py-1.5 type-badge text-error-700 transition-colors hover:bg-error-100"
                  >
                    Tolak
                  </button>
                </form>
                <form action={acceptBooking}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input
                    type="hidden"
                    name="next"
                    value="/dashboard/influencer/riwayat?filter=menunggu"
                  />
                  <Button type="submit" size="sm">
                    Setujui
                  </Button>
                </form>
              </>
            )}

            {b.status === "COMPLETED" &&
              (reviewRatings[b.id] === undefined ? (
                <Link
                  href={`/review/${b.id}`}
                  className="inline-flex items-center gap-1 type-badge text-primary-700 hover:text-primary-800"
                >
                  <Star className="h-3.5 w-3.5" /> Beri Ulasan
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 type-badge text-primary-700 ring-1 ring-inset ring-primary-200">
                  Ulasan terkirim
                </span>
              ))}

            <Link
              href={`/dashboard/influencer/riwayat/${b.id}`}
              className="inline-flex items-center gap-1 rounded-xl border border-primary-300 bg-neutral-0 px-3 py-1.5 type-badge text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
            >
              Detail
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <FilterTabs
        tabs={BOOKING_FILTER_TABS}
        active={filter}
        onSelect={selectFilter}
        className="mb-6"
      />
      <DataTable<BookingRow>
        columns={columns}
        rows={rows}
        keyOf={(b) => b.id}
        emptyIcon={filter === "sengketa" ? MessageSquareText : SearchX}
        emptyTitle="Tidak ada kolaborasi"
        emptyDescription={EMPTY_DESC[filter] ?? EMPTY_DESC.semua}
        emptyAction={
          filter !== "semua" ? (
            <button
              type="button"
              onClick={() => selectFilter("semua")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 type-label text-neutral-0 transition-colors duration-150 ease-standard hover:bg-primary-600"
            >
              Lihat Semua
            </button>
          ) : undefined
        }
      />
    </div>
  );
}