import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
  BackwardIcon,
  ForwardIcon,
  HeartIcon,
  QueueListIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  PauseIcon,
  PlayIcon,
  PlusCircleIcon
} from "@heroicons/react/24/solid";
import { usePlayer, usePlayerProgress } from "../lib/player";
import SongDNA from "./SongDNA";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames, formatTime } from "../lib/format";

function Progress({ fallbackDuration }) {
  const { seek } = usePlayer();
  const { currentTime, duration: mediaDuration, buffered } = usePlayerProgress();
  const duration = mediaDuration || fallbackDuration || 0;
  const pct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? Math.max(pct, (buffered / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-3 text-xs font-medium tabular-nums">
      <span className="w-10 shrink-0 text-right text-white">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(currentTime, duration || 1)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className="range-slider min-w-0 flex-1"
        style={{
          "--range-bg": `linear-gradient(to right, #fff 0 ${pct}%, var(--color-pmred) ${pct}% ${bufferedPct}%, rgb(255 255 255 / 0.2) ${bufferedPct}% 100%)`
        }}
      />
      <span className="w-12 shrink-0 text-neutral-500">
        -{formatTime(Math.max(0, duration - currentTime))}
      </span>
    </div>
  );
}

// Volume / repeat / shuffle for small screens, where the bar has no room for them.
function MobileOptions({ player }) {
  const { volume, muted, repeat, shuffle } = player;
  const volumePct = muted ? 0 : volume * 100;
  const row = "flex items-center justify-between gap-4 py-3";
  const label = "text-2xs font-bold uppercase tracking-wider text-neutral-400";
  return (
    <Popover className="relative lg:hidden">
      <PopoverButton
        aria-label="Player options"
        className="flex items-center text-white/70 outline-none transition hover:text-white data-open:text-pmred"
      >
        <AdjustmentsHorizontalIcon className="h-6 w-6" />
      </PopoverButton>
      <PopoverPanel
        transition
        anchor="top end"
        className="z-[60] w-64 bg-neutral-900 px-5 py-2 text-white shadow-2xl ring-1 ring-white/10 transition duration-200 ease-out [--anchor-gap:1rem] data-closed:translate-y-1 data-closed:opacity-0"
      >
        <div className={row}>
          <button
            type="button"
            onClick={player.toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="text-white/80 hover:text-white"
          >
            {muted || volume === 0 ? (
              <SpeakerXMarkIcon className="h-5 w-5" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="range-slider flex-1"
            style={{ "--range-pct": `${volumePct}%` }}
          />
        </div>
        <div className={row}>
          <span className={label}>Repeat</span>
          <button
            type="button"
            onClick={player.cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
            className={classNames(
              "rounded-full border px-3 py-1 text-2xs font-bold uppercase tracking-wider transition",
              repeat === "off"
                ? "border-white/30 text-white/70"
                : "border-pmred bg-pmred text-white"
            )}
          >
            {repeat === "off" ? "Off" : repeat === "one" ? "One" : "All"}
          </button>
        </div>
        <div className={row}>
          <span className={label}>Shuffle</span>
          <button
            type="button"
            onClick={player.toggleShuffle}
            aria-pressed={shuffle}
            className={classNames(
              "rounded-full border px-3 py-1 text-2xs font-bold uppercase tracking-wider transition",
              shuffle ? "border-pmred bg-pmred text-white" : "border-white/30 text-white/70"
            )}
          >
            {shuffle ? "On" : "Off"}
          </button>
        </div>
      </PopoverPanel>
    </Popover>
  );
}

function IconButton({ label, onClick, active, className, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={classNames(
        "flex shrink-0 items-center justify-center transition hover:scale-110 active:scale-100",
        active ? "text-pmred" : "text-white/70 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

// Sticky black player bar at the bottom of every page (mounted once in _app).
export default function AudioPlayer() {
  const player = usePlayer();
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const { track, isPlaying, volume, muted, repeat, shuffle } = player;
  if (!track) return null;

  const liked = Boolean(state.likes[track.id]);
  const inPlaylist = state.playlist.some((t) => t.id === track.id);
  const volumePct = muted ? 0 : volume * 100;

  return (
    <div className="sticky bottom-0 z-40 border-t border-white/5 bg-black text-white">
      <div className="flex h-16 items-center gap-3 px-3 sm:h-20 sm:gap-5 md:h-24 md:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <IconButton label="Previous track" onClick={player.prev}>
            <BackwardIcon className="h-6 w-6" />
          </IconButton>
          <button
            type="button"
            onClick={player.togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 transition hover:scale-105 hover:border-pmred hover:bg-pmred active:scale-100 md:h-12 md:w-12"
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="ml-0.5 h-5 w-5" />
            )}
          </button>
          <IconButton label="Next track" onClick={player.next}>
            <ForwardIcon className="h-6 w-6" />
          </IconButton>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link
            href={track.albumId ? `/albums/${track.albumId}` : "/musics"}
            className="relative hidden h-12 w-12 shrink-0 overflow-hidden bg-neutral-800 sm:block md:h-14 md:w-14"
            aria-label={`Open ${track.albumName || track.title}`}
          >
            {track.cover && (
              <Image src={track.cover} alt="" fill sizes="56px" className="object-cover" />
            )}
            {isPlaying && (
              <span className="absolute inset-x-0 bottom-0 flex h-4 items-end justify-center gap-0.5 bg-linear-to-t from-black/70 pb-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-0.5 origin-bottom animate-equalizer bg-pmred"
                    style={{ height: "100%", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col text-sm sm:mb-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              <span className="truncate font-semibold">{track.title}</span>
              <span className="truncate text-xs font-light text-neutral-400">{track.artist}</span>
              <SongDNA trackId={track.id} dark className="hidden md:inline-flex" />
            </div>
            <div className="hidden sm:block">
              <Progress fallbackDuration={track.duration} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <MobileOptions player={player} />
          <IconButton
            label={liked ? "Unlike" : "Like"}
            active={liked}
            onClick={() => actions.toggleLike(track.id)}
            className="hidden sm:flex"
          >
            {liked ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
          </IconButton>
          <div className="hidden items-center gap-2 lg:flex">
            <IconButton label={muted ? "Unmute" : "Mute"} onClick={player.toggleMute}>
              {muted || volume === 0 ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </IconButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="range-slider w-24"
              style={{ "--range-pct": `${volumePct}%` }}
            />
          </div>
          <IconButton
            label={`Repeat: ${repeat}`}
            active={repeat !== "off"}
            onClick={player.cycleRepeat}
            className="relative hidden md:flex"
          >
            <ArrowPathRoundedSquareIcon className="h-5 w-5" />
            {repeat === "one" && (
              <span className="absolute -right-1.5 -top-1.5 text-2xs font-bold">1</span>
            )}
          </IconButton>
          <IconButton
            label={shuffle ? "Shuffle on" : "Shuffle off"}
            active={shuffle}
            onClick={player.toggleShuffle}
            className="hidden md:flex"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" />
          </IconButton>
          <span className="hidden h-8 w-px bg-white/15 md:block" />
          <IconButton label="Queue and playlist (P)" onClick={() => openModal("playlist")}>
            <QueueListIcon className="h-6 w-6" />
          </IconButton>
          <button
            type="button"
            aria-label={inPlaylist ? "In your playlist" : "Add to playlist"}
            title={inPlaylist ? "In your playlist" : "Add to playlist"}
            onClick={() => {
              if (inPlaylist) {
                openModal("playlist");
                return;
              }
              actions.addToPlaylist(track);
              toast.success(`Added “${track.title}” to your playlist`);
            }}
            className="shrink-0 text-pmred transition hover:scale-110 active:scale-100"
          >
            <PlusCircleIcon className={classNames("h-9 w-9", inPlaylist && "opacity-60")} />
          </button>
        </div>
      </div>
      {/* Phones: the seek bar gets a full-width row of its own. */}
      <div className="px-3 pb-2 sm:hidden">
        <Progress fallbackDuration={track.duration} />
      </div>
    </div>
  );
}
