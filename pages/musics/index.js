import { useState } from "react";
import AppContainer from "../../components/AppContainer";
import MusicPlayerCard from "../../components/MusicPlayerCard";
import CatalogToolbar from "../../components/music/CatalogToolbar";
import Button from "../../components/ui/Button";
import { getMusics, getAlbumTracks } from "../../utils/getFakeTracks";
import { toAlbumSummary } from "../../utils/albumTracks";

export default function MusicOverview({ musics }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  const filtered = musics.filter((album) =>
    `${album.name} ${album.artist}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  const visible = filtered.slice(0, limit);
  const queue = filtered.map((album) => album.track);
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
        count={filtered.length}
        onSearch={(value) => {
          setQuery(value);
          setLimit(24);
        }}
      />
      <ul className="grid grid-cols-1 lg:grid-cols-2">
        {visible.map((musicData, index) => (
          <li key={musicData.id}>
            <MusicPlayerCard
              musicData={musicData}
              track={musicData.track}
              queue={queue}
              priority={index === 0}
            />
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
      musics: getMusics().map((album) => ({
        ...toAlbumSummary(album),
        track: getAlbumTracks(album.id)[0]
      }))
    }
  };
}
