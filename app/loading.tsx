import { Skeleton } from "@/components/Skeleton";

/**
 * Loading state untuk semua rute publik (landing, katalog kreator, insights,
 * auth) di bawah root layout. Navbar/Footer tetap tampil karena loading.tsx
 * hanya menggantikan isi halaman, bukan layout — dan karena semua halaman
 * force-dynamic, inilah tampilan pertama yang dilihat user sementara data
 * Supabase disiapkan, bukan layar kosong.
 */
export default function Loading() {
  return (
    <div role="status" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <span className="sr-only">Memuat halaman…</span>

      {/* Hero / header halaman */}
      <div className="pt-4 sm:pt-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-2/3 max-w-2xl" />
        <Skeleton className="mt-4 h-4 w-1/2 max-w-xl" />
        <Skeleton className="mt-2 h-4 w-1/3 max-w-lg" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>

      {/* Grid kartu (kreator / fitur / insight) */}
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="mt-5 h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
