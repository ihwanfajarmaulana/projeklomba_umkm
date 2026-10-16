import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";

/**
 * 404 — menangani URL yang tidak ditemukan sama sekali DAN `notFound()`
 * yang dilempar dari halaman (mis. detail booking/kreator yang tidak ada).
 * Berada di bawah root layout, jadi Navbar/Footer tetap tampil dan user
 * bisa langsung navigasi lanjut tanpa jalan buntu.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="font-head text-7xl font-extrabold tracking-[-0.02em] text-primary-500">
        404
      </p>
      <h1 className="mt-4 font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-md text-neutral-600">
        Halaman yang kamu cari mungkin sudah dipindah, sudah tidak ada, atau
        tautannya salah ketik.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button href="/">Ke beranda</Button>
        <Button variant="secondary" href="/influencers">
          Jelajahi kreator <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
