import { Skeleton } from "@/components/Skeleton";

/**
 * Loading state untuk rute kreator (`/dashboard/influencer*`). InfluencerShell
 * dirender per halaman (bukan lewat layout), jadi skeleton ini tampil tanpa
 * sidebar — pembungkus `mx-6 py-6` dipakai agar kolom kontennya sejajar dengan
 * posisi konten di dalam shell, mengurangi "lompatan" saat halaman asli masuk.
 */
export default function Loading() {
  return (
    <div role="status" className="mx-6 py-6 lg:py-8">
      <span className="sr-only">Memuat halaman…</span>

      {/* Header halaman (eyebrow + judul + deskripsi) */}
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />

      {/* KPI grid — meniru struktur KpiCard */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Daftar permintaan kolaborasi */}
      <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-0 p-5 shadow-xs">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-1/2 max-w-xs" />
                <Skeleton className="mt-2 h-3 w-1/3 max-w-40" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
