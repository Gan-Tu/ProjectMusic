import { useState } from "react";
import AppContainer from "../../components/AppContainer";
import AlbumCard from "../../components/AlbumCard";
import CatalogToolbar from "../../components/music/CatalogToolbar";
import { listAlbums } from "../../lib/server/content";
import { formatNumber } from "../../lib/format";

export default function Albums({ musics }) {
  const [query, setQuery] = useState("");
  const filtered = musics.filter((album) =>
    `${album.name} ${album.artist}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  return (
    <AppContainer
      title="Albums"
      curMenu="Albums"
      description="Explore the complete Projct Music release collection."
    >
      <h1 className="sr-only">Albums</h1>
      <CatalogToolbar
        active="Albums"
        query={query}
        onSearch={setQuery}
        countLabel={`${formatNumber(filtered.length)} ${filtered.length === 1 ? "release" : "releases"}`}
      />
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((musicData, index) => (
          <li key={musicData.id}>
            <AlbumCard musicData={musicData} linked priority={index === 0} />
          </li>
        ))}
      </ul>
      {!filtered.length && (
        <p className="px-6 py-24 text-center text-sm text-neutral-500">
          {query.trim()
            ? "No releases found. Try another artist or album."
            : "No releases yet — check back soon."}
        </p>
      )}
    </AppContainer>
  );
}

// Each album carries its first track, so its card plays at once (the rest of the
// tracklist loads on demand, see components/music/albumQueue.js).
export async function getStaticProps() {
  return { props: { musics: await listAlbums({ placement: "music" }) }, revalidate: 60 };
}
