import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";

export type TableColumn<T> = {
  key: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  cell: (row: T) => ReactNode;
};

/**
 * DataTable (ARCHITECTURE §3.6/§4.6/§5.7): kolom + sel status + baris aksi
 * + state kosong. Generik dan presentasional; seleksi/aksi ditangani halaman.
 * `isLate` menandai baris yang lewat batas (mis. kasus Terlambat).
 */
export function DataTable<T>({
  columns,
  rows,
  keyOf,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  isLate,
  className = "",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  keyOf: (row: T) => string | number;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** baris yang dianggap terlambat (bolak-balik prop, bukan state) */
  isLate?: (row: T) => boolean;
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 shadow-xs ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="type-table w-full min-w-[680px] text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`type-table-head whitespace-nowrap px-5 py-3 uppercase text-neutral-500 ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => {
              const late = isLate?.(row) ?? false;
              return (
                <tr
                  key={keyOf(row)}
                  aria-live="polite"
                  className={`transition-colors hover:bg-neutral-50/70 ${
                    late ? "bg-warning-50/40" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-4 align-middle ${col.cellClassName ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}