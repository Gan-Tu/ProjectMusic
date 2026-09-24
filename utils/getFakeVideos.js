import { getArtistData } from "./getFakeArtistsData";
import { getVideoSrc } from "../lib/media";

const VIDEO_SEEDS = [
  [
    "daniel-caesar",
    "Welcome to the Nightclub",
    "An invitation to stay a little longer",
    "nightclub",
    336
  ],
  ["kelsey-lu", "The Long Way Home", "A session beyond the city", "forest-session", 248],
  ["truth-studios", "After Hours", "Behind the masks, behind the music", "after-hours", 284],
  ["asher-roth", "Golden Hour", "One take. Nothing held back.", null, 213],
  ["joey-purp", "Late Night Drive", "Chicago after the lights go down", null, 192],
  ["eryn-allan-kane", "Open Windows", "A voice that fills the room", null, 267],
  ["chuck-inglish", "In the Pocket", "Straight from the studio floor", null, 225],
  ["noname", "Paper Planes", "Small stories, wide horizons", null, 204],
  ["smino", "Summer on Repeat", "Keep the windows down", null, 238],
  ["little-simz", "On My Own", "No shortcuts, just the journey", null, 256],
  ["tokimonsta", "Soft Focus", "A different kind of frequency", null, 241],
  ["mick-jenkins", "Deep Water", "A moment beneath the surface", null, 279],
  ["ady-suleiman", "Come Around", "Something to come home to", null, 231],
  ["vic-mensa", "City Lights", "From the first verse to sunrise", null, 219],
  ["whitney", "Morning Light", "A quiet start, a lasting feeling", null, 247],
  ["chronixx", "Good Company", "Find your rhythm, find your people", null, 302]
];

const VIDEOS = VIDEO_SEEDS.map(([artistId, title, subtitle, image, duration], index) => {
  const artist = getArtistData(artistId);
  const id = `${artistId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return {
    id,
    title,
    artist: artist.name,
    artistId,
    artistImage: `/home/${artistId}.webp`,
    subtitle,
    duration,
    poster: `/videos/${image || artistId}.webp`,
    src: getVideoSrc(id),
    views: 184620 - index * 9163,
    likes: 2840 - index * 143,
    date: `2026-09-${String(22 - index).padStart(2, "0")}`,
    description: `${title} brings ${artist.name} into the Projct Music collection. ${subtitle}. A close-up look at the people, places and moments that keep us listening. Recorded and assembled with the independent spirit of Truth Studios.`,
    credits: [
      { role: "Artist", name: artist.name },
      { role: "Production", name: "Truth Studios" },
      { role: "Direction & edit", name: "Projct Films" },
      { role: "Recording & mix", name: "Nick Breton" },
      { role: "Creative direction", name: "Projct Music" }
    ]
  };
});

export function getVideos() {
  return VIDEOS;
}

export function getVideoById(id) {
  return VIDEOS.find((video) => video.id === id) || null;
}

export function getRelatedVideos(id, n = 8) {
  const index = VIDEOS.findIndex((video) => video.id === id);
  const ordered = [...VIDEOS.slice(index + 1), ...VIDEOS.slice(0, Math.max(0, index))];
  return ordered.filter((video) => video.id !== id).slice(0, Math.max(0, n));
}
