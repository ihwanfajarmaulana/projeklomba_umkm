import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export type KpiAccent = "primary" | "success" | "warning" | "error" | "info";

const ACCENTS: Record<KpiAccent, string> = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  error: "bg-error-50 text-error-600",
  info: "bg-info-50 text-info-600",
};

/**
 * KpiCard (DESIGN_SYSTEM §10.7, ARCHITECTURE §3.4/§4.4/§5.6):
 * label + nilai + hint + ikon semantik, opsional tautan filter.
 * Hanya presentasional — nilai dihitung oleh halaman.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
  href,
  hrefLabel = "Lihat",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: KpiAccent;
  /** tautan opsional (mis. halaman dengan filter tertentu) */
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="type-table-head uppercase text-neutral-500">
          {label}
        </p>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ACCENTS[accent]}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="type-metric font-head mt-3 text-neutral-900">
        {value}
      </p>
      {hint && <p className="type-caption mt-1 text-neutral-500">{hint}</p>}
      {href && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800"
        >
          {hrefLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}