import { getUmkmById } from "@/lib/data/catalog";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, Store } from "lucide-react";
import { requireUmkm } from "@/lib/auth";

import { updateProfile } from "@/app/actions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile Usaha",
  description: "Lihat dan ubah profil usaha UMKM-mu di Kolab.id.",
};

export default async function ProfilePage(
  props: PageProps<"/dashboard/profile">,
) {
  const account = await requireUmkm();

  const umkm = await getUmkmById(account.umkmId);
  if (!umkm) redirect("/dashboard");

  const searchParams = await props.searchParams;
  const updated = searchParams.updated === "1";
  const gagal = searchParams.gagal === "1";

  const fields = [
    { name: "name", label: "Nama Usaha", value: umkm.name, max: 80 },
    { name: "owner", label: "Nama Pemilik", value: umkm.owner, max: 80 },
    { name: "category", label: "Kategori Usaha", value: umkm.category, max: 40 },
    { name: "city", label: "Kota", value: umkm.city, max: 40 },
  ];

  return (
    <>
      <div>
        <p className="type-table-head uppercase text-primary-700">
          Profile
        </p>
        <h1 className="mt-1 font-head type-page-title text-neutral-900">
          Profil Usaha
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Informasi ini dipakai untuk mencocokkan rekomendasi kreator.
        </p>
      </div>

      {updated && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-success-200 bg-success-50 p-4 text-sm text-success-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Profil tersimpan!</p>
            <p className="mt-0.5">
              Rekomendasi kreator-mu sudah disesuaikan dengan data terbaru.
            </p>
          </div>
        </div>
      )}

      {gagal && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Gagal menyimpan</p>
            <p className="mt-0.5">Semua kolom wajib diisi. Coba lagi.</p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Ringkasan */}
        <div className="h-fit rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-neutral-0">
              <Store className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-head type-section-title text-neutral-900">
                {umkm.name}
              </p>
              <p className="truncate type-table text-neutral-500">
                {umkm.category} · {umkm.city}
              </p>
            </div>
          </div>
          <dl className="mt-6 space-y-3 border-t border-neutral-100 pt-6 type-table">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Pemilik</dt>
              <dd className="font-semibold text-neutral-900">{umkm.owner}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Kategori</dt>
              <dd className="font-semibold text-neutral-900">{umkm.category}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Kota</dt>
              <dd className="font-semibold text-neutral-900">{umkm.city}</dd>
            </div>
          </dl>
        </div>

        {/* Form ubah */}
        <form
          action={updateProfile}
          className="h-fit rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs sm:p-8"
        >
          <h2 className="font-head type-card-title text-neutral-900">
            Ubah Profil
          </h2>
          <div className="mt-5 space-y-4">
            {fields.map((f) => (
              <Input
                key={f.name}
                name={f.name}
                label={f.label}
                defaultValue={f.value}
                maxLength={f.max}
                required
              />
            ))}
          </div>
          <Button type="submit" variant="primary" className="mt-6 w-full">
            Simpan Perubahan
          </Button>
        </form>
      </div>
    </>
  );
}