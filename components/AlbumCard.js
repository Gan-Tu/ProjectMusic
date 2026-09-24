import Image from "next/image";
import Link from "next/link";
import { pad2 } from "../lib/format";
import { PlayButton } from "./music/TrackControls";
import { buildAlbumTracks } from "../utils/albumTracks";

// Existing artist grids may wrap this card in their own link. Catalog pages opt
// into an internal link; the play queue is built from the album on demand.
export default function AlbumCard({ musicData, num, tracks, linked = false, priority = false }) {
  const queue = tracks || musicData.tracks || (linked ? buildAlbumTracks(musicData) : null);
  return (
    <div className="group relative isolate aspect-square overflow-hidden bg-neutral-900 text-white">
      <Image
        src={musicData.img_url}
        alt={`${musicData.name} by ${musicData.artist || "Various Artists"}`}
        fill
        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
        priority={priority}
        className="object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-50 group-focus-within:brightness-50"
      />
      {linked && (
        <Link
          href={`/albums/${musicData.id}`}
          aria-label={`View ${musicData.name}`}
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
        />
      )}
      {num && (
        <span className="pointer-events-none absolute left-3 top-3 bg-pmred px-2 py-1 text-xs">
          {pad2(num)}
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent px-4 pb-4 pt-12 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <p className="line-clamp-2 text-xs font-bold uppercase tracking-wide">{musicData.name}</p>
        <p className="mt-1 text-[10px] text-white/65">{musicData.release_date}</p>
      </div>
      {linked && queue?.length > 0 && (
        <div className="absolute right-3 top-3 z-20 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <PlayButton
            track={queue[0]}
            queue={queue}
            replaceQueue
            className="bg-pmred text-white shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
