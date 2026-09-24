import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { formatTime, pad2 } from "../../lib/format";

function PhotoTile({ video, className = "" }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className={`group relative block overflow-hidden bg-neutral-900 ${className}`}
      aria-label={`Watch ${video.artist}: ${video.title}`}
    >
      <Image
        src={video.artistImage}
        alt={video.artist}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110 motion-reduce:transition-none motion-reduce:transform-none"
      />
      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-5 pt-10 pb-4 text-xs font-bold uppercase tracking-wider text-white">
        {video.artist}
      </span>
    </Link>
  );
}

export default function HomeHero({ videos }) {
  const [index, setIndex] = useState(0);
  const featured = videos.slice(0, 5);
  const video = featured[index];
  return (
    <section
      aria-label="Featured videos"
      aria-roledescription="carousel"
      className="grid grid-cols-2 bg-black text-white md:h-[min(620px,66vw)] md:min-h-[420px] md:grid-cols-4 md:grid-rows-2"
    >
      <div className="hidden min-h-0 md:block">
        <PhotoTile video={videos[(index + 3) % videos.length]} className="h-full" />
      </div>
      <Link
        href={`/videos/${video.id}`}
        className="group relative col-span-2 row-span-2 block aspect-[1.2] overflow-hidden bg-neutral-900 md:aspect-auto"
        aria-label={`Watch featured video: ${video.title} by ${video.artist}`}
      >
        <Image
          key={video.id}
          src={video.poster}
          alt={`${video.artist} — ${video.title}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:transform-none"
        />
        <span className="absolute top-5 right-0 bg-pmred px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em]">
          {index === 0 ? "Most recent video" : "Featured video"}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/30 to-transparent px-6 pt-24 pb-6 md:p-8 md:pt-24">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/75">
            Projct Music / In focus
          </p>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight md:text-4xl">
            {video.artist}
          </h1>
          <p className="mt-2 text-sm text-neutral-200">{video.title}</p>
        </div>
        <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/20 text-white transition group-hover:border-pmred group-hover:bg-pmred">
          <PlayIcon className="ml-1 size-7" />
        </span>
      </Link>
      <PhotoTile video={videos[(index + 8) % videos.length]} className="hidden md:block" />
      <PhotoTile video={videos[(index + 5) % videos.length]} className="min-h-[210px] md:min-h-0" />
      <div
        className="relative flex min-w-0 flex-col justify-between bg-neutral-950 p-4 md:p-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-5xl font-light md:text-6xl leading-none tracking-tighter text-pmred lg:text-8xl">
            {pad2(index + 1)}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setIndex((index + featured.length - 1) % featured.length)}
              aria-label="Previous featured video"
              className="flex size-8 items-center md:size-9 justify-center border border-neutral-700 text-white hover:border-pmred hover:bg-pmred"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((index + 1) % featured.length)}
              aria-label="Next featured video"
              className="flex size-8 items-center md:size-9 justify-center border border-neutral-700 text-white hover:border-pmred hover:bg-pmred"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </div>
        <Link href={`/videos/${video.id}`} className="group mt-5 flex items-center gap-4">
          <PlayIcon className="size-6 shrink-0 text-pmred transition-transform group-hover:scale-125 motion-reduce:transform-none" />
          <div className="min-w-0 border-l border-neutral-800 pl-4">
            <p className="text-xs font-extrabold uppercase tracking-wider">{video.artist}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">{video.subtitle}</p>
            <p className="mt-2 text-xs text-white">
              {formatTime(video.duration)}{" "}
              <span className="ml-2 text-neutral-500">/ {pad2(featured.length)} videos</span>
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
