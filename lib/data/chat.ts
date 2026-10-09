import { createClient } from "@/utils/supabase/server";

/**
 * Chat reads, on Postgres.
 *
 * `conversations` and `messages` carry the party-scoped policies added by
 * `20261007140000_chat.sql`, so this reads through the caller's user-scoped
 * client and lets the policy decide. A booking that is not the caller's comes
 * back as no rows, never as an error - an RLS-hidden row is an empty `200`.
 *
 * The two queries are split rather than joined because messages has no
 * `booking_id` of its own: conversations resolve the booking, then the messages
 * resolve the conversation. Both are still filtered by RLS independently.
 */

/** A raw message row, plus the booking it belongs to, ready to be mapped. */
export type ChatMessageRecord = {
  id: number;
  conversationId: number;
  bookingId: number;
  senderId: string;
  body: string;
  sentAt: string;
  readAt: string | null;
};

type ConversationRow = { id: number; booking_id: number };
type MessageRow = {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string;
  sent_at: string;
  read_at: string | null;
};

/**
 * Every message on the given bookings, oldest first. One call per page load;
 * the caller groups by `bookingId` for display.
 */
export async function getChatMessagesForBookings(
  bookingIds: number[],
): Promise<ChatMessageRecord[]> {
  if (bookingIds.length === 0) return [];

  const supabase = createClient();
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("id, booking_id")
    .in("booking_id", bookingIds);

  if (convError) {
    console.error(
      `[chat] getChatMessagesForBookings failed: ${convError.message}`,
    );
    return [];
  }

  const bookingByConversation = new Map<number, number>();
  for (const row of (conversations as ConversationRow[] | null) ?? []) {
    bookingByConversation.set(row.id, row.booking_id);
  }

  const conversationIds = [...bookingByConversation.keys()];
  if (conversationIds.length === 0) return [];

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, sent_at, read_at")
    .in("conversation_id", conversationIds)
    .order("sent_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(
      `[chat] getChatMessagesForBookings failed: ${error.message}`,
    );
    return [];
  }

  return ((messages as MessageRow[] | null) ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    bookingId: bookingByConversation.get(row.conversation_id) ?? 0,
    senderId: row.sender_id,
    body: row.body,
    sentAt: row.sent_at,
    readAt: row.read_at,
  }));
}
