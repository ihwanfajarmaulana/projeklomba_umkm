"use client";

import { useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/Button";

/**
 * Error boundary root — menangkap error runtime di segmen mana pun di bawah
 * root layout (data Supabase gagal, bug render, dsb.) dan mengganti halaman
 * yang gagal dengan panel pemulihan, bukan layar kosong.
 *
 * Next 16: prop `retry` (stabil sejak 16.3) — memicu re-fetch dan render
 * ulang segmen yang gagal; `reset` tetap ada tapi `retry` yang disarankan.
 * Navbar/Footer tetap tampil karena boundary ini berada di bawah root layout.
 */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Satu kanal observability yang tersedia: digest dicocokkan dengan log
    // server (error serupa punya digest sama), jadi jangan ditelan diam-diam.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-error-50 text-error-700">
        <Info className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
        Ups, terjadi kesalahan
      </h1>
      <p className="mt-2 max-w-md text-neutral-600">
        Halaman ini gagal dimuat. Biasanya bersifat sementara — coba lagi, atau
        kembali ke beranda kalau masih bermasalah.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-neutral-400">
          Kode error: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={retry}>Coba lagi</Button>
        <Button variant="secondary" href="/">
          Ke beranda
        </Button>
      </div>
    </div>
  );
}
