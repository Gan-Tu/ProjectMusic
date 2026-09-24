import { seededRandom } from "../lib/format";

const TITLE_WORDS = [
  [
    "Midnight",
    "Golden",
    "Neon",
    "Paper",
    "Velvet",
    "Electric",
    "Silver",
    "Broken",
    "Summer",
    "Wild"
  ],
  ["Hearts", "Lights", "Streets", "Dreams", "Waves", "Skies", "Echoes", "Roses", "Nights", "Lines"]
];

// Deterministic tracklist for an album (singles contain just the title track).
// Pure and data-free so client components can build a queue on demand instead
// of shipping every tracklist in page props.
export function buildAlbumTracks(album) {
  const rand = seededRandom(album.id);
  const count = Math.max(1, Math.min(album.totalTracks || 1, 16));
  return Array.from({ length: count }, (_, i) => {
    const title =
      i === 0
        ? album.name
        : `${TITLE_WORDS[0][Math.floor(rand() * 10)]} ${TITLE_WORDS[1][Math.floor(rand() * 10)]}`;
    return {
      id: `${album.id}-${i + 1}`,
      number: i + 1,
      title,
      artist: album.artist,
      cover: album.img_url,
      albumId: album.id,
      albumName: album.name,
      duration: 150 + Math.floor(rand() * 120)
    };
  });
}

// The fields list/grid pages need from a catalog album.
export function toAlbumSummary({
  id,
  name,
  img_url,
  release_date,
  artist,
  totalTracks,
  albumType
}) {
  return { id, name, img_url, release_date, artist, totalTracks, albumType };
}
