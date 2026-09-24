import Image from "../ui/SmartImage";
import Link from "next/link";
import { PauseIcon, PlayIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { usePlayer, usePlayerProgress } from "../../lib/player";
import { useStore } from "../../lib/store";
import { formatTime } from "../../lib/format";
import { LikeButton } from "./SocialFeeds";

function TrackProgress() {
  const { currentTime, duration } = usePlayerProgress();
  return (
    <div className="mt-3">
      <div
        role="progressbar"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration || 0)}
        aria-valuenow={Math.round(currentTime)}
        className="h-0.5 overflow-hidden bg-white/30"
      >
        <div
          className="h-full bg-white"
          style={{ width: `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
        />
      </div>
      <p className="mt-1 text-2xs text-white">
        {formatTime(currentTime)} / {formatTime(duration)}
      </p>
    </div>
  );
}

export function TrackList({ tracks, singleColumn = false }) {
  const { playTrack, isCurrent, isTrackPlaying } = usePlayer();
  const { state, actions } = useStore();
  return (
    <div className={`grid grid-cols-1 ${singleColumn ? "" : "lg:grid-cols-2"}`}>
      {tracks.map((track, index) => {
        const active = isCurrent(track.id);
        const playing = isTrackPlaying(track.id);
        const saved = state.playlist.some((item) => item.id === track.id);
        return (
          <article
            key={track.id}
            className={`flex min-w-0 border-b border-neutral-100 ${singleColumn ? "" : "lg:odd:border-r"} ${active ? "bg-pmred text-white" : "bg-white"}`}
          >
            <button
              type="button"
              aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
              onClick={() => playTrack(track, tracks)}
              className="group relative w-24 shrink-0 cursor-pointer overflow-hidden sm:w-32"
            >
              <Image
                src={track.cover}
                alt={`${track.albumName} cover`}
                fill
                sizes="128px"
                preload={index === 0}
                // The first rows (two columns on desktop) are on screen when the page opens.
                loading={index > 0 && index < 6 ? "eager" : undefined}
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                {playing ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
              </span>
            </button>
            <div className="min-w-0 flex-1 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => playTrack(track, tracks)}
                className="flex w-full cursor-pointer items-start gap-3 text-left"
                aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
              >
                {playing ? (
                  <PauseIcon className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <PlayIcon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "" : "text-pmred"}`} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold uppercase tracking-wider">
                    {track.title}
                  </span>
                  <span
                    className={`mt-1 block truncate text-xs ${active ? "text-white" : "text-neutral-500"}`}
                  >
                    {track.artist}
                  </span>
                </span>
                <span className={`text-2xs ${active ? "text-white" : "text-neutral-500"}`}>
                  {formatTime(track.duration)}
                </span>
              </button>
              {active && <TrackProgress />}
              <div className="mt-2 flex items-center justify-end gap-5">
                <LikeButton
                  id={`track:${track.id}`}
                  likeKey={track.id}
                  count={32 + index * 19}
                  inverse={active}
                />
                <button
                  type="button"
                  disabled={saved}
                  aria-label={
                    saved ? `${track.title} saved to playlist` : `Add ${track.title} to playlist`
                  }
                  onClick={() => {
                    actions.addToPlaylist(track);
                    toast.success("Added to your playlist");
                  }}
                  className={`flex min-h-10 cursor-pointer items-center gap-1 text-2xs uppercase tracking-wider disabled:cursor-default ${active ? "text-white" : "text-neutral-500 hover:text-pmred"}`}
                >
                  {saved ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <PlusIcon className="h-3.5 w-3.5" />
                  )}
                  {saved ? "Saved" : "Playlist"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function MyspaceProfile({ friends, tracks }) {
  return (
    <div className="grid bg-neutral-50 lg:grid-cols-[340px_1fr]">
      <aside className="border-b border-neutral-200 p-6 lg:border-r lg:p-8">
        <p className="text-2xs font-bold uppercase tracking-[0.2em] text-pmred">
          A place for friends
        </p>
        <div className="relative mt-5 aspect-square">
          <Image
            src="/socials/studio-13.webp"
            alt="A microphone in the Truth Studios live room"
            fill
            sizes="300px"
            preload
            className="object-cover"
          />
        </div>
        <h2 className="mt-6 text-xl font-extrabold uppercase tracking-wider">Truth Studios</h2>
        <p className="mt-2 text-sm italic text-neutral-500">“Good music. Good people.”</p>
        <dl className="mt-6 space-y-3 text-xs">
          <div>
            <dt className="font-bold">Location</dt>
            <dd className="mt-1 text-neutral-500">Los Angeles, California</dd>
          </div>
          <div>
            <dt className="font-bold">Mood</dt>
            <dd className="mt-1 text-neutral-500">In the studio ♪</dd>
          </div>
          <div>
            <dt className="font-bold">Who I&apos;d like to meet</dt>
            <dd className="mt-1 leading-5 text-neutral-500">
              Anyone with a song in their head and something to say.
            </dd>
          </div>
        </dl>
      </aside>
      <div className="min-w-0">
        <section className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em]">Our Top 8</h2>
            <Link href="/artists" className="cursor-pointer text-xs text-pmred hover:underline">
              All friends →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {friends.map((friend) => (
              <Link key={friend.id} href={`/artists/${friend.id}`} className="group cursor-pointer">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={friend.imgUrl}
                    alt={friend.name}
                    fill
                    sizes="(max-width: 639px) 45vw, 200px"
                    className="object-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none"
                  />
                </div>
                <p className="mt-2 text-center text-xs font-bold group-hover:text-pmred">
                  {friend.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <h2 className="border-y border-neutral-200 px-6 py-5 text-sm font-bold uppercase tracking-[0.16em] sm:px-8">
          The profile playlist
        </h2>
        <TrackList tracks={tracks} singleColumn />
      </div>
    </div>
  );
}
