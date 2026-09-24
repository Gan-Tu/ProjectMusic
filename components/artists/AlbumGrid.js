import Image from "next/image";
import Link from "next/link";
import { HeartIcon, PauseIcon, PlayIcon, PlusIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { usePlayer } from "../../lib/player";
import { useStore } from "../../lib/store";
import { buildAlbumTracks } from "../../utils/albumTracks";

export default function AlbumGrid({ albums }) {
  const player = usePlayer();
  const { state, actions } = useStore();
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
      {albums.map((album, index) => {
        const tracks = album.tracks || buildAlbumTracks(album);
        const track = tracks[0];
        const playing = track && player.isTrackPlaying(track.id);
        const liked = !!state.likes[`album:${album.id}`];
        return (
          <li key={album.id} className="group min-w-0">
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
              <Link
                href={`/albums/${album.id}`}
                className="absolute inset-0 cursor-pointer"
                aria-label={`View ${album.name}`}
              >
                <Image
                  src={album.img_url}
                  alt={`${album.name} album cover`}
                  fill
                  loading={index < 4 ? "eager" : "lazy"}
                  sizes="(max-width: 639px) 45vw, (max-width: 1279px) 30vw, 22vw"
                  className="object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none"
                />
              </Link>
              {track && (
                <button
                  type="button"
                  onClick={() => player.playTrack(track, tracks)}
                  aria-label={`${playing ? "Pause" : "Play"} ${album.name}`}
                  className="absolute bottom-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-pmred text-white shadow-lg transition hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                </button>
              )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/albums/${album.id}`}
                  className="block cursor-pointer truncate text-xs font-bold uppercase hover:text-pmred"
                >
                  {album.name}
                </Link>
                <p className="mt-1 truncate text-xs text-neutral-500">{album.artist}</p>
              </div>
              <button
                type="button"
                aria-label={`${liked ? "Unlike" : "Like"} ${album.name}`}
                aria-pressed={liked}
                onClick={() => actions.toggleLike(`album:${album.id}`)}
                className={`cursor-pointer p-1 ${liked ? "text-pmred" : "text-neutral-300 hover:text-pmred"}`}
              >
                <HeartIcon className="h-4 w-4" />
              </button>
            </div>
            {track && (
              <button
                type="button"
                onClick={() => {
                  actions.addToPlaylist(track);
                  toast.success("Added to your playlist");
                }}
                className="mt-2 inline-flex cursor-pointer items-center gap-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 hover:text-pmred"
              >
                <PlusIcon className="h-3 w-3" /> Playlist
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
