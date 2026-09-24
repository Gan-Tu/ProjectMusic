import Link from "next/link";
import { ClockIcon } from "@heroicons/react/24/outline";
import { formatLongDate, pad2, formatUSD } from "../../lib/format";
import { InterestedButton, TicketButton } from "./EventActions";

export default function EventCard({ event }) {
  return (
    <article className="group flex h-full flex-col border-b border-r border-neutral-200 py-7 transition-colors duration-200 hover:bg-pmred focus-within:bg-pmred">
      <div className="flex items-start justify-between px-6">
        <span
          aria-hidden="true"
          className="text-7xl font-extralight leading-none tracking-tighter text-neutral-200 group-hover:text-white/80 group-focus-within:text-white/80"
        >
          {pad2(event.day)}
        </span>
        <div className="pt-1 text-right">
          <time
            dateTime={event.startsAt}
            className="text-[9px] font-bold uppercase tracking-wider group-hover:text-white group-focus-within:text-white"
          >
            {formatLongDate(event.date)}
          </time>
          <p className="mt-1 flex items-center justify-end gap-1.5 text-xs font-bold group-hover:text-white group-focus-within:text-white">
            <ClockIcon className="h-4 w-4 text-pmred group-hover:text-white group-focus-within:text-white" />
            {event.time}
          </p>
        </div>
      </div>
      <Link
        href={`/events/${event.id}`}
        className="relative ml-6 mt-[-8px] flex min-h-24 cursor-pointer items-center bg-white px-5 py-4 text-pmred transition-colors group-hover:bg-black group-hover:text-white group-focus-within:bg-black group-focus-within:text-white"
      >
        <h2 className="text-xl font-extrabold uppercase leading-tight tracking-tight">
          {event.title}
        </h2>
      </Link>
      <div className="mx-8 my-5 flex-1 border-y border-neutral-200 py-6 group-hover:border-white/30 group-focus-within:border-white/30">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide group-hover:text-white group-focus-within:text-white">
          {event.name}
        </p>
        <address className="text-xs font-light not-italic leading-6 text-neutral-500 group-hover:text-white/80 group-focus-within:text-white/80">
          {event.address.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </address>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-white/80 group-focus-within:text-white/80">
          From {formatUSD(event.price)}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 px-6">
        <TicketButton
          event={event}
          className="group-hover:border-white group-hover:bg-white group-focus-within:border-white group-focus-within:bg-white"
        />
        <InterestedButton
          event={event}
          className="text-pmred group-hover:text-white group-focus-within:text-white"
        />
      </div>
    </article>
  );
}
