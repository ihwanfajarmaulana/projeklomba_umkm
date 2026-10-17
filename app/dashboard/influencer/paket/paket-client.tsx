"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";
import type { Package as PackageType } from "@/lib/types";
import { idleFormState } from "@/lib/form-state";
import { saveInfluencerPackage, setPackageActive } from "@/app/actions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { EmptyState } from "@/components/EmptyState";
import { formatRupiah } from "@/lib/format";

type Draft = {
  name: string;
  price: string;
  summary: string;
  includes: string;
  quota: number;
  days: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  price: "",
  summary: "",
  includes: "",
  quota: 2,
  days: "5",
};

const FIELD =
  "w-full rounded-xl border bg-neutral-0 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 ease-standard focus:outline-none focus:ring-2";

/**
 * PaketClient (ARCHITECTURE §4.6): kelola paket & harga.
 *
 * The list is whatever the server rendered - there is no local copy of it. A
 * create, edit, activation, or deactivation goes to a Server Action, which
 * writes through the service role (the only writer the policies allow) and
 * revalidates the public pages; the trigger then recomputes the creator's
 * starting price. Keeping rows in client state is what the prototype did, and it
 * would put the page back out of step with the database on the next load.
 */
export function PaketClient({ packages }: { packages: PackageType[] }) {
  const [formMode, setFormMode] = useState<"closed" | "add" | "edit">("closed");
  const [formId, setFormId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [state, formAction, pending] = useActionState(
    saveInfluencerPackage,
    idleFormState,
  );

  // A successful save re-renders the page with the new list; close the form so
  // the creator is not left staring at a filled-in form they already submitted.
  useEffect(() => {
    if (state.notice) closeForm();
  }, [state]);

  const formOpen = formMode !== "closed";
  const activeRows = packages.filter((p) => p.isActive);
  const totalValue = activeRows.reduce((sum, p) => sum + p.price, 0);

  function closeForm() {
    setFormMode("closed");
    setFormId(null);
    setDraft(EMPTY_DRAFT);
  }

  const openAdd = () => {
    setFormMode("add");
    setFormId(null);
    setDraft(EMPTY_DRAFT);
  };

  const openEdit = (row: PackageType) => {
    setFormMode("edit");
    setFormId(row.id);
    setDraft({
      name: row.name,
      price: String(row.price),
      summary: row.summary,
      includes: row.includes.join(", "),
      quota: row.revisionQuota,
      days: String(row.estimatedDays),
    });
  };

  return (
    <div className="space-y-6">
      {/* Pengingat regulasi harga (ARCHITECTURE §4.6) */}
      <div className="rounded-2xl border border-info-200 bg-info-50 p-4 type-table text-info-700">
        <p className="flex items-center gap-2 type-label">
          <Info className="h-4 w-4" /> Harga & kuota revisi bersifat publik
        </p>
        <p className="mt-1 leading-relaxed">
          Perubahan langsung terlihat oleh semua UMKM di halaman profil dan
          pencarian kreator. Pastikan kamu nyaman dengan angkanya.
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-0 px-4 py-3 type-table text-neutral-600">
          <RefreshCcw className="h-4 w-4 shrink-0 text-primary-600" />
          Perubahan hanya berlaku untuk <strong>permintaan baru</strong>.
          Kolaborasi yang sudah masuk tetap memakai nama, harga, kuota revisi,
          dan estimasi saat diajukan.
        </p>
        <Button onClick={openAdd} disabled={formOpen}>
          <Plus className="h-4 w-4" /> Tambah Paket
        </Button>
      </div>

      {/* Form tambah/edit. Submits to the Server Action, so the values persist. */}
      {formOpen && (
        <form
          action={formAction}
          className="rounded-2xl border border-primary-200 bg-neutral-0 p-5 shadow-xs sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-section-title font-head text-neutral-900">
              {formMode === "edit" ? "Edit Paket" : "Paket Baru"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Tutup form"
              className="grid h-9 w-9 place-items-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <input type="hidden" name="packageId" value={formId ?? ""} />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Nama Paket"
              name="name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Contoh: Paket Basic"
            />
            <Input
              label="Harga (Rp per video)"
              name="price"
              type="number"
              min={1}
              step={10000}
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder="750000"
            />
            <label className="sm:col-span-2">
              <span className="mb-1.5 block type-label leading-5 text-neutral-700">
                Ringkasan
              </span>
              <textarea
                name="summary"
                rows={2}
                value={draft.summary}
                onChange={(e) =>
                  setDraft({ ...draft, summary: e.target.value })
                }
                placeholder="Contoh: 1 video 30–60 detik"
                className={`${FIELD} border-neutral-200 focus:border-primary-500 focus:ring-primary-200`}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block type-label leading-5 text-neutral-700">
                Termasuk
              </span>
              <textarea
                name="includes"
                rows={2}
                value={draft.includes}
                onChange={(e) =>
                  setDraft({ ...draft, includes: e.target.value })
                }
                placeholder="Pisahkan dengan koma, mis. 1 video 30–60 detik, Tayang 7 hari di feed"
                className={`${FIELD} border-neutral-200 focus:border-primary-500 focus:ring-primary-200`}
              />
              <p className="mt-1.5 type-caption text-neutral-500">
                Tampil sebagai daftar centang di halaman booking.
              </p>
            </label>
            <label>
              <span className="mb-1.5 block type-label leading-5 text-neutral-700">
                Jumlah Revisi
              </span>
              <select
                name="quota"
                value={draft.quota}
                onChange={(e) =>
                  setDraft({ ...draft, quota: Number(e.target.value) })
                }
                className={`${FIELD} h-11 border-neutral-200 focus:border-primary-500 focus:ring-primary-200`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} revisi
                  </option>
                ))}
              </select>
              <p className="mt-1.5 type-caption text-neutral-500">
                Kuota revisi per kolaborasi (1–5).
              </p>
            </label>
            <Input
              label="Estimasi Pengerjaan (hari)"
              name="days"
              type="number"
              min={1}
              step={1}
              value={draft.days}
              onChange={(e) => setDraft({ ...draft, days: e.target.value })}
              hint="Hari sampai versi pertama terkirim."
            />
          </div>

          {state.error && (
            <p className="mt-4 flex items-center gap-1.5 type-label text-error-700">
              <AlertTriangle className="h-4 w-4" /> {state.error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={pending}>
              {formMode === "edit" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />{" "}
                  {pending ? "Menyimpan…" : "Simpan Perubahan"}
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />{" "}
                  {pending ? "Menyimpan…" : "Simpan Paket"}
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={closeForm}>
              Batal
            </Button>
          </div>
        </form>
      )}

      {state.notice && !formOpen && (
        <p className="flex items-center gap-1.5 rounded-2xl border border-success-200 bg-success-50 px-4 py-3 type-label text-success-700">
          <CheckCircle2 className="h-4 w-4" /> {state.notice}
        </p>
      )}

      {/* Daftar paket */}
      {packages.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Belum ada paket"
          description="Buat paket pertamamu agar UMKM bisa mulai mengajukan kolaborasi."
          action={
            <Button onClick={openAdd} disabled={formOpen}>
              <Plus className="h-4 w-4" /> Tambah Paket
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {packages.map((row) => (
            <div
              key={row.id}
              className={`flex flex-col rounded-2xl border bg-neutral-0 p-5 shadow-xs ${
                row.isActive
                  ? "border-neutral-200"
                  : "border-neutral-200 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 type-card-title font-head text-neutral-900">
                    {row.name}
                    {!row.isActive && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        Nonaktif
                      </span>
                    )}
                  </h3>
                  <p className="mt-0.5 type-table text-neutral-500">
                    {row.summary}
                  </p>
                </div>
                <p className="shrink-0 font-head type-card-title text-primary-700">
                  {formatRupiah(row.price)}
                </p>
              </div>

              {row.includes.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {row.includes.map((inc) => (
                    <li
                      key={inc}
                      className="flex items-start gap-1.5 type-caption text-neutral-600"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
                      {inc}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-2.5 py-1 type-badge text-neutral-700 ring-1 ring-inset ring-neutral-200">
                  <RefreshCcw className="h-3 w-3" /> {row.revisionQuota} revisi
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-2.5 py-1 type-badge text-neutral-700 ring-1 ring-inset ring-neutral-200">
                  <Clock className="h-3 w-3" /> Estimasi {row.estimatedDays} hari
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-neutral-100 pt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEdit(row)}
                  disabled={formOpen}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>

                {row.isActive ? (
                  confirmId === row.id ? (
                    <form action={setPackageActive} className="flex items-center gap-2">
                      <input type="hidden" name="packageId" value={row.id} />
                      <input type="hidden" name="active" value="0" />
                      <Button size="sm" variant="destructive" type="submit">
                        Yakin nonaktifkan?
                      </Button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-xl border border-neutral-200 bg-neutral-0 px-3 py-2 type-badge text-neutral-600 transition-colors hover:bg-neutral-100"
                      >
                        Batal
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(row.id)}
                      disabled={formOpen}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-error-200 bg-error-50 px-3.5 py-2 type-badge text-error-700 transition-colors hover:bg-error-100 disabled:pointer-events-none disabled:bg-neutral-100 disabled:text-neutral-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Nonaktifkan
                    </button>
                  )
                ) : (
                  <form action={setPackageActive}>
                    <input type="hidden" name="packageId" value={row.id} />
                    <input type="hidden" name="active" value="1" />
                    <Button size="sm" variant="secondary" type="submit">
                      <RefreshCcw className="h-3.5 w-3.5" /> Aktifkan
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ringkasan nilai total (info publik kreasi) */}
      {packages.length > 0 && (
        <p className="type-caption text-neutral-500">
          {activeRows.length} paket aktif · total nilai penawaran{" "}
          <strong className="text-neutral-700">{formatRupiah(totalValue)}</strong>
        </p>
      )}
    </div>
  );
}