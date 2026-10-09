import type { Metadata } from "next";
import { Scale, SearchX } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { DataTable, type TableColumn } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/format";
import {
  filterAdminCases,
  getAdminCases,
  type AdminCase,
  type AdminCaseFilter,
} from "@/lib/data/disputes";
import { KasusClient } from "./kasus-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Antrian Kasus",
  description:
    "Antrian kasus sengketa Kolab.id — urutkan berdasarkan batas keputusan terdekat.",
};

const FILTERS: readonly AdminCaseFilter[] = [
  "semua",
  "dibuka",
  "menunggu-info",
  "terlambat",
  "diputuskan",
];

const COLUMNS: TableColumn<AdminCase>[] = [
  {
    key: "kode",
    header: "Kode Booking",
    cell: (k) => (
      <span className="font-semibold text-neutral-900">{k.bookingCode}</span>
    ),
  },
  {
    key: "umkm",
    header: "UMKM",
    cell: (k) => <span className="text-neutral-700">{k.umkmName}</span>,
  },
  {
    key: "kreator",
    header: "Kreator",
    cell: (k) => <span className="text-neutral-700">{k.creatorName}</span>,
  },
  {
    key: "nominal",
    header: "Nominal",
    cell: (k) => (
      <span className="font-medium text-neutral-900">
        {formatRupiah(k.amount)}
      </span>
    ),
  },
  {
    key: "dibuka-oleh",
    header: "Dibuka Oleh",
    cell: (k) => (
      <span className="text-neutral-600">
        {k.openedBy === "umkm" ? "UMKM" : "Kreator"}
      </span>
    ),
  },
  {
    key: "dibuka-pada",
    header: "Dibuka Pada",
    cell: (k) => (
      <span className="text-neutral-600">{formatDate(k.createdAt)}</span>
    ),
  },
  {
    key: "batas",
    header: "Batas Keputusan",
    cell: (k) => (
      <span className="text-neutral-600">{formatDate(k.dueAt)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (k) => (
      <span className="inline-flex items-center gap-2">
        <StatusBadge status={k.status} />
        {k.overdue && k.status !== "RESOLVED" && (
          <span className="inline-flex items-center rounded-full bg-error-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-error-700">
            Terlambat
          </span>
        )}
      </span>
    ),
  },
  {
    key: "aksi",
    header: "",
    cell: (k) => (
      <Button href={`/admin/kasus/${k.id}`} variant="secondary" size="sm">
        Buka Kasus
      </Button>
    ),
  },
];

export default async function AdminKasusPage(
  props: PageProps<"/admin/kasus">,
) {
  const searchParams = await props.searchParams;
  const rawFilter = searchParams.filter;
  const filter: AdminCaseFilter = FILTERS.includes(rawFilter as AdminCaseFilter)
    ? (rawFilter as AdminCaseFilter)
    : "semua";

  // `getAdminCases` already orders by the soonest deadline.
  const rows = filterAdminCases(await getAdminCases(), filter);

  return (
    <AdminShell>
      <div>
        <h2 className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Antrian Kasus
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Urut berdasarkan batas keputusan terdekat — kasus{" "}
          <span className="font-semibold text-error-700">Terlambat</span>{" "}
          ditandai dan paling butuh perhatian.
        </p>
      </div>

      <div className="mt-5">
        <KasusClient active={filter} />
      </div>

      <div className="mt-5">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          keyOf={(k) => k.id}
          isLate={(k) => k.overdue && k.status !== "RESOLVED"}
          emptyIcon={SearchX}
          emptyTitle="Tidak ada kasus dengan filter ini"
          emptyDescription="Kasus sengketa baru akan muncul di sini setelah diajukan oleh UMKM atau kreator."
        />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        <Scale className="mr-1 inline h-3.5 w-3.5 align-middle" />
        Batas keputusan = 3 hari sejak kasus dibuka; jam berhenti selama kasus
        Menunggu Info.
      </p>
    </AdminShell>
  );
}
