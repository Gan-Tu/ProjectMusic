import Image from "next/image";
import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useStore, visibleChats } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames } from "../lib/format";

export function lastMessage(chat) {
  return chat.messages[chat.messages.length - 1];
}

// Messages dropdown (envelope icon with the unread counter).
export default function MessagesMenu() {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const chats = visibleChats(state);
  const unread = chats.reduce((sum, c) => sum + c.unread, 0);

  function openChat(chatId) {
    actions.markChatRead(chatId);
    openModal("chat", { chatId });
  }

  return (
    <Popover className="relative flex h-full items-center">
      <PopoverButton
        aria-label={`Messages${unread ? ` (${unread} unread)` : ""}`}
        className="group relative flex items-center text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-pmred focus-visible:ring-offset-4 transition hover:text-pmred data-open:text-pmred"
      >
        <EnvelopeIcon className="h-6 w-6 transition group-hover:scale-110" />
        {unread > 0 && (
          <span className="absolute -right-3 -top-2.5 min-w-5 rounded-full bg-pmred px-1.5 text-center text-2xs font-bold leading-5 text-white">
            {unread}
          </span>
        )}
      </PopoverButton>
      <PopoverPanel
        transition
        anchor="bottom end"
        className="z-[60] w-[22rem] bg-white shadow-2xl ring-1 ring-black/5 transition duration-200 ease-out [--anchor-gap:1.25rem] data-closed:translate-y-1 data-closed:opacity-0"
      >
        <div className="border-b border-neutral-200 px-5 py-3 text-xs font-bold uppercase tracking-wider">
          Messages
        </div>
        <ul className="max-h-[26rem] divide-y divide-neutral-200 overflow-y-auto">
          {chats.map((chat) => {
            const last = lastMessage(chat);
            return (
              <li key={chat.id}>
                <CloseButton
                  onClick={() => openChat(chat.id)}
                  className="group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-pmred"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden">
                    <Image src={chat.avatar} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-pmred group-hover:text-white">
                        {chat.name}
                      </span>
                      {chat.unread > 0 && (
                        <span className="rounded-full bg-pmred px-1.5 text-2xs font-bold text-white group-hover:bg-white group-hover:text-pmred">
                          {chat.unread}
                        </span>
                      )}
                    </span>
                    <span
                      className={classNames(
                        "truncate text-sm group-hover:text-white",
                        chat.unread ? "text-neutral-800" : "font-light text-neutral-500"
                      )}
                    >
                      {last
                        ? `${last.from === "me" ? "You: " : ""}${last.text}`
                        : "No messages yet"}
                    </span>
                    <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-white/80">
                      {last ? last.time || "Just now" : "New"}
                    </span>
                  </span>
                </CloseButton>
              </li>
            );
          })}
        </ul>
        <CloseButton
          onClick={() => openModal("chat")}
          className="block w-full border-t border-neutral-200 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-pmred"
        >
          Open inbox
        </CloseButton>
      </PopoverPanel>
    </Popover>
  );
}
