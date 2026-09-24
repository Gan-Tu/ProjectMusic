// When and where each event happens, without the rest of the event catalog (artist
// line-ups etc.), so the cart and checkout can check a ticket's event time cheaply.

export const EVENTS = [
  {
    title: "Drake vs Lil Wayne",
    year: 2026,
    month: 9,
    day: 1,
    time: "07:00PM",
    name: "Drake vs Lil Wayne",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "Rihanna in Concert",
    year: 2026,
    month: 9,
    day: 7,
    time: "08:30PM",
    name: "Rihanna New Album",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "Little Dragon",
    year: 2026,
    month: 9,
    day: 15,
    time: "08:00PM",
    name: "World Tour 2026",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "MTV Awards",
    year: 2026,
    month: 9,
    day: 23,
    time: "08:00PM",
    name: "Annual Award Show",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "Sony Music Event",
    year: 2026,
    month: 10,
    day: 4,
    time: "07:00PM",
    name: "Annual Music Event",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "Ryan Leslie",
    year: 2026,
    month: 10,
    day: 8,
    time: "08:30PM",
    name: "With the Whole Crew",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "Truth Studio Party",
    year: 2026,
    month: 10,
    day: 13,
    time: "08:00PM",
    name: "No1. Pool Party",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  },
  {
    title: "James Blunt",
    year: 2026,
    month: 10,
    day: 31,
    time: "08:00PM",
    name: "Unplugged Concert",
    address: ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"]
  }
];

export const CITIES = [
  "Los Angeles",
  "Los Angeles",
  "San Francisco",
  "Los Angeles",
  "New York",
  "San Francisco",
  "Los Angeles",
  "New York"
];

export function eventSchedule(event, index) {
  const city = CITIES[index];
  const id = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const date = `${event.year}-${String(event.month).padStart(2, "0")}-${String(event.day).padStart(2, "0")}`;
  const hour = (Number(event.time.slice(0, 2)) % 12) + (event.time.endsWith("PM") ? 12 : 0);
  const timeZone = city === "New York" ? "America/New_York" : "America/Los_Angeles";
  const offset = city === "New York" ? "-04:00" : "-07:00";
  const startsAt = `${date}T${String(hour).padStart(2, "0")}:${event.time.slice(3, 5)}:00${offset}`;
  return { id, city, date, startsAt, timeZone };
}

const STARTS_AT = new Map(
  EVENTS.map((event, index) => {
    const { id, startsAt } = eventSchedule(event, index);
    return [id, startsAt];
  })
);

// Start time of the event with this id, or null.
export function eventStartsAt(id) {
  return STARTS_AT.get(id) || null;
}
