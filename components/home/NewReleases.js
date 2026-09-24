import Image from "../ui/SmartImage";
import Link from "next/link";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../../lib/player";

// Plays the releases' title tracks as one queue.
export default function NewReleases({ albums }) {
  const { playTrack, isTrackPlaying, pause } = usePlayer();
  const queue = albums.flatMap((album) => album.tracks?.slice(0, 1) || []);
  return (
    <section aria-labelledby="new-releases-heading" className="py-10 md:py-14">
      <div className="mb-6 flex items-center justify-between px-5 md:px-10">
        <h2 id="new-releases-heading" className="text-sm font-extrabold uppercase tracking-[0.2em]">
          New releases
        </h2>
        <Link
          href="/albums"
          className="text-xs font-bold uppercase tracking-widest text-pmred hover:underline"
        >
          All music <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:gap-6 md:px-10">
        {albums.map((album) => {
          const track = album.tracks?.[0];
          const playing = Boolean(track) && isTrackPlaying(track.id);
          return (
            <article
              key={album.id}
              className="group w-[155px] shrink-0 snap-start md:w-[calc((100vw-200px)/6)] md:min-w-[170px]"
            >
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <Link
                  href={`/albums/${album.id}`}
                  aria-label={`View ${album.name} by ${album.artist}`}
                  className="absolute inset-0"
                >
                  <Image
                    src={album.img_url}
                    alt={`${album.name} album cover`}
                    fill
                    sizes="(max-width: 768px) 155px, 17vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                  />
                </Link>
                {track && (
                  <button
                    type="button"
                    onClick={() => (playing ? pause() : playTrack(track, queue))}
                    aria-label={`${playing ? "Pause" : "Play"} ${album.name}`}
                    className="absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-full bg-white text-pmred shadow-lg transition hover:bg-pmred hover:text-white md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    style={playing ? { opacity: 1 } : undefined}
                  >
                    {playing ? (
                      <PauseIcon className="size-5" />
                    ) : (
                      <PlayIcon className="ml-0.5 size-5" />
                    )}
                  </button>
                )}
              </div>
              <Link
                href={`/albums/${album.id}`}
                className="mt-3 block truncate text-xs font-bold uppercase hover:text-pmred"
              >
                {album.name}
              </Link>
              <p className="mt-1 truncate text-xs text-neutral-500">{album.artist}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
