import { getArtistHomePageData } from "./getFakeArtistsData";
import { EVENTS, eventSchedule } from "./eventSchedule";

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
    const { id, city, date, startsAt, timeZone } = eventSchedule(event, index);
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
