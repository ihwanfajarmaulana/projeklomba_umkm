"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { UmkmNotification } from "@/lib/types";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";

/**
 * DashboardHeader (ARCHITECTURE §1.2): judul halaman, bell notifikasi,
 * dan entry profil — bisa dipakai untuk role mana pun.
 */
export function DashboardHeader({
  title,
  userName,
  notifications,
  attentionCount,
  profileHref,
  logoHref = "/dashboard",
  notificationHref = "/dashboard/riwayat",
  notificationFooterLabel,
  onOpenMenu,
}: {
  title: string;
  userName: string;
  notifications: UmkmNotification[];
  attentionCount: number;
  profileHref: string;
  logoHref?: string;
  /** tautan footer bell notifikasi (berbeda per role) */
  notificationHref?: string;
  /** label tautan footer bell notifikasi */
  notificationFooterLabel?: string;
  onOpenMenu?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex justify-center border-b border-neutral-200 bg-neutral-0/90 backdrop-blur-md">
      <div className="mx-6 flex h-16 flex-1 items-center gap-3">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-200 text-neutral-700 transition-colors hover:border-primary-300 lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link
          href={logoHref}
          className="shrink-0 lg:hidden"
          aria-label="Kolab.id - Dashboard"
        >
          <Logo />
        </Link>
        <h1 className="type-page-title font-head hidden min-w-0 flex-1 truncate text-neutral-900 lg:block">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-2.5">
          <NotificationBell
            items={notifications}
            attentionCount={attentionCount}
            footerHref={notificationHref}
            footerLabel={notificationFooterLabel}
          />
          <ProfileMenu userName={userName} profileHref={profileHref} />
        </div>
      </div>
    </header>
  );
}