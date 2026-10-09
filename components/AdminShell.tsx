import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { getAdminAttention } from "@/lib/data/disputes";
import { DashboardShell } from "./DashboardShell";

/**
 * AdminShell (ARCHITECTURE §5): frame dashboard admin — guard role admin,
 * notifications and the queue badge derived from the real disputes rather than
 * a fixture. Profil mengarah ke /admin/profile (Profile Saya + Logout).
 */
export async function AdminShell({ children }: { children: ReactNode }) {
  const admin = await requireRole("admin");
  const attention = await getAdminAttention();

  return (
    <DashboardShell
      role="admin"
      userName={admin.fullName}
      notifications={attention.items}
      attentionCount={attention.attentionCount}
      openCasesCount={attention.openCasesCount}
      profileHref="/admin/profile"
      notificationHref="/admin/kasus"
      notificationFooterLabel="Lihat Antrian Kasus"
    >
      {children}
    </DashboardShell>
  );
}
