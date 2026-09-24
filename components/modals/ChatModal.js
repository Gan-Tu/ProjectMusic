import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import { TabList, tabPanelProps } from "../ui/Tabs";
import { useStore, visibleChats } from "../../lib/store";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { classNames } from "../../lib/format";
import { getArtistHomePageData } from "../../utils/getFakeArtistsData";

function Avatar({ src, online, size = "h-10 w-10" }) {
  return (
    <span className={classNames("relative shrink-0", size)}>
      <span className="absolute inset-0 overflow-hidden bg-neutral-100">
        {src && <Image src={src} alt="" fill sizes="48px" className="object-cover" />}
      </span>
      {online !== undefined && (
        <span
          className={classNames(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
            online ? "bg-lime-500" : "bg-neutral-300"
          )}
        />
      )}
    </span>
  );
}

// Messenger from the mock's chat pop-ups: conversations / friends on the left,
// the thread on the right (stacked on small screens).
export default function ChatModal({ open, onClose, chatId: initialChatId }) {
  const { state, actions } = useStore();
  const [tab, setTab] = useState("chats");
  const [activeId, setActiveId] = useState(initialChatId || null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const threadRef = useRef(null);

  const chats = visibleChats(state);
  const active = chats.find((c) => c.id === activeId) || null;
  const friends = useMemo(() => getArtistHomePageData().slice(0, 24), []);

  const q = query.trim().toLowerCase();
  const matchingChats = chats.filter((c) => c.name.toLowerCase().includes(q));
  const visibleFriends = friends.filter((f) => f.name.toLowerCase().includes(q));

  // Replies count as read only while the conversation is on screen: phones hide it
  // behind the Friends tab (from md up, list and conversation sit side by side).
  const sideBySide = useMediaQuery("(min-width: 48rem)");
  const conversationShown = tab === "chats" || sideBySide;

  // Keep the newest message in view, including when a hidden conversation comes back.
  const messageCount = active?.messages.length || 0;
  useEffect(() => {
    const el = threadRef.current;
    if (el && conversationShown) el.scrollTop = el.scrollHeight;
  }, [activeId, messageCount, conversationShown]);
  useEffect(() => {
    if (open && conversationShown && activeId && active?.unread) actions.markChatRead(activeId);
  }, [open, conversationShown, activeId, active?.unread, actions]);

  function openChat(id) {
    setActiveId(id);
    setDraft("");
  }

  function startWith(friend) {
    const id = friend.id; // canonical: same id as seeded chats and artist pages
    actions.startChat({ id, name: friend.name, avatar: friend.imgUrl });
    setTab("chats");
    openChat(id);
  }

  function send(e) {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    actions.sendMessage(active.id, draft);
    setDraft("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chat"
      size="xl"
      bodyClassName="p-0"
      headerExtra={
        <div className="flex items-center gap-2">
          <TabList
            idBase="chat"
            label="Conversations and friends"
            tabs={[
              { id: "chats", label: "Chats" },
              { id: "friends", label: "Friends" }
            ]}
            value={tab}
            onChange={setTab}
            className="flex items-center gap-2"
            tabClassName={(selected) =>
              classNames(
                "rounded-full border px-4 py-1 text-2xs font-bold uppercase tracking-wider transition",
                selected ? "border-neutral-300 text-neutral-500" : "border-transparent text-pmred"
              )
            }
          />
          <span className="ml-2 hidden text-2xs uppercase tracking-wider text-neutral-500 sm:inline">
            You appear {state.settings.availableToChat ? "online" : "offline"}
          </span>
        </div>
      }
    >
      <div className="grid h-[32rem] max-h-[75vh] grid-cols-1 md:grid-cols-[18rem_1fr]">
        <aside
          className={classNames(
            "flex min-h-0 flex-col border-r border-neutral-200",
            active && tab === "chats" && "hidden md:flex"
          )}
        >
          <div className="relative p-4">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-7 top-6.5 h-4 w-4 text-neutral-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "chats" ? "Search conversations" : "Search friends"}
              aria-label="Search"
              className="h-9 w-full rounded-full border border-neutral-200 pl-9 pr-3 text-xs focus:border-pmred focus:outline-none"
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto" {...tabPanelProps("chat", tab)}>
            {tab === "chats"
              ? matchingChats.map((chat) => {
                  const last = chat.messages[chat.messages.length - 1];
                  const selected = chat.id === activeId;
                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        onClick={() => openChat(chat.id)}
                        className={classNames(
                          "group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                          selected ? "bg-pmred text-white" : "hover:bg-neutral-50"
                        )}
                      >
                        <Avatar src={chat.avatar} online={chat.online} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={classNames(
                                "truncate text-sm font-medium",
                                !selected && "text-pmred"
                              )}
                            >
                              {chat.name}
                            </span>
                            <span
                              className={classNames(
                                "text-2xs",
                                selected ? "text-white" : "text-neutral-500"
                              )}
                            >
                              {last?.time || (last ? "Now" : "")}
                            </span>
                          </span>
                          <span
                            className={classNames(
                              "block truncate text-xs",
                              selected ? "text-white" : "text-neutral-500"
                            )}
                          >
                            {last
                              ? `${last.from === "me" ? "You: " : ""}${last.text}`
                              : "Say hi 👋"}
                          </span>
                        </span>
                        {chat.unread > 0 && !selected && (
                          <span className="rounded-full bg-pmred px-1.5 text-2xs font-bold text-white">
                            {chat.unread}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              : visibleFriends.map((friend, i) => (
                  <li key={friend.id}>
                    <button
                      type="button"
                      onClick={() => startWith(friend)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-pmred hover:text-white"
                    >
                      <Avatar src={friend.imgUrl} online={i % 3 !== 2} size="h-8 w-8" />
                      <span className="truncate">{friend.name}</span>
                    </button>
                  </li>
                ))}
          </ul>
        </aside>

        <section
          className={classNames(
            "flex min-h-0 flex-col",
            (!active || tab === "friends") && "hidden md:flex"
          )}
        >
          {active ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  aria-label="Back to conversations"
                  className="text-neutral-500 hover:text-pmred md:hidden"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <Avatar src={active.avatar} online={active.online} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.name}</p>
                  <p className="text-2xs uppercase tracking-wider text-neutral-500">
                    {active.online ? "Online" : "Offline"}
                  </p>
                </div>
                {confirmDelete === active.id ? (
                  <span className="flex basis-full items-center justify-end gap-3 text-xs text-neutral-600 sm:basis-auto">
                    Delete conversation?
                    <button
                      type="button"
                      autoFocus
                      onClick={() => {
                        actions.deleteChat(active.id);
                        setConfirmDelete(null);
                        setActiveId(null);
                        toast.success(`Conversation with ${active.name} deleted`);
                      }}
                      className="text-2xs font-bold uppercase tracking-wider text-pmred"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="text-2xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-800"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(active.id)}
                    aria-label={`Delete conversation with ${active.name}`}
                    title="Delete conversation"
                    className="rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-pmred"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div
                ref={threadRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-5 py-5"
              >
                {active.messages.length === 0 && (
                  <p className="pt-10 text-center text-xs text-neutral-500">
                    Start the conversation with {active.name}.
                  </p>
                )}
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={classNames(
                      "group flex items-center gap-2",
                      m.from === "me" ? "justify-end" : "justify-start"
                    )}
                  >
                    {m.from === "me" && (
                      <button
                        type="button"
                        onClick={() => actions.deleteMessage(active.id, m.id)}
                        aria-label="Delete message"
                        title="Delete message"
                        className="rounded-full p-1 text-neutral-500 opacity-0 transition hover:text-pmred focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                    <div
                      className={classNames(
                        "max-w-[75%] px-4 py-2.5 text-sm shadow-xs [overflow-wrap:anywhere]",
                        m.from === "me" ? "bg-pmred text-white" : "bg-white text-neutral-700"
                      )}
                    >
                      {m.text}
                      {m.time && (
                        <span
                          className={classNames(
                            "mt-1 block text-2xs",
                            m.from === "me" ? "text-white" : "text-neutral-500"
                          )}
                        >
                          {m.time}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={send}
                className="flex items-center gap-3 border-t border-neutral-200 p-4"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type here…"
                  aria-label="Message"
                  autoFocus
                  className="h-10 flex-1 rounded-full border border-neutral-200 px-4 text-sm focus:border-pmred focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex h-10 items-center gap-2 rounded-full bg-pmred px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-pmred-dark disabled:opacity-40"
                >
                  Send <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider">Your messages</p>
              <p className="max-w-xs text-xs text-neutral-500">
                Pick a conversation, or start a new one from your friends list.
              </p>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
