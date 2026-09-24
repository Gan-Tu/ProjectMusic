import { useState } from "react";
import Image from "../../components/ui/SmartImage";
import Link from "next/link";
import { Squares2X2Icon, Bars3Icon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import { listArtists } from "../../lib/server/content";
import { useStore } from "../../lib/store";
import { classNames } from "../../lib/format";

export default function ArtistsHome({ artistsData }) {
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState("All");
  const [view, setView] = useState("grid");
  const { state, actions } = useStore();
  const artists = artistsData.filter(
    (artist) =>
      artist.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (letter === "All" || artist.name.toUpperCase().startsWith(letter))
  );
  const letters = new Set(artistsData.map((artist) => artist.name.charAt(0).toUpperCase()));
  return (
    <AppContainer
      title="Artists"
      curMenu="Artists"
      description="Meet the artists and voices of Projct Music."
    >
      <section
        aria-label="Find an artist"
        className="border-b border-neutral-200 px-5 py-6 sm:px-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-lg font-extrabold uppercase tracking-widest">The artists</h1>
            <p aria-live="polite" className="mt-1 text-xs text-neutral-500">
              {artists.length} voices. One community.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <label className="relative flex-1">
              <span className="sr-only">Search artists</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find an artist"
                className="w-full rounded-full border border-neutral-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-pmred sm:w-64"
              />
            </label>
            <div className="flex gap-1" aria-label="Directory view">
              {[
                ["grid", Squares2X2Icon],
                ["list", Bars3Icon]
              ].map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  aria-label={`${name} view`}
                  aria-pressed={view === name}
                  onClick={() => setView(name)}
                  className={classNames(
                    "cursor-pointer rounded-full p-3 transition-colors",
                    view === name
                      ? "bg-pmred text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-1" aria-label="Filter by first letter">
          {["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((value) => (
            <button
              key={value}
              type="button"
              disabled={value !== "All" && !letters.has(value)}
              aria-pressed={letter === value}
              onClick={() => setLetter(value)}
              className={classNames(
                "min-w-8 cursor-pointer rounded-full px-2 py-2 text-xs font-bold transition-colors disabled:cursor-default disabled:text-neutral-300",
                letter === value
                  ? "bg-black text-white"
                  : "text-neutral-500 enabled:hover:text-pmred"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </section>
      {!artistsData.length ? (
        <div className="px-6 py-24 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest">No artists yet</h2>
          <p className="mt-3 text-sm text-neutral-500">
            The directory is getting ready. New voices are on the way.
          </p>
        </div>
      ) : !artists.length ? (
        <div className="px-6 py-24 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest">No artists found</h2>
          <p className="mt-3 text-sm text-neutral-500">
            Try another name or explore the full directory.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setLetter("All");
            }}
            className="mt-6 cursor-pointer text-xs font-bold uppercase text-pmred"
          >
            Clear filters
          </button>
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {artists.map((artist, index) => (
            <li key={artist.id} className="artists-artists-alternate-row-reverse flex min-w-0">
              <Link
                href={`/artists/${artist.id}`}
                className="group relative aspect-square w-1/2 min-w-0 shrink-0 cursor-pointer overflow-hidden bg-neutral-100"
              >
                <Image
                  src={artist.imgUrl}
                  alt={artist.name}
                  fill
                  preload={index < 3}
                  sizes="(max-width: 767px) 50vw, (max-width: 1279px) 25vw, 17vw"
                  className="object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100 motion-reduce:transition-none"
                />
              </Link>
              <div className="flex w-1/2 min-w-0 shrink-0 flex-col items-center justify-center px-3 py-5 text-center sm:px-6">
                <Link
                  href={`/artists/${artist.id}`}
                  className="w-full cursor-pointer border-b border-neutral-200 pb-3 text-xs font-extrabold uppercase tracking-wide wrap-anywhere hover:text-pmred"
                >
                  {artist.name}
                </Link>
                <p className="mt-3 max-w-full text-2xs uppercase tracking-wide text-neutral-500 wrap-anywhere">
                  {artist.location}
                </p>
                <button
                  type="button"
                  aria-label={`${state.follows[`artist:${artist.id}`] ? "Unfollow" : "Follow"} ${artist.name}`}
                  aria-pressed={!!state.follows[`artist:${artist.id}`]}
                  onClick={() => actions.toggleFollow(`artist:${artist.id}`)}
                  className="mt-4 cursor-pointer rounded-full border border-pmred px-4 py-1.5 text-2xs font-bold uppercase tracking-wider text-pmred transition-colors hover:bg-pmred hover:text-white"
                >
                  {state.follows[`artist:${artist.id}`] ? "Following" : "+ Follow"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="columns-1 gap-10 px-5 py-8 sm:columns-2 sm:px-10 lg:columns-4">
          {[...artists]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((artist) => (
              <div
                key={artist.id}
                className="mb-1 flex break-inside-avoid items-center justify-between gap-3 border-b border-neutral-100 py-3"
              >
                <Link
                  href={`/artists/${artist.id}`}
                  className="min-w-0 cursor-pointer text-xs font-bold uppercase tracking-wide wrap-anywhere hover:text-pmred"
                >
                  {artist.name}
                </Link>
                <button
                  type="button"
                  aria-label={`${state.follows[`artist:${artist.id}`] ? "Unfollow" : "Follow"} ${artist.name}`}
                  aria-pressed={!!state.follows[`artist:${artist.id}`]}
                  onClick={() => actions.toggleFollow(`artist:${artist.id}`)}
                  className="cursor-pointer p-2 text-sm text-pmred"
                >
                  {state.follows[`artist:${artist.id}`] ? "✓" : "+"}
                </button>
              </div>
            ))}
        </div>
      )}
    </AppContainer>
  );
}

export async function getStaticProps() {
  return { props: { artistsData: await listArtists({ placement: "directory" }) }, revalidate: 60 };
}
