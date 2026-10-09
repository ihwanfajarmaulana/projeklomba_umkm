"use client";

import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChatList, ChatThread, ChatInput } from "@/components/chat";
import type { ChatConversation, ChatMessage, ChatState } from "@/components/chat";
import { markChatRead, sendMessage } from "@/app/actions";

type OptimisticUpdate = { conversationId: string; message: ChatMessage };

/**
 * ChatClient — halaman chat UMKM (ARCHITECTURE §2.7). Satu percakapan per
 * booking; state per status: open (PENDING..DISPUTED), readonly
 * (COMPLETED/CANCELLED), closed (REJECTED). Kirim pesan memanggil Server Action
 * `sendMessage` dan tersimpan di `messages`; `markChatRead` membersihkan badge
 * saat percakapan dibuka.
 */
export function ChatClient({
  conversations,
  messages,
  userName,
}: {
  conversations: ChatConversation[];
  /** kunci = conversation.id → isi pesan */
  messages: Record<string, ChatMessage[]>;
  userName: string;
}) {
  const [activeId, setActiveId] = useState(
    conversations[0]?.id ?? "",
  );
  const [, startTransition] = useTransition();

  // Entri dikirim langsung tampil lewat optimistic update; begitu Server Action
  // selesai dan revalidate mengirim data baru, optimistic ini dilepas dan diganti
  // baris `messages` yang sebenarnya.
  const [threads, addOptimistic] = useOptimistic(
    messages,
    (current: Record<string, ChatMessage[]>, update: OptimisticUpdate) => ({
      ...current,
      [update.conversationId]: [
        ...(current[update.conversationId] ?? []),
        update.message,
      ],
    }),
  );

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  const activeMessages = active ? threads[active.id] ?? [] : [];
  const state: ChatState = active?.state ?? "closed";

  // Membuka percakapan menandai pesan pihak lawan sebagai dibaca. Kunci pada
  // id percakapan supaya hanya sekali per pemilihan.
  const markedRef = useRef<string>("");
  useEffect(() => {
    if (!active || markedRef.current === active.id) return;
    markedRef.current = active.id;
    const formData = new FormData();
    formData.set("bookingId", String(active.bookingId));
    startTransition(() => {
      void markChatRead(formData);
    });
  }, [active, startTransition]);

  const send = (text: string) => {
    if (!active) return;
    const conversationId = active.id;
    const message: ChatMessage = {
      id: `${conversationId}-local-${Date.now()}`,
      side: "me",
      senderName: userName,
      text,
      time: "Baru saja",
    };

    const formData = new FormData();
    formData.set("bookingId", String(active.bookingId));
    formData.set("body", text);
    startTransition(async () => {
      addOptimistic({ conversationId, message });
      await sendMessage(formData);
    });
  };

  return (
    <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 shadow-xs lg:grid-cols-[320px_1fr]">
      <div className="border-b border-neutral-100 lg:border-b-0 lg:border-r">
        <ChatList
          conversations={conversations}
          activeId={active?.id}
          onSelect={setActiveId}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-sm font-bold text-neutral-0">
                {active.partnerInitial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-900">
                  {active.partnerName}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {active.unread > 0
                    ? `${active.unread} pesan belum dibaca`
                    : "Percakapan kolaborasi"}
                </p>
              </div>
            </div>
            <ChatThread messages={activeMessages} state={state} />
            <ChatInput
              state={state}
              onSubmit={send}
              placeholder="Tulis pesan untuk kreator…"
            />
          </>
        ) : (
          <p className="p-10 text-center text-sm text-neutral-500">
            Pilih percakapan untuk mulai.
          </p>
        )}
      </div>
    </div>
  );
}
