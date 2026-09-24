import Image from "../ui/SmartImage";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/24/solid";
import { classNames, formatTime } from "../../lib/format";

export default function VideoCard({ video, active = false, compact = false }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      aria-current={active ? "page" : undefined}
      className={classNames(
        "group block min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pmred",
        active && "bg-neutral-800"
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-900">
        <Image
          src={video.poster}
          alt={`${video.artist} — ${video.title}`}
          fill
          sizes={compact ? "(max-width: 640px) 170px, 220px" : "(max-width: 640px) 50vw, 25vw"}
          className="object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-75 motion-reduce:transition-none motion-reduce:transform-none"
        />
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            active ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-pmred">
            <PlayIcon className="ml-0.5 size-5" aria-hidden="true" />
          </span>
        </span>
        {video.duration > 0 && (
          <span className="absolute right-2 bottom-2 bg-black/75 px-1.5 py-0.5 text-2xs font-semibold text-white">
            {formatTime(video.duration)}
          </span>
        )}
        {active && <span className="absolute inset-x-0 bottom-0 h-1 bg-pmred" />}
      </div>
      <div className="px-3 py-4">
        <h3
          className={classNames(
            "truncate text-xs font-extrabold uppercase tracking-wider group-hover:text-pmred-light",
            active ? "text-pmred-light" : "text-white"
          )}
        >
          {video.artist}
        </h3>
        <p className="mt-1 truncate text-xs text-neutral-400">{video.subtitle}</p>
      </div>
    </Link>
  );
}
