import { useMemo, useState } from "react";
import AppContainer from "../../components/AppContainer";
import MusicPlayerCard from "../../components/MusicPlayerCard";
import CatalogToolbar from "../../components/music/CatalogToolbar";
import Button from "../../components/ui/Button";
import { getMusics } from "../../utils/getFakeTracks";
import { buildAlbumTracks, toAlbumSummary } from "../../utils/albumTracks";
import { formatNumber } from "../../lib/format";

export default function MusicOverview({ musics }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  // Every track of every album, title tracks first (so the first page shows many
  // releases). Tracklists are deterministic, so they're built here from the album
  // summaries rather than shipped in the page props.
  const tracks = useMemo(
    () =>
      musics
        .flatMap((album) => buildAlbumTracks(album).map((track) => ({ album, track })))
        .sort((a, b) => a.track.number - b.track.number),
    [musics]
  );
  const q = query.toLowerCase().trim();
  const filtered = useMemo(
    () =>
      tracks.filter(({ album, track }) =>
        `${track.title} ${track.artist} ${album.name}`.toLowerCase().includes(q)
      ),
    [tracks, q]
  );
  const visible = filtered.slice(0, limit);
  const queue = useMemo(() => filtered.map(({ track }) => track), [filtered]);
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
        countLabel={`${formatNumber(filtered.length)} ${filtered.length === 1 ? "track" : "tracks"}`}
        onSearch={(value) => {
          setQuery(value);
          setLimit(24);
        }}
      />
      <ul className="grid grid-cols-1 lg:grid-cols-2">
        {visible.map(({ album, track }, index) => (
          <li key={track.id}>
            <MusicPlayerCard musicData={album} track={track} queue={queue} priority={index === 0} />
          </li>
        ))}
      </ul>
      {!filtered.length && (
        <p className="px-6 py-24 text-center text-sm text-neutral-500">
          No tracks found. Try another artist or release.
        </p>
      )}
      {limit < filtered.length && (
        <div className="flex justify-center py-10">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setLimit((value) => value + 24)}
          >
            Load more tracks
          </Button>
        </div>
      )}
    </AppContainer>
  );
}

export async function getStaticProps() {
  return {
    props: {
      musics: getMusics().map(toAlbumSummary)
    }
  };
}
