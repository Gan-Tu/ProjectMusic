import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useStore, visibleChats } from "../lib/store";
import { useUI } from "../lib/ui";
import { useSessionContext } from "../lib/SessionProvider";

// "Pop up messaging" setting: announce new chat replies while the chat is closed.
export default function MessagePopups() {
  const { state } = useStore();
  const { activeModal, openModal } = useUI();
  const [session] = useSessionContext();
  const loggedIn = Boolean(session.user);
  const seen = useRef(null);

  useEffect(() => {
    if (!state.hydrated) return;
    const incoming = visibleChats(state).flatMap((chat) =>
      chat.messages.filter((m) => m.from === "them").map((m) => ({ chat, message: m }))
    );
    // The first pass after loading only records what's already there.
    if (seen.current === null) {
      seen.current = new Set(incoming.map(({ message }) => message.id));
      return;
    }
    for (const { chat, message } of incoming) {
      if (seen.current.has(message.id)) continue;
      seen.current.add(message.id);
      if (!loggedIn || !state.settings.popupMessaging || activeModal === "chat") continue;
      toast(
        (t) => (
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              openModal("chat", { chatId: chat.id });
            }}
            className="text-left"
          >
            <span className="block text-2xs font-bold uppercase tracking-wider text-pmred">
              {chat.name}
            </span>
            <span className="block text-sm text-neutral-700">{message.text}</span>
          </button>
        ),
        { duration: 5000 }
      );
    }
  }, [state, activeModal, openModal, loggedIn]);

  return null;
}
