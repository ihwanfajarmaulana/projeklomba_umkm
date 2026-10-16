/**
 * Blok dasar skeleton untuk UI loading (`loading.tsx` di tiap segmen rute).
 *
 * Hanya primitif visual: neutral-200 di atas bg-page, radius mengikuti token
 * global (--radius-md = 10px), dan `animate-pulse` yang otomatis dimatikan
 * untuk pengguna prefers-reduced-motion. Blok ini aria-hidden — makna
 * "sedang memuat" disampaikan oleh teks sr-only `role="status"` pada halaman
 * yang memakainya, bukan oleh animasi pulsing-nya.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none ${className}`}
    />
  );
}
