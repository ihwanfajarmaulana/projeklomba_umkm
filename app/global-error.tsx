"use client";

import { useEffect } from "react";
import "./globals.css";
import { Button } from "@/components/Button";

/**
 * Error boundary paling luar — aktif kalau root layout-nya sendiri yang
 * gagal render, sehingga menggantikan seluruh dokumen (harus membawa
 * <html>/<body> sendiri). Skenarionya langka tapi fatal (font/globals gagal
 * load, dsb.): tampilkan pesan yang tetap terbaca + jalan keluar, tanpa
 * mengandalkan komponen layout yang ikut-ikutan rusak.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Sama seperti app/error.tsx: digest-nya dicocokkan dengan log server.
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="font-head text-7xl font-extrabold tracking-[-0.02em] text-primary-500">
            !
          </p>
          <h1 className="mt-4 font-head text-2xl font-extrabold tracking-[-0.02em]">
            Aplikasi gagal dimuat
          </h1>
          <p className="mt-2 max-w-md text-neutral-600">
            Terjadi kesalahan kritis saat memuat halaman. Muat ulang untuk
            mencoba lagi.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={retry}>Coba lagi</Button>
            <Button variant="secondary" href="/">
              Ke beranda
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
