import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

const marqueeItems = [
  "Bandung",
  "Jakarta",
  "Yogyakarta",
  "Medan",
  "Bali",
  "Surabaya",
  "Kuliner",
  "Fashion",
  "Beauty",
  "Gadget",
  "Travel",
  "Gaming",
  "Parenting",
  "Otomotif",
];

export default async function LandingPage() {
  return (
    <div>
      {/* ================================================================
          HERO — pengenalan pertama
      ================================================================ */}
      <section id="beranda" className="hero-glow bg-grid relative scroll-mt-16 overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          {/* ---- Kiri: pesan utama ---- */}
          <div>
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-secondary-600" />
              Platform kolaborasi UMKM × Kreator
            </span>

            <h1
              className="animate-fade-up font-head mt-6 text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] text-neutral-900 sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              UMKM naik kelas,{" "}
              <span className="inline-block rounded-lg bg-secondary-400 px-3 py-0.5 text-primary-800 [box-decoration-break:clone]">kreator naik cuan</span>
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Temukan kreator lokal yang pas untuk produkmu. Harga per video
              jelas,{" "}
              <strong className="font-semibold text-neutral-800">
                tanpa agensi dan tanpa ribet
              </strong>
              . Sama-sama untung.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/influencers"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110"
              >
                <Search className="h-4 w-4" />
                Cari Kreator Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-700"
              >
                <StoreIcon />
                Coba Demo UMKM
              </Link>
            </div>

          </div>

          {/* ---- Kanan: placeholder ---- */}
          <div
            className="animate-fade-up relative hidden lg:block"
            style={{ animationDelay: "200ms" }}
          >
            <div className="grid aspect-[4/3] w-full place-items-center rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-100 text-sm font-semibold text-neutral-400">
              Hero visual placeholder
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MARQUEE — "dipercaya" strip
      ================================================================ */}
      <section className="border-y border-neutral-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-neutral-400">
            Dipakai UMKM & kreator dari berbagai kota dan kategori
          </p>
          <div className="marquee-mask mt-4 overflow-hidden">
            <div className="animate-marquee flex w-max">
              {[0, 1].map((half) => (
                <div
                  key={half}
                  className="flex shrink-0 items-center gap-10 pr-10"
                  aria-hidden={half === 1}
                >
                  {marqueeItems.map((item) => (
                    <span
                      key={`${half}-${item}`}
                      className="flex items-center gap-2 whitespace-nowrap text-sm font-bold text-neutral-400"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary-300" />
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
MASALAH → SOLUSI
      ================================================================ */}
      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-primary-600">
                Masalahnya
              </p>
              <h2 className="font-head mt-2 text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
                Pemasarannya mentok,{" "}
                <span className="inline-block rounded-lg bg-secondary-400 px-3 py-0.5 text-primary-800 [box-decoration-break:clone]">
                  bukan produknya yang jelek
                </span>
              </h2>
            <p className="mx-auto mt-4 max-w-md text-neutral-600">
              Banyak UMKM dengan produk berkualitas gagal berkembang karena satu
              hal: tidak dilihat orang.
            </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Megaphone,
                title: "Jangkauan terbatas",
                desc: "Jualan online cuma di grup tetangga, akun media sosial sepi. Produk bagus tak pernah sampai ke pembeli baru.",
                color: "bg-error-50 text-error-700",
              },
              {
                icon: Wallet,
                title: "Iklan & agensi kemahalan",
                desc: "Agency besar mulai dari belasan juta. UMKM dengan modal pas-pasan tidak sanggup, hasilnya iklan lokal mati gaya.",
                color: "bg-warning-50 text-warning-700",
              },
              {
                icon: Users,
                title: "Cari kreator itu ribet",
                desc: "Nemu kreator dari DM sana-sini, harga ngambang, deal tidak jelas. Buang waktu, risiko ditipu tinggi.",
                color: "bg-primary-50 text-primary-700",
              },
            ].map((p, i) => (
              <Reveal key={p.title} delayMs={i * 50}>
                <div className="h-full rounded-3xl border border-neutral-200 bg-white p-7">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${p.color}`}
                  >
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-head mt-4 text-base font-bold text-neutral-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================================
          FITUR
      ================================================================ */}
      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-primary-600">
              Fitur
            </p>
          <h2 className="font-head mt-2 text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
            Satu platform, semua kebutuhan kolaborasi
          </h2>
          <p className="mt-4 text-neutral-600">
            Dari cari kreator sampai pantau hasil konten — semuanya transparan
            dan bisa diakses dari satu tempat.
          </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Kreator terkurasi",
              desc: "12+ kreator terverifikasi dari 10+ kategori. Filter cepat berdasarkan niche, kota, harga, dan jumlah followers.",
              color: "from-primary-500 to-primary-700",
            },
            {
              icon: Wallet,
              title: "Harga per video jelas",
              desc: "Setiap kreator memajang paket lengkap — Review Video, Unboxing & Story, hingga Kampanye Komplit. Tanpa tawar-menawar di DM.",
              color: "from-secondary-500 to-secondary-700",
            },
            {
              icon: ClipboardList,
              title: "Booking 3 langkah",
              desc: "Pilih paket, tulis brief singkat, kirim. Kreator tinggal setujui atau tolak — status langsung terpantau.",
              color: "from-success-500 to-success-700",
            },
            {
              icon: LayoutDashboard,
              title: "Dashboard UMKM",
              desc: "Ringkasan total kolaborasi, anggaran, dan riwayat lengkap dalam satu layar. Tahu persis di mana posisi setiap campaign.",
              color: "from-warning-500 to-warning-700",
            },
            {
              icon: BarChart3,
              title: "Dashboard kreator",
              desc: "Kreator melihat semua permintaan masuk, mengatur jadwal, dan menandai konten selesai — tanpa bantuan agensi.",
              color: "from-info-500 to-info-700",
            },
            {
              icon: ShieldCheck,
              title: "Aman & transparan",
              desc: "Profil terverifikasi, riwayat rating, dan alur konfirmasi yang jelas. Kedua pihak tahu persis apa yang dikerjakan.",
              color: "from-error-500 to-error-700",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delayMs={i * 50}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-sm hover:shadow-primary-500/10">
              <div
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`}
              />
              <span
                className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-sm`}
              >
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-head relative mt-5 text-lg font-bold text-neutral-900">
                {f.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-neutral-600">
                {f.desc}
              </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================
          CARA KERJA
      ================================================================ */}
      <section id="cara-kerja" className="scroll-mt-16 border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-primary-600">
                Cara kerja
              </p>
              <h2 className="font-head mt-2 text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
                Dari cari kreator ke konten tayang, cuma 3 langkah
              </h2>
            </div>
          </Reveal>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            {/* Garis penghubung */}
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-0.5 bg-gradient-to-r from-primary-200 via-secondary-400 to-primary-200 md:block" />

            {[
              {
                step: "01",
                icon: Search,
                title: "Pilih kreator",
                desc: "Filter berdasarkan kategori usaha, kota, harga per video, dan jumlah followers. Langsung lihat rating dan ulasan.",
              },
              {
                step: "02",
                icon: Handshake,
                title: "Ajukan kolaborasi",
                desc: "Pilih paket (review, unboxing, kampanye), tulis brief singkat, lalu kirim. Kreator tinggal setujui atau tolak.",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Kelola & menangkan",
                desc: "Pantau status semua kolaborasi di dashboard. Konten tayang, toko ramai, dua-duanya dapat cuan.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delayMs={i * 50}>
                <div className="relative h-full text-center md:px-4">
                <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-sm shadow-primary-500/25 ring-4 ring-white">
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="mt-4 inline-block rounded-full bg-primary-50 px-3 py-0.5 text-xs font-extrabold tracking-widest text-primary-700">
                  LANGKAH {s.step}
                </span>
                <h3 className="font-head mt-2 text-lg font-bold text-neutral-900">
                  {s.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-600">
                  {s.desc}
                </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================

          FAQ
      ================================================================ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-primary-600">
              FAQ
            </p>
            <h2 className="font-head mt-2 text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
              Pertanyaan yang sering ditanya
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 space-y-3">
          {[
            {
              q: "Apakah saya harus bayar untuk memakai Kolab.id?",
              a: "Tidak ada biaya bulanan untuk memulai. Kamu hanya membayar paket kolaborasi yang dipilih — dananya ditahan aman sampai konten selesai tayang.",
            },
            {
              q: "Bagaimana saya tahu kreatornya terpercaya?",
              a: "Setiap kreator lewat kurasi tim kami: profil terverifikasi, riwayat rating dari UMKM lain, jumlah followers, dan ulasan yang bisa kamu lihat langsung di halaman profilnya.",
            },
            {
              q: "Kalau kreatornya menolak booking saya, uang saya bagaimana?",
              a: "Tidak ada biaya yang dipotong sebelum kolaborasi disetujui. Jika ditolak atau dibatalkan, tidak ada dana yang berpindah — kamu bisa langsung mencari kreator lain.",
            },
            {
              q: "Saya kreator, bagaimana cara mendaftar?",
              a: "Saat ini kamu bisa langsung masuk dengan akun demo dari halaman login. Untuk versi penuh nantinya, pendaftaran kreator akan melalui proses kurasi dan verifikasi profil.",
            },
            {
              q: "Apakah bisa offline / tanpa internet?",
              a: "Aplikasi demo ini berjalan 100% lokal di komputermu — database, font, dan semua aset sudah dibundel, jadi cocok untuk demo tanpa khawatir koneksi.",
            },
          ].map((f, i) => (
            <Reveal key={f.q} delayMs={i * 50}>
              <details
                className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition-shadow open:border-primary-200 open:shadow-sm"
                open={i === 0}
              >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-head text-sm font-bold text-neutral-900">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {f.a}
              </p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================
          CTA FINAL
      ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-16 text-center text-white sm:px-12 lg:py-20">
          <div className="dot-pattern absolute inset-0 opacity-15" />
          <div className="bg-grid absolute inset-0 opacity-20" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-head text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Siap membawa UMKM-mu naik kelas?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-100">
              Gandeng kreator yang tepat hari ini. Sambil jalan, kamu juga
              memberdayakan kreator lokal untuk terus berkarya.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/influencers"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-sm transition-transform hover:scale-105"
              >
                Cari Kreator
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Coba Demo Sekarang
              </Link>
            </div>
          </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/** Ikon Store sederhana (lucide "store" tidak diimpor agar ringkas) */
function StoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-store"
      aria-hidden="true"
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  );
}