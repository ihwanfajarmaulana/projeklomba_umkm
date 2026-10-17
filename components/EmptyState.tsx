import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * EmptyState (DESIGN_SYSTEM §10.7, varian dashed): ikon + judul +
 * deskripsi + aksi opsional untuk daftar/konten kosong.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-0 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="type-section-title font-head mt-4 text-neutral-900">
        {title}
      </h3>
      {description && (
        <p className="type-table mt-1 max-w-sm text-neutral-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}