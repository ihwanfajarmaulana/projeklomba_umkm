import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  Hourglass,
  Scale,
  Wallet,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { DataTable, type TableColumn } from "@/components/DataTable";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/format";
import { adminKpis, getAdminCases, type AdminCase } from "@/lib/data/disputes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Admin",
  description:
    "Ringkasan kasus sengketa Kolab.id — pantau antrian dan dana yang ditahan.",
};

const COLUMNS: TableColumn<AdminCase>[] = [
  {
    key: "kode",
    header: "Kode",
    cell: (k) => <span className="font-semibold text-neutral-900">{k.bookingCode}</span>,
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

export default async function AdminDashboardPage() {
  const cases = await getAdminCases();
  const kpi = adminKpis(cases);
  const queue = cases
    .filter((c) => c.status !== "RESOLVED")
    .slice(0, 5);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
            Ringkasan Kasus Sengketa
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Kasus paling dekat dengan batas keputusan tampil lebih dulu agar
            tidak ada yang terlewat.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FolderOpen}
          label="Kasus Terbuka"
          value={String(kpi.terbuka)}
          accent="primary"
          href="/admin/kasus?filter=dibuka"
          hrefLabel="Buka Antrian"
        />
        <KpiCard
          icon={Hourglass}
          label="Menunggu Info"
          value={String(kpi.menungguInfo)}
          accent="warning"
          href="/admin/kasus?filter=menunggu-info"
          hrefLabel="Lihat Kasus"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Melewati Batas"
          value={String(kpi.melewatiBatas)}
          accent="error"
          href="/admin/kasus?filter=terlambat"
          hrefLabel="Tindak Lanjut"
        />
        <KpiCard
          icon={Wallet}
          label="Dana Ditahan"
          value={formatRupiah(kpi.danaDitahan)}
          accent="info"
          hint="Total dana pada kasus yang belum diputuskan"
        />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-head text-xl font-bold tracking-[-0.02em] text-neutral-900">
              Antrian Kasus
            </h3>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
              {kpi.terbuka} terbuka
            </span>
          </div>
          <Button
            href="/admin/kasus"
            variant="secondary"
            size="sm"
            className="gap-1.5"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4">
          <DataTable
            columns={COLUMNS}
            rows={queue}
            keyOf={(k) => k.id}
            isLate={(k) => k.overdue && k.status !== "RESOLVED"}
            emptyIcon={Scale}
            emptyTitle="Tidak ada kasus terbuka"
            emptyDescription="Kasus sengketa baru akan muncul di sini setelah diajukan UMKM atau kreator."
          />
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          <Link
            href="/admin/kasus"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            Antrian lengkap dengan filter
          </Link>{" "}
          (Semua, Dibuka, Menunggu Info, Terlambat, Diputuskan).
        </p>
      </section>
    </AdminShell>
  );
}
