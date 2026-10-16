import { Skeleton } from "@/components/Skeleton";

/**
 * Loading state untuk rute admin (`/admin*`): antrian kasus + KPI. Sama
 * seperti kreator, AdminShell dirender per halaman sehingga skeleton tampil
 * tanpa sidebar; `mx-6 py-6` Menjaga kolom konten tetap sejajar dengan shell.
 */
export default function Loading() {
  return (
    <div role="status" className="mx-6 py-6 lg:py-8">
      <span className="sr-only">Memuat halaman…</span>

      {/* Header halaman */}
      <Skeleton className="mt-1 h-8 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />

      {/* KPI grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-9" />
            </div>
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Tabel antrian (meniru DataTable: header bar + baris) */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 shadow-xs">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-4 w-1/4 max-w-40" />
              <Skeleton className="h-4 w-1/4 max-w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="ml-auto h-8 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
