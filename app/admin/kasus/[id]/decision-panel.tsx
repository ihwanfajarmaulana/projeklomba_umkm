"use client";

import { useState } from "react";
import {
  CheckCircle2,
  HandCoins,
  HelpCircle,
  LifeBuoy,
  RotateCcw,
  Scale,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { decideDispute, requestDisputeInfo } from "@/app/actions";
import { formatRupiah } from "@/lib/format";

type Mode = "CAIRKAN_PENUH" | "REFUND_PENUH" | "BAGI_DANA" | "MINTA_INFO";

/**
 * DecisionPanel (ARCHITECTURE §5.7): the four operator actions.
 *
 * Armed mode only decides which form is shown; the write itself is a Server
 * Action posting to `decide_dispute` or `request_dispute_info`. The database
 * function is the guard (decision legality, percentage range, held total), so a
 * hidden button is convenience, not security.
 */

const MONEY_DECISION: Record<
  Exclude<Mode, "MINTA_INFO">,
  "RELEASE_FULL" | "REFUND_FULL" | "SPLIT"
> = {
  CAIRKAN_PENUH: "RELEASE_FULL",
  REFUND_PENUH: "REFUND_FULL",
  BAGI_DANA: "SPLIT",
};

export function DecisionPanel({
  disputeId,
  nominal,
  bookingKode,
}: {
  disputeId: number;
  nominal: number;
  bookingKode: string;
}) {
  const [armed, setArmed] = useState<Mode | null>(null);
  const [persen, setPersen] = useState(50);
  const next = `/admin/kasus/${disputeId}`;

  function arm(mode: Mode) {
    setArmed((cur) => (cur === mode ? null : mode));
  }

  const choiceClass = (mode: Mode, activeClass: string) =>
    `flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
      armed === mode
        ? activeClass
        : "border-neutral-200 bg-neutral-0 hover:border-neutral-300 hover:bg-neutral-50"
    }`;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
      <h3 className="font-head text-lg font-bold tracking-[-0.02em] text-neutral-900">
        Keputusan Admin
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        Pilih keputusan, lalu tuliskan alasan — wajib untuk setiap aksi.
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={() => arm("MINTA_INFO")}
          aria-pressed={armed === "MINTA_INFO"}
          className={choiceClass("MINTA_INFO", "border-primary-300 bg-primary-50")}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info-50 text-info-600">
            <HelpCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Minta Info Tambahan
            </span>
            <span className="block text-xs text-neutral-500">
              Kirim pertanyaan ke satu atau kedua pihak. Kasus menjadi Menunggu
              Info — tidak ada dana yang bergerak.
            </span>
          </span>
          <span className="ml-auto inline-flex items-center rounded-full bg-info-50 px-3 py-1 text-xs font-semibold text-info-700">
            Tanpa transfer dana
          </span>
        </button>

        <button
          type="button"
          onClick={() => arm("CAIRKAN_PENUH")}
          aria-pressed={armed === "CAIRKAN_PENUH"}
          className={choiceClass("CAIRKAN_PENUH", "border-primary-300 bg-primary-50")}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <HandCoins className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Cairkan Penuh
            </span>
            <span className="block text-xs text-neutral-500">
              {formatRupiah(nominal)} ke kreator. Booking menjadi Selesai.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => arm("REFUND_PENUH")}
          aria-pressed={armed === "REFUND_PENUH"}
          className={choiceClass("REFUND_PENUH", "border-error-200 bg-error-50")}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-error-50 text-error-600">
            <RotateCcw className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Refund Penuh
            </span>
            <span className="block text-xs text-neutral-500">
              {formatRupiah(nominal)} kembali ke UMKM. Booking menjadi
              Dibatalkan.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => arm("BAGI_DANA")}
          aria-pressed={armed === "BAGI_DANA"}
          className={choiceClass("BAGI_DANA", "border-warning-300 bg-warning-50")}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-50 text-warning-600">
            <Scale className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Bagi Dana
            </span>
            <span className="block text-xs text-neutral-500">
              Tentukan persen porsi kreator, sisanya untuk UMKM. Booking menjadi
              Selesai.
            </span>
          </span>
        </button>
      </div>

      {armed === "MINTA_INFO" ? (
        <form action={requestDisputeInfo} className="mt-5 space-y-4">
          <input type="hidden" name="disputeId" value={disputeId} />
          <input type="hidden" name="next" value={next} />
          <Textarea
            name="question"
            label="Pertanyaan"
            placeholder="Tanyakan bukti atau kronologi yang kamu butuhkan…"
            rows={3}
            maxLength={500}
            required
          />
          <Select name="target" label="Ditujukan ke" defaultValue="both">
            <option value="both">Kedua pihak</option>
            <option value="umkm">UMKM</option>
            <option value="influencer">Kreator</option>
          </Select>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">
              <HelpCircle className="h-4 w-4" /> Kirim Pertanyaan
            </Button>
            <Button type="button" variant="ghost" onClick={() => arm("MINTA_INFO")}>
              Batal
            </Button>
          </div>
        </form>
      ) : armed ? (
        <form action={decideDispute} className="mt-5 space-y-4">
          <input type="hidden" name="disputeId" value={disputeId} />
          <input type="hidden" name="next" value={next} />
          <input
            type="hidden"
            name="decision"
            value={MONEY_DECISION[armed as Exclude<Mode, "MINTA_INFO">]}
          />

          {armed === "BAGI_DANA" && (
            <div className="rounded-2xl border border-warning-200 bg-warning-50/60 p-4">
              <label
                htmlFor="bagi-persen"
                className="mb-1.5 block text-sm font-semibold leading-5 text-neutral-700"
              >
                Porsi kreator (%)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="bagi-persen"
                  name="percent"
                  type="number"
                  min={0}
                  max={100}
                  value={persen}
                  onChange={(e) =>
                    setPersen(
                      Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    )
                  }
                  className="h-11 w-24 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <p className="text-sm text-neutral-600">
                  Kreator {formatRupiah(Math.round(nominal * (persen / 100)))} ·
                  UMKM{" "}
                  {formatRupiah(Math.round(nominal * ((100 - persen) / 100)))}
                </p>
              </div>
            </div>
          )}

          <Textarea
            name="note"
            label="Alasan Keputusan"
            placeholder="Jelaskan pertimbanganmu untuk keputusan ini…"
            rows={3}
            maxLength={500}
            required
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4" /> Catat Keputusan
            </Button>
            <Button type="button" variant="ghost" onClick={() => arm(armed)}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      <p className="mt-5 flex items-start gap-2 text-xs text-neutral-500">
        <LifeBuoy className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Setelah {bookingKode} diputuskan, kasus tidak bisa diubah dan dana yang
        ditahan diselesaikan sesuai keputusan. Kedua pihak dapat memberi ulasan.
      </p>
    </div>
  );
}
