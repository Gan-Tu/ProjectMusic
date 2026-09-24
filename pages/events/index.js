import { useState } from "react";
import AppContainer from "../../components/AppContainer";
import EventCard from "../../components/events/EventCard";
import { classNames } from "../../lib/format";
import { getEvents } from "../../utils/getFakeEvents";

export default function EventsHome({ eventData }) {
  const [month, setMonth] = useState(null);
  const [city, setCity] = useState("All cities");
  const cities = [...new Set(eventData.map((event) => event.city))];
  const filtered = eventData.filter(
    (event) =>
      (!month || event.date.startsWith(month)) && (city === "All cities" || event.city === city)
  );
  function selectThisMonth() {
    const now = new Date();
    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <AppContainer
      title="Events"
      curMenu="Events"
      description="Live shows, intimate sessions, and nights with the Projct Music community."
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
          <h1 className="sr-only">Events</h1>
          <button
            type="button"
            onClick={() => setMonth(null)}
            aria-pressed={!month}
            className={classNames(
              "cursor-pointer py-2",
              !month ? "text-pmred" : "text-neutral-500"
            )}
          >
            All events
          </button>
          <button
            type="button"
            onClick={selectThisMonth}
            aria-pressed={!!month}
            className={classNames("cursor-pointer py-2", month ? "text-pmred" : "text-neutral-500")}
          >
            This month
          </button>
        </div>
        <label className="flex items-center gap-3 text-xs text-neutral-500">
          City
          <select
            aria-label="Filter by city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="cursor-pointer rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-900"
          >
            <option>All cities</option>
            {cities.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
      {!filtered.length && (
        <div className="px-6 py-24 text-center">
          <p className="text-sm text-neutral-500">
            No shows match these filters. More good nights are on the way.
          </p>
          <button
            type="button"
            onClick={() => {
              setMonth(null);
              setCity("All cities");
            }}
            className="mt-5 cursor-pointer text-xs font-bold uppercase tracking-widest text-pmred"
          >
            See all events
          </button>
        </div>
      )}
    </AppContainer>
  );
}

export async function getStaticProps() {
  return { props: { eventData: getEvents() } };
}
