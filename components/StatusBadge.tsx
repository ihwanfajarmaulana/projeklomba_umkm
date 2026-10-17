/**
 * StatusBadge (DESIGN_SYSTEM §10.4): warna semantik + label Indonesia,
 * tidak pernah warna sendirian. Mencakup 9 status booking (ARCHITECTURE
 * §2.1) + 3 status kasus sengketa (§5.7). Radius pill.
 */
export type StatusKey =
  | "PENDING"
  | "ACCEPTED"
  | "APPROVED"
  | "FUNDED"
  | "SUBMITTED"
  | "REVISION"
  | "DISPUTED"
  | "COMPLETED"
  | "DONE"
  | "REJECTED"
  | "CANCELLED"
  | "OPEN"
  | "NEED_INFO"
  | "RESOLVED";

const STATUS_STYLES: Record<StatusKey, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu",
    className: "bg-warning-50 text-warning-700 ring-warning-100",
  },
  ACCEPTED: {
    label: "Menunggu Pembayaran",
    className: "bg-info-50 text-info-700 ring-info-100",
  },
  // Kode legacy mock (data layer belum dimigrasi ke 9 status penuh)
  APPROVED: {
    label: "Menunggu Pembayaran",
    className: "bg-info-50 text-info-700 ring-info-100",
  },
  FUNDED: {
    label: "Sedang Dikerjakan",
    className: "bg-primary-50 text-primary-700 ring-primary-100",
  },
  SUBMITTED: {
    label: "Menunggu Review",
    className: "bg-info-50 text-info-700 ring-info-100",
  },
  REVISION: {
    label: "Revisi",
    className: "bg-warning-50 text-warning-700 ring-warning-100",
  },
  DISPUTED: {
    label: "Sengketa",
    className: "bg-error-50 text-error-700 ring-error-100",
  },
  COMPLETED: {
    label: "Selesai",
    className: "bg-success-50 text-success-700 ring-success-100",
  },
  // Kode legacy mock
  DONE: {
    label: "Selesai",
    className: "bg-success-50 text-success-700 ring-success-100",
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-error-50 text-error-700 ring-error-100",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-neutral-200 text-neutral-700 ring-neutral-300",
  },
  OPEN: {
    label: "Dibuka",
    className: "bg-primary-50 text-primary-700 ring-primary-100",
  },
  NEED_INFO: {
    label: "Menunggu Info",
    className: "bg-warning-50 text-warning-700 ring-warning-100",
  },
  RESOLVED: {
    label: "Diputuskan",
    className: "bg-success-50 text-success-700 ring-success-100",
  },
};

export function StatusBadge({ status }: { status: StatusKey }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`type-badge inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}