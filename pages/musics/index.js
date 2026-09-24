import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppContainer from "../../components/AppContainer";
import MusicPlayerCard from "../../components/MusicPlayerCard";
import CatalogToolbar from "../../components/music/CatalogToolbar";
import Button from "../../components/ui/Button";
import { listAlbums } from "../../lib/server/content";
import { formatNumber } from "../../lib/format";

const PAGE = 24;

// Every track of every album, title tracks first (so the first pages show many
// releases). The page props carry each album's first track; the rest of the catalog
// is fetched once it's needed (searching, or paging past the title tracks).
export default function MusicOverview({ musics }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [catalog, setCatalog] = useState(null); // albumId -> full tracklist
  const [catalogError, setCatalogError] = useState(false);
  const tracks = useMemo(
    () =>
      musics
        .flatMap((album) =>
          (catalog?.get(album.id) || album.tracks).map((track) => ({ album, track }))
        )
        .sort((a, b) => a.track.number - b.track.number),
    [musics, catalog]
  );
  const total = useMemo(() => musics.reduce((sum, album) => sum + album.totalTracks, 0), [musics]);
  const complete = catalog !== null || tracks.length >= total;
  const q = query.toLowerCase().trim();

  const wanted = !complete && !catalogError && (q !== "" || limit + PAGE > tracks.length);
  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    fetch("/api/public/albums")
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => {
        if (cancelled) return;
        const byId = new Map(musics.map((album) => [album.id, album]));
        const full = new Map();
        for (const { id, tracks: list } of data.albums) {
          const album = byId.get(id);
          if (!album) continue;
          full.set(
            id,
            list.map((track) => ({
              ...track,
              artist: track.artist || album.artist,
              cover: album.img_url,
              albumId: album.id,
              albumName: album.name
            }))
          );
        }
        setCatalog(full);
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogError(true);
        toast.error("The full track list couldn't be loaded. Showing title tracks.");
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, musics]);

  const filtered = useMemo(
    () =>
      tracks.filter(({ album, track }) =>
        `${track.title} ${track.artist} ${album.name}`.toLowerCase().includes(q)
      ),
    [tracks, q]
  );
  const available = q || complete || catalogError ? filtered.length : total;
  const visible = filtered.slice(0, limit);
  const queue = useMemo(() => filtered.map(({ track }) => track), [filtered]);
  const searching = q !== "" && !complete && !catalogError;
  return (
    <AppContainer
      title="Music"
      curMenu="Music"
      description="Discover new tracks and releases from the Projct Music community."
    >
      <h1 className="sr-only">Music tracks</h1>
      <CatalogToolbar
        active="Tracks"
        query={query}
        countLabel={
          searching
            ? "Searching…"
            : `${formatNumber(available)} ${available === 1 ? "track" : "tracks"}`
        }
        onSearch={(value) => {
          setQuery(value);
          setLimit(PAGE);
        }}
      />
      <ul className="grid grid-cols-1 lg:grid-cols-2">
        {visible.map(({ album, track }, index) => (
          <li key={track.id}>
            <MusicPlayerCard musicData={album} track={track} queue={queue} priority={index === 0} />
          </li>
        ))}
      </ul>
      {!filtered.length && !searching && (
        <p className="px-6 py-24 text-center text-sm text-neutral-500">
          {q
            ? "No tracks found. Try another artist or release."
            : "No music yet — check back soon."}
        </p>
      )}
      {limit < available && (
        <div className="flex justify-center py-10">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setLimit((value) => value + PAGE)}
          >
            Load more tracks
          </Button>
        </div>
      )}
    </AppContainer>
  );
}

export async function getStaticProps() {
  return { props: { musics: await listAlbums({ placement: "music" }) }, revalidate: 60 };
}
