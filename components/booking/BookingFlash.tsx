import { CheckCircle2, TriangleAlert } from "lucide-react";

/**
 * The banner a lifecycle action leaves behind.
 *
 * The action puts a short code in `?ok=` / `?gagal=`; this maps it to a
 * sentence. The database's own error message never reaches the URL, so the
 * quota refusal, for example, is restated here as the spec asks ("the quota is
 * used up, open a dispute").
 */
const OK_TEXT: Record<string, string> = {
  diterima: "Pengajuan diterima. Brief dikunci dan menunggu pembayaran.",
  ditolak: "Pengajuan ditolak.",
  dibayar: "Dana ditahan di platform. Kreator bisa mulai bekerja.",
  terkirim: "Konten terkirim. Menunggu review UMKM.",
  revisi: "Permintaan revisi terkirim.",
  selesai: "Disetujui. Dana dirilis ke kreator.",
  diperpanjang: "Waktu review diperpanjang 2 hari.",
  batal: "Kolaborasi dibatalkan.",
  sengketa: "Sengketa dibuka dan menunggu keputusan.",
  tawaran: "Tawaran penyelesaian terkirim. Menunggu keputusan pihak lain.",
  "tawaran-diterima": "Tawaran diterima. Perubahan sudah diterapkan.",
  "tawaran-ditolak": "Tawaran ditolak.",
  diputuskan: "Keputusan tersimpan. Kasus selesai dan dana diselesaikan.",
  diminta: "Permintaan informasi terkirim. Kasus menunggu jawaban pihak.",
  dijawab: "Jawaban terkirim ke admin.",
};

const GAGAL_TEXT: Record<string, string> = {
  akses: "Kamu bukan pihak pada kolaborasi ini.",
  aturan: "Aksi itu tidak diizinkan dari status kolaborasi saat ini.",
  duplikat:
    "Ronde itu sudah pernah diminta revisi. Ajukan pada ronde berikutnya.",
  tidak: "Data yang dirujuk tidak ditemukan.",
  kuota: "Kuota revisi sudah habis. Ajukan sengketa untuk melanjutkan.",
  link: "Link konten wajib diisi.",
  ronde: "Pilih ronde yang ingin direvisi.",
  bagian: "Nama bagian yang direvisi wajib diisi.",
  catatan: "Catatan revisi wajib diisi.",
  alasan: "Alasan sengketa wajib diisi.",
  perpanjang: "Waktu review sudah pernah diperpanjang.",
  tawaran: "Tawaran tidak valid untuk status kolaborasi ini.",
  nilai: "Nilai tawaran harus berupa angka positif.",
  kedaluwarsa: "Tawaran sudah kedaluwarsa.",
  keputusan: "Pilih salah satu keputusan yang tersedia.",
  pertanyaan: "Pertanyaan wajib diisi.",
  jawaban: "Jawaban wajib diisi.",
  target: "Pilih pihak yang ditanyai.",
  gagal: "Terjadi kesalahan. Coba lagi sebentar.",
};

export function BookingFlash({
  ok,
  gagal,
}: {
  ok?: string;
  gagal?: string;
}) {
  const okText = ok ? OK_TEXT[ok] : undefined;
  const gagalText = gagal ? GAGAL_TEXT[gagal] : undefined;
  if (!okText && !gagalText) return null;

  if (gagalText) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700"
      >
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{gagalText}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-success-200 bg-success-50 p-4 text-sm text-success-700">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{okText}</p>
    </div>
  );
}