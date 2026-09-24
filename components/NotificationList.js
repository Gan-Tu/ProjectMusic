import Image from "./ui/SmartImage";
import Link from "next/link";
import {
  BellIcon,
  EnvelopeIcon,
  GiftIcon,
  ShoppingBagIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames, timeAgo } from "../lib/format";
import { useNow } from "../lib/useNow";

const TYPE_ICONS = {
  message: EnvelopeIcon,
  gift: GiftIcon,
  shop: ShoppingBagIcon,
  trophy: TrophyIcon
};

// Renders `text` with its `highlight` phrase in red, like the mock's activity feed.
function Highlighted({ notification }) {
  const { actor, text, highlight } = notification;
  if (actor) {
    return (
      <>
        <span className="text-pmred">{actor}</span> {text}
      </>
    );
  }
  if (!highlight || !text.includes(highlight)) return text;
  const [before, ...rest] = text.split(highlight);
  return (
    <>
      {before}
      <span className="font-semibold text-pmred">{highlight}</span>
      {rest.join(highlight)}
    </>
  );
}

export default function NotificationList({ onNavigate, limit }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const items = limit ? state.notifications.slice(0, limit) : state.notifications;
  const now = useNow(); // keeps "5 minutes ago" labels current

  if (!items.length) {
    return (
      <p className="px-6 py-10 text-center text-sm text-neutral-500">You&apos;re all caught up.</p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {items.map((n) => {
        const Icon = TYPE_ICONS[n.type] || BellIcon;
        const body = (
          <>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-pmred group-hover:text-white">
              {n.image ? (
                <Image src={n.image} alt="" fill sizes="40px" className="object-cover" />
              ) : (
                <Icon className="h-7 w-7" />
              )}
            </span>
            <span className="flex min-w-0 flex-col gap-1 text-left">
              <span className="text-sm font-light leading-snug text-neutral-700 group-hover:text-white [&_span]:group-hover:text-white">
                <Highlighted notification={n} />
              </span>
              <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-500 group-hover:text-white/80">
                {n.label || timeAgo(n.at, now || undefined)}
              </span>
            </span>
            {!n.read && (
              <span
                className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-pmred group-hover:bg-white"
                aria-label="Unread"
              />
            )}
          </>
        );
        const classes = classNames(
          "group flex w-full items-start gap-4 px-5 py-4 transition-colors hover:bg-pmred"
        );
        return (
          <li key={n.id} className="group/item relative">
            {n.href ? (
              <Link
                href={n.href}
                onClick={() => {
                  actions.markNotificationRead(n.id);
                  onNavigate?.();
                }}
                className={classes}
              >
                {body}
              </Link>
            ) : (
              <button
                type="button"
                className={classes}
                onClick={() => {
                  actions.markNotificationRead(n.id);
                  onNavigate?.();
                  if (n.action) openModal(n.action);
                }}
              >
                {body}
              </button>
            )}
            <button
              type="button"
              onClick={() => actions.dismissNotification(n.id)}
              aria-label="Dismiss notification"
              title="Dismiss"
              className="absolute right-2 top-2 rounded-full p-1 text-neutral-500 opacity-0 transition hover:bg-white hover:text-pmred focus-visible:opacity-100 group-hover/item:opacity-100"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
