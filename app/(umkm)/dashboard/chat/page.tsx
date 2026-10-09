import { getBookingsByUmkm } from "@/lib/data/bookings";
import { getChatMessagesForBookings } from "@/lib/data/chat";
import type { ChatMessageRecord } from "@/lib/data/chat";
import type { Metadata } from "next";
import { requireUmkm } from "@/lib/auth";

import { formatDate, formatDateTime, initials } from "@/lib/format";
import type { ChatConversation, ChatMessage, ChatState } from "@/components/chat";
import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description: "Diskusi langsung dengan kreator di Kolab.id.",
};

/** State chat per status booking (ARCHITECTURE §2.7). */
function chatStateOf(status: string): ChatState {
  switch (status) {
    case "COMPLETED":
    case "CANCELLED":
      return "readonly";
    case "REJECTED":
      return "closed";
    default:
      return "open"; // PENDING..DISPUTED
  }
}

export default async function ChatPage() {
  const account = await requireUmkm();

  const bookings = await getBookingsByUmkm(account.umkmId);
  const records = await getChatMessagesForBookings(bookings.map((b) => b.id));

  // Satu percakapan per booking (§2.7) dengan pihak lawan = kreator. Pesan dibaca
  // dari `messages` lewat RLS party-scoped; badge unread = pesan lawan yang
  // belum ditandai baca.
  const byBooking = new Map<number, ChatMessageRecord[]>();
  for (const record of records) {
    const thread = byBooking.get(record.bookingId) ?? [];
    thread.push(record);
    byBooking.set(record.bookingId, thread);
  }

  const conversations: ChatConversation[] = bookings.map((b) => {
    const thread = byBooking.get(b.id) ?? [];
    const last = thread[thread.length - 1];
    const unread = thread.filter(
      (m) => m.senderId !== account.userId && m.readAt === null,
    ).length;
    return {
      id: `booking-${b.id}`,
      bookingId: b.id,
      partnerName: b.influencerName,
      partnerInitial: initials(b.influencerName),
      lastMessage: last?.body ?? "Belum ada pesan",
      time: formatDate(last?.sentAt ?? b.createdAt),
      unread,
      state: chatStateOf(b.status),
    };
  });

  const messages: Record<string, ChatMessage[]> = {};
  for (const b of bookings) {
    const thread = byBooking.get(b.id) ?? [];
    messages[`booking-${b.id}`] = thread.map((m) => {
      const mine = m.senderId === account.userId;
      return {
        id: String(m.id),
        side: mine ? "me" : "other",
        senderName: mine ? account.fullName : b.influencerName,
        text: m.body,
        time: formatDateTime(m.sentAt),
      };
    });
  }

  return (
    <>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-700">
          Chat
        </p>
        <h1 className="mt-1 font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Chat dengan Kreator
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Diskusi brief dan progres langsung di satu tempat.
        </p>
      </div>

      <div className="mt-8">
        <ChatClient
          conversations={conversations}
          messages={messages}
          userName={account.fullName}
        />
      </div>
    </>
  );
}
