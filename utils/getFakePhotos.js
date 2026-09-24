import { picsum } from "../lib/media";
import { getArtistHomePageData } from "./getFakeArtistsData";

export const PHOTO_CATEGORIES = [
  {
    id: "studio",
    name: "Studio photos",
    description: "Behind the boards. Inside the sessions.",
    image: "/pictures/studio.webp"
  },
  {
    id: "artists",
    name: "Artist photos",
    description: "The faces behind the sound.",
    image: "/pictures/portrait.webp"
  },
  {
    id: "polaroids",
    name: "Polaroids",
    description: "A moment, kept forever.",
    image: "/pictures/polaroids.webp"
  },
  {
    id: "nearby",
    name: "Near by for clients",
    description: "Step outside. Find your next inspiration.",
    image: "/pictures/nearby.webp"
  }
];

const CAPTIONS = {
  studio: [
    "After hours at the desk",
    "A little room for a big idea",
    "Between takes",
    "The listening room",
    "Sound in the making",
    "Notes from the session",
    "Last light in the studio",
    "Everything in its place"
  ],
  polaroids: [
    "Keep this one",
    "An afternoon together",
    "No second take",
    "On the road",
    "Faces from the archive",
    "A good day",
    "Before the show",
    "Until next time"
  ],
  nearby: [
    "City after dark",
    "The scenic route",
    "A quiet corner",
    "Out for a little inspiration",
    "Take the long way home",
    "Room to breathe",
    "Golden hour",
    "See you around"
  ]
};

export function getPhotos(category) {
  const artists = getArtistHomePageData();
  if (category === "artists")
    return artists
      .slice(0, 18)
      .map((artist) => ({
        id: `artist-photo-${artist.id}`,
        src: artist.imgUrl,
        caption: artist.name,
        location: artist.location
      }));
  if (!CAPTIONS[category]) return [];
  return CAPTIONS[category].map((caption, index) => ({
    id: `${category}-${index + 1}`,
    src:
      index === 0
        ? `/pictures/${category}.webp`
        : category === "polaroids" && index % 2
          ? artists[index * 3].imgUrl
          : picsum(`pm-${category}-${index}`, 1000, index % 3 === 0 ? 1200 : 800),
    caption,
    location: category === "nearby" ? "Around the neighborhood" : "Truth Studios photo archive"
  }));
}

export function getArtistPhotos(artist) {
  return [
    {
      id: `${artist.id}-portrait`,
      src: artist.imgUrl,
      caption: `${artist.name} / Portrait`,
      location: artist.location
    },
    {
      id: `${artist.id}-studio`,
      src: "/pictures/studio.webp",
      caption: "Inside the studio",
      location: "Truth Studios"
    },
    {
      id: `${artist.id}-polaroid`,
      src: "/pictures/polaroids.webp",
      caption: "From the inspiration wall",
      location: "Truth Studios"
    },
    {
      id: `${artist.id}-city`,
      src: "/pictures/nearby.webp",
      caption: "After the session",
      location: "City nights"
    }
  ];
}
