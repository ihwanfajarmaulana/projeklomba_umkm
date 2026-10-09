/**
 * Tipe bersama kit chat (ARCHITECTURE §2.7). Presentasional: data dikirim
 * dari halaman via prop; komponen tidak mengambil data sendiri.
 */

/** Open: PENDING..DISPUTED · Read-only: COMPLETED/CANCELLED · Closed: REJECTED */
export type ChatState = "open" | "readonly" | "closed";

export type ChatMessage = {
  id: string;
  /** arah pesan relatif ke pengguna yang melihat */
  side: "me" | "other";
  senderName: string;
  text: string;
  time: string;
};

export type ChatConversation = {
  id: string;
  /** Booking the thread belongs to; the write target when sending. */
  bookingId: number;
  partnerName: string;
  partnerInitial: string;
  lastMessage: string;
  time: string;
  unread: number;
  state: ChatState;
};

export const CHAT_STATE_LABEL: Record<ChatState, string> = {
  open: "Terbuka",
  readonly: "Read only",
  closed: "Tertutup",
};