import Image from "../../components/ui/SmartImage";
import Link from "next/link";
import { ClockIcon, MapPinIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import { TicketButton, InterestedButton } from "../../components/events/EventActions";
import CalendarDownload from "../../components/events/CalendarDownload";
import CommentThread from "../../components/comments/CommentThread";
import { formatLongDate, formatUSD, formatCredits } from "../../lib/format";
import { getEvent } from "../../lib/server/content";

export default function EventDetail({ event }) {
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address.join(", "))}`;
  return (
    <AppContainer
      title={event.title}
      curMenu="Events"
      description={`${event.title} at ${event.address[0]}. Explore the lineup and get tickets.`}
    >
      <section className="relative isolate flex min-h-[420px] items-end bg-black text-white sm:min-h-[500px]">
        <Image
          src={event.image}
          alt={`Live concert atmosphere for ${event.title}`}
          fill
          preload
          sizes="100vw"
          className="object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
        <div className="relative w-full px-6 py-10 sm:px-12 sm:py-14">
          <Link
            href="/events"
            className="cursor-pointer text-2xs font-bold uppercase tracking-widest text-white/70 hover:text-white"
          >
            ← All events
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-pmred">
            Projct Music presents · {event.city}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-6xl">
            {event.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/80">
            <time dateTime={event.startsAt}>{formatLongDate(event.date)}</time>
            <span className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              {event.time} local time
            </span>
            <span className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              {event.address[0]}
            </span>
          </div>
        </div>
      </section>
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0 px-6 py-10 sm:px-12">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-neutral-200 pb-6">
            <InterestedButton event={event} className="text-pmred" />
            <CalendarDownload event={event} />
          </div>
          <h2 className="mt-8 text-xs font-bold uppercase tracking-[0.2em]">The night</h2>
          <p className="mt-4 max-w-xl text-sm font-light leading-7 text-neutral-500">
            {event.description}
          </p>
          {event.lineup.length > 0 && (
            <>
              <h2 className="mb-5 mt-10 text-xs font-bold uppercase tracking-[0.2em]">
                Featured lineup
              </h2>
              <ul className="grid grid-cols-3 gap-3">
                {event.lineup.map((artist) => (
                  <li key={artist.id}>
                    <Link href={`/artists/${artist.id}`} className="group block cursor-pointer">
                      <div className="relative aspect-square overflow-hidden bg-neutral-100">
                        <Image
                          src={artist.imgUrl}
                          alt={artist.name}
                          fill
                          sizes="(max-width: 1023px) 30vw, 15vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-3 text-2xs font-bold uppercase tracking-wider group-hover:text-pmred">
                        {artist.name}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="mb-5 mt-10 text-xs font-bold uppercase tracking-[0.2em]">The venue</h2>
          <div
            className="relative flex min-h-56 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100"
            style={{
              backgroundImage:
                "linear-gradient(35deg, transparent 45%, #fff 45%, #fff 51%, transparent 51%), linear-gradient(90deg, #e5e5e5 1px, transparent 1px), linear-gradient(#e5e5e5 1px, transparent 1px)",
              backgroundSize: "100% 100%, 40px 40px, 40px 40px"
            }}
          >
            <div className="relative m-6 bg-white p-6 text-center shadow-lg">
              <MapPinIcon className="mx-auto mb-3 h-7 w-7 text-pmred" />
              <p className="text-xs font-bold uppercase tracking-wider">{event.address[0]}</p>
              <address className="mt-2 text-xs not-italic leading-5 text-neutral-500">
                {event.address.slice(1).join(", ")}
              </address>
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex cursor-pointer items-center gap-2 text-2xs font-bold uppercase tracking-widest text-pmred"
              >
                Get directions <ArrowUpRightIcon className="h-3 w-3" />
              </a>
            </div>
          </div>
          <CommentThread
            threadId={`event:${event.id}`}
            title="Discussion"
            placeholder="Going? Say hi to the crew…"
            className="mt-12 border-t border-neutral-200 pt-8"
          />
        </div>
        <aside className="border-t border-neutral-200 bg-neutral-50 px-6 py-10 sm:px-12 lg:border-l lg:border-t-0">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Make it a night</h2>
          <p className="mt-3 text-sm font-light text-neutral-500">
            {event.tiers.length
              ? "Choose your ticket. Bring your people."
              : "Tickets go on sale soon. Mark yourself as interested to keep it on your radar."}
          </p>
          <ul className="mt-8 space-y-5">
            {event.tiers.map((tier) => (
              <li key={tier.name} className="border border-neutral-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider">{tier.name}</h3>
                  <span className="text-xl font-light text-pmred">{formatUSD(tier.price)}</span>
                </div>
                <p className="mt-3 text-xs leading-6 text-neutral-500">{tier.description}</p>
                <p className="mt-1 text-2xs text-neutral-500">
                  or {formatCredits(tier.credits)} credits
                </p>
                <TicketButton event={event} tier={tier} className="mt-6" />
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-6 text-neutral-500">
            Demo tickets only. Your selection is saved in your cart; no real booking or payment is
            made.
          </p>
        </aside>
      </div>
    </AppContainer>
  );
}

// Rendered on first request, so events created in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const event = await getEvent(params.id);
  if (!event) return { notFound: true, revalidate: 60 };
  return { props: { event }, revalidate: 60 };
}
