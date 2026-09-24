import { getArtistHomePageData } from "./getFakeArtistsData";

const EVENTS = [
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

const CITIES = [
  "Los Angeles",
  "Los Angeles",
  "San Francisco",
  "Los Angeles",
  "New York",
  "San Francisco",
  "Los Angeles",
  "New York"
];
const VENUES = {
  "Los Angeles": ["Hollywood Bowl", "2301 N Highland Ave", "Hollywood, CA 90068"],
  "San Francisco": ["The Fillmore", "1805 Geary Blvd", "San Francisco, CA 94115"],
  "New York": ["Brooklyn Steel", "319 Frost St", "Brooklyn, NY 11222"]
};
const PHOTOS = [
  "photo-1459749411175-04bf5292ceea",
  "photo-1506157786151-b8491531f063",
  "photo-1492684223066-81342ee5ff30",
  "photo-1470229722913-7c0e2dbbafd3"
];

export const getEvents = () => {
  const artists = getArtistHomePageData();
  return EVENTS.map((event, index) => {
    const city = CITIES[index];
    const id = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const date = `${event.year}-${String(event.month).padStart(2, "0")}-${String(event.day).padStart(2, "0")}`;
    const hour = (Number(event.time.slice(0, 2)) % 12) + (event.time.endsWith("PM") ? 12 : 0);
    const timeZone = city === "New York" ? "America/New_York" : "America/Los_Angeles";
    const offset = city === "New York" ? "-04:00" : "-07:00";
    const startsAt = `${date}T${String(hour).padStart(2, "0")}:${event.time.slice(3, 5)}:00${offset}`;
    const price = [65, 85, 35, 95, 45, 40, 25, 55][index];
    return {
      ...event,
      id,
      city,
      date,
      startsAt,
      timeZone,
      address: VENUES[city],
      image: `https://images.unsplash.com/${PHOTOS[index % PHOTOS.length]}?auto=format&fit=crop&w=1200&q=80`,
      price,
      credits: price * 90,
      lineup: Array.from(
        { length: 3 },
        (_, position) => artists[(index * 4 + position) % artists.length]
      ),
      description:
        "An evening of live music, special guests, and the sounds that bring our community together. Join Projct Music for an intimate connection with the artists, from the first set to the final encore.",
      tiers: [
        {
          name: "General admission",
          price,
          credits: price * 90,
          description: "One admission · Standing room"
        },
        {
          name: "VIP",
          price: price + 75,
          credits: (price + 75) * 90,
          description: "One admission · Priority entry · VIP viewing area"
        }
      ]
    };
  });
};

export const getEventById = (id) => getEvents().find((event) => event.id === id);
