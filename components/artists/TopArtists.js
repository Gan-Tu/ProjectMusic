import Link from "next/link";
import { pad2 } from "../../lib/format";

export default function TopArtists({ artists }) {
  return (
    <aside className="bg-black/60 px-6 py-8 sm:px-10">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-pmred-light">
        Top 10 artists
      </h2>
      <ol className="grid grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-1 xl:grid-cols-2">
        {artists.map((artist, index) => (
          <li
            key={artist.id}
            className="flex min-w-0 items-baseline gap-3 text-2xs font-bold uppercase tracking-wide"
          >
            <span className="font-normal text-pmred-light">{pad2(index + 1)}</span>
            <Link
              href={`/artists/${artist.id}`}
              className="min-w-0 cursor-pointer text-neutral-300 transition-colors wrap-anywhere hover:text-white"
            >
              {artist.name}
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
