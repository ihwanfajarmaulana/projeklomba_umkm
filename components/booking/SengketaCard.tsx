import { CheckCircle2, Clock, HelpCircle, Scale } from "lucide-react";

import { Button } from "@/components/Button";
import { Textarea } from "@/components/Textarea";
import { answerDisputeInfo } from "@/app/actions";
import { formatDateTime } from "@/lib/format";
import type { BookingDispute } from "@/lib/data/disputes";
import type { PartyRole } from "@/lib/types";

import { SectionCard } from "./SectionCard";

/**
 * The dispute half of a booking detail page, shown to either party.
 *
 * A party reads the case through `disputes_party_read` / `dispute_infos_party_read`.
 * The operator's questions are answered here, and the answer is the reason the
 * case leaves NEED_INFO; the decision is read-only. Rendering only - the
 * database decides who may answer which question.
 */

const STATUS_LABEL: Record<BookingDispute["status"], string> = {
  OPEN: "Menunggu keputusan admin",
  NEED_INFO: "Menunggu jawaban informasi",
  RESOLVED: "Sengketa selesai",
};

const STATUS_TONE: Record<BookingDispute["status"], string> = {
  OPEN: "bg-warning-50 text-warning-700 ring-warning-200",
  NEED_INFO: "bg-primary-50 text-primary-700 ring-primary-200",
  RESOLVED: "bg-success-50 text-success-700 ring-success-200",
};

const DECISION_LABEL: Record<string, string> = {
  RELEASE_FULL: "Dana dicairkan penuh ke kreator",
  REFUND_FULL: "Dana dikembalikan penuh ke UMKM",
  SPLIT: "Dana dibagi antara kreator dan UMKM",
};

export function SengketaCard({
  dispute,
  perspective,
  bookingId,
  next,
}: {
  dispute: BookingDispute;
  perspective: PartyRole;
  bookingId: number;
  next: string;
}) {
  return (
    <SectionCard title="Sengketa" icon={Scale}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${STATUS_TONE[dispute.status]}`}
          >
            {STATUS_LABEL[dispute.status]}
          </span>
          <span className="font-mono text-xs text-neutral-500">
            {dispute.code}
          </span>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Dibuka oleh {dispute.openedBy === "umkm" ? "UMKM" : "kreator"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-800">
            {dispute.reason}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            {dispute.status === "RESOLVED"
              ? `Selesai ${formatDateTime(dispute.decidedAt ?? dispute.dueAt)}`
              : `Batas keputusan ${formatDateTime(dispute.dueAt)}`}
          </p>
        </div>

        {dispute.status === "RESOLVED" && dispute.decision && (
          <div className="rounded-xl border border-success-200 bg-success-50/60 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-success-900">
              <CheckCircle2 className="h-4 w-4" />
              {DECISION_LABEL[dispute.decision]}
              {dispute.decision === "SPLIT" &&
                dispute.creatorSharePercent !== null && (
                  <span className="font-medium text-success-700">
                    ({dispute.creatorSharePercent}% kreator /{" "}
                    {100 - dispute.creatorSharePercent}% UMKM)
                  </span>
                )}
            </p>
            {dispute.decisionNote && (
              <p className="mt-1 text-sm text-success-700">
                “{dispute.decisionNote}”
              </p>
            )}
          </div>
        )}

        {dispute.infos.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Tanya jawab admin
            </p>
            {dispute.infos.map((info) => {
              const mine = info.targetRole === perspective;
              return (
                <div
                  key={info.id}
                  className="rounded-xl border border-neutral-100 bg-neutral-0 px-4 py-3"
                >
                  <p className="flex items-start gap-2 text-sm text-neutral-800">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                    <span>
                      <span className="font-semibold text-neutral-900">
                        Admin
                      </span>{" "}
                      ({info.targetRole === "umkm" ? "ke UMKM" : "ke kreator"}):{" "}
                      {info.question}
                    </span>
                  </p>

                  {info.answer ? (
                    <p className="mt-2 border-l-2 border-neutral-200 pl-3 text-sm text-neutral-700">
                      <span className="font-semibold text-neutral-900">
                        Dijawab
                      </span>{" "}
                      · {info.answer}
                    </p>
                  ) : mine ? (
                    <form action={answerDisputeInfo} className="mt-3 space-y-2">
                      <input type="hidden" name="bookingId" value={bookingId} />
                      <input type="hidden" name="infoId" value={info.id} />
                      <input type="hidden" name="next" value={next} />
                      <Textarea
                        name="answer"
                        label="Jawaban kamu"
                        placeholder="Tulis jawaban untuk admin…"
                        rows={3}
                        required
                      />
                      <Button type="submit" size="sm">
                        Kirim Jawaban
                      </Button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs italic text-neutral-400">
                      Menunggu jawaban pihak lain.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
