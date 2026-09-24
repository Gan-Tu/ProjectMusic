import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import NotificationList from "./NotificationList";

// Activity / notifications dropdown (globe icon in the header).
export default function ActivityMenu() {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <Popover className="relative flex h-full items-center">
      <PopoverButton
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="group relative flex items-center text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-pmred focus-visible:ring-offset-4 transition hover:text-pmred data-open:text-pmred"
      >
        <GlobeAltIcon className="h-6 w-6 transition group-hover:scale-110" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-pmred" />
        )}
      </PopoverButton>
      <PopoverPanel
        transition
        anchor="bottom end"
        className="z-[60] w-[22rem] bg-white shadow-2xl ring-1 ring-black/5 transition duration-200 ease-out [--anchor-gap:1.25rem] data-closed:translate-y-1 data-closed:opacity-0"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <span className="text-xs font-bold uppercase tracking-wider">Notifications</span>
          <button
            type="button"
            onClick={actions.markNotificationsRead}
            disabled={!unread}
            className="text-2xs font-semibold uppercase tracking-wider text-pmred disabled:text-neutral-300"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-[26rem] overflow-y-auto">
          <CloseButton as="div">
            <NotificationList />
          </CloseButton>
        </div>
        <CloseButton
          onClick={() => openModal("notifications")}
          className="block w-full border-t border-neutral-200 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-pmred"
        >
          View all
        </CloseButton>
      </PopoverPanel>
    </Popover>
  );
}
