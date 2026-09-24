import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, PlayIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../../lib/player";
import { useStore } from "../../lib/store";
import { classNames, formatLongDate, formatNumber, formatTime } from "../../lib/format";
import VideoStrip from "./VideoStrip";
import VideoCard from "./VideoCard";
import CommentThread from "../comments/CommentThread";
import CaptionsTrack from "./CaptionsTrack";

export default function VideoStage({ video, videos, related }) {
  const [started, setStarted] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [manualShare, setManualShare] = useState("");
  const videoRef = useRef(null);
  const { pause } = usePlayer();
  const { state, actions } = useStore();
  const index = videos.findIndex((item) => item.id === video.id);
  const previous = videos[(index + videos.length - 1) % videos.length];
  const next = videos[(index + 1) % videos.length];
  const liked = Boolean(state.likes[`video:${video.id}`]);

  function startVideo() {
    pause();
    setFailed(false);
    setStarted(true);
  }

  async function shareVideo() {
    const url = `${window.location.origin}/videos/${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Video link copied");
    } catch {
      setManualShare(url);
      toast("Select and copy the link below");
    }
  }

  return (
    <div className="min-w-0 bg-black text-white">
      <section aria-label={`${video.title} video player`} className="relative bg-neutral-950">
        <div
          className={classNames(
            "relative mx-auto w-full max-w-[1600px]",
            creditsOpen && "lg:pr-[320px]"
          )}
        >
          <div className="relative aspect-video overflow-hidden bg-black">
            {started ? (
              <video
                ref={videoRef}
                src={video.src}
                poster={video.poster}
                autoPlay
                controls
                playsInline
                preload="metadata"
                aria-label={`${video.artist} — ${video.title}`}
                onPlay={pause}
                onError={() => setFailed(true)}
                className="h-full w-full object-contain"
              >
                <CaptionsTrack src={video.src} />
              </video>
            ) : (
              <>
                <Image
                  src={video.poster}
                  alt={`${video.artist} — ${video.title}`}
                  fill
                  preload
                  sizes={creditsOpen ? "(max-width: 1024px) 100vw, 80vw" : "100vw"}
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/15" />
                <button
                  type="button"
                  onClick={startVideo}
                  aria-label={`Play ${video.title}`}
                  className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-pmred bg-black/20 text-white transition hover:scale-105 hover:bg-pmred focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none md:size-24 md:border-4"
                >
                  <PlayIcon className="ml-1 size-7 md:size-10" />
                </button>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-linear-to-t from-black/80 to-transparent px-20 pt-20 pb-8 md:block">
                  <p className="text-2xs font-bold uppercase tracking-[0.25em] text-white/65">
                    Projct Music presents
                  </p>
                  <p className="mt-2 text-xl font-extrabold uppercase tracking-wide">
                    {video.title}
                  </p>
                </div>
              </>
            )}
            {failed && (
              <div
                role="alert"
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center"
              >
                <p className="text-sm font-bold">This video couldn’t be loaded.</p>
                <p className="mt-2 text-xs text-neutral-400">
                  Check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFailed(false);
                    videoRef.current?.load();
                    videoRef.current?.play().catch(() => setFailed(true));
                  }}
                  className="mt-4 rounded-full bg-pmred px-6 py-2 text-xs font-bold uppercase"
                >
                  Try again
                </button>
              </div>
            )}
            {!started && (
              <>
                <Link
                  href={`/videos/${previous.id}`}
                  aria-label={`Previous video: ${previous.title}`}
                  className="absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center bg-pmred text-white hover:bg-pmred-dark md:size-14"
                >
                  <ChevronLeftIcon className="size-6" />
                </Link>
                <Link
                  href={`/videos/${next.id}`}
                  aria-label={`Next video: ${next.title}`}
                  className="absolute top-1/2 right-0 flex size-10 -translate-y-1/2 items-center justify-center bg-pmred text-white hover:bg-pmred-dark md:size-14"
                >
                  <ChevronRightIcon className="size-6" />
                </Link>
              </>
            )}
          </div>
        </div>
        <aside
          className={classNames(
            "bg-neutral-900 lg:absolute lg:top-0 lg:right-0 lg:w-[320px]",
            creditsOpen && "lg:bottom-0 lg:overflow-y-auto"
          )}
        >
          <button
            type="button"
            onClick={() => setCreditsOpen((open) => !open)}
            aria-expanded={creditsOpen}
            aria-controls="video-credits"
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-neutral-800 md:p-5"
          >
            <Image
              src={video.artistImage}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 object-cover"
            />
            <span className="min-w-0 grow">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-pmred-light">
                {video.artist}
              </span>
              <span className="mt-1 block truncate text-xs text-neutral-300">{video.title}</span>
            </span>
            <span className="flex flex-col items-center gap-1 text-2xs uppercase tracking-wider text-neutral-400">
              <ChevronDownIcon
                className={classNames("size-4 transition-transform", creditsOpen && "rotate-180")}
              />
              Credits
            </span>
          </button>
          <div
            id="video-credits"
            hidden={!creditsOpen}
            className="border-t border-neutral-800 px-5 py-6"
          >
            <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.2em]">Behind the video</h2>
            <dl className="space-y-5">
              {video.credits.map((credit) => (
                <div key={credit.role}>
                  <dt className="text-2xs uppercase tracking-widest text-neutral-400">
                    {credit.role}
                  </dt>
                  <dd className="mt-1 text-xs text-neutral-200">{credit.name}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/artists/${video.artistId}`}
              className="mt-7 inline-block text-2xs font-bold uppercase tracking-widest text-pmred hover:text-white"
            >
              Artist profile ↗
            </Link>
          </div>
        </aside>
      </section>
      <VideoStrip videos={videos} activeId={video.id} label="Choose a video" />
      <section
        aria-labelledby="video-title"
        className="grid gap-8 border-t border-neutral-800 px-5 py-9 md:grid-cols-[1fr_auto] md:px-10 md:py-12"
      >
        <div className="max-w-3xl">
          <Link
            href={`/artists/${video.artistId}`}
            className="text-xs font-extrabold uppercase tracking-[0.2em] text-pmred hover:underline"
          >
            {video.artist}
          </Link>
          <h1
            id="video-title"
            className="mt-3 text-2xl font-extrabold uppercase tracking-tight md:text-3xl"
          >
            {video.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-400">
            <span>{formatNumber(video.views)} views</span>
            <time dateTime={video.date}>{formatLongDate(video.date)}</time>
            <span>{formatTime(video.duration)}</span>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-400">{video.description}</p>
          <p className="mt-4 text-2xs text-neutral-400">
            Demo collection · Playback uses sample footage.
          </p>
        </div>
        <div className="flex flex-wrap content-start items-start gap-3">
          <button
            type="button"
            onClick={() => actions.toggleLike(`video:${video.id}`)}
            aria-pressed={liked}
            aria-label={`${liked ? "Unlike" : "Like"} ${video.title}`}
            className={classNames(
              "flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-colors",
              liked
                ? "border-pmred bg-pmred text-white"
                : "border-neutral-700 text-neutral-300 hover:border-pmred hover:text-pmred"
            )}
          >
            {liked ? <HeartSolidIcon className="size-4" /> : <HeartIcon className="size-4" />}
            {formatNumber(video.likes + (liked ? 1 : 0))}
          </button>
          <button
            type="button"
            onClick={shareVideo}
            className="flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-pmred hover:text-pmred"
          >
            <ShareIcon className="size-4" />
            Share
          </button>
          {manualShare && (
            <label className="w-full text-xs text-neutral-400">
              Video link
              <input
                readOnly
                value={manualShare}
                onFocus={(event) => event.target.select()}
                className="mt-2 block w-full rounded border border-neutral-700 bg-neutral-900 p-3 text-white"
              />
            </label>
          )}
        </div>
      </section>
      <section className="border-t border-neutral-800 px-5 py-9 md:px-10 md:py-12">
        <CommentThread dark threadId={`video:${video.id}`} className="max-w-3xl" />
      </section>
      <section aria-labelledby="more-videos-heading" className="border-t border-neutral-800 pb-8">
        <div className="flex items-center justify-between px-5 py-7 md:px-10">
          <h2
            id="more-videos-heading"
            className="text-xs font-extrabold uppercase tracking-[0.2em]"
          >
            More videos
          </h2>
          <span className="text-2xs uppercase tracking-widest text-neutral-400">Keep watching</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <VideoCard key={item.id} video={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
