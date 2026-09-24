import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
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
    <div className="flex items-center gap-3 text-[11px] font-medium tabular-nums">
      <span className="w-10 text-right text-white">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(currentTime, duration || 1)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className="range-slider"
        style={{
          "--range-bg": `linear-gradient(to right, #fff 0 ${pct}%, var(--color-pmred) ${pct}% ${bufferedPct}%, rgb(255 255 255 / 0.2) ${bufferedPct}% 100%)`
        }}
      />
      <span className="w-12 text-neutral-500">
        -{formatTime(Math.max(0, duration - currentTime))}
      </span>
    </div>
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
      <div className="flex h-20 items-center gap-3 px-3 sm:gap-5 md:h-24 md:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <IconButton label="Previous track" onClick={player.prev} className="hidden sm:flex">
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
            <div className="mb-0.5 flex min-w-0 items-baseline gap-2 text-sm">
              <span className="truncate font-semibold">{track.title}</span>
              <span className="hidden truncate text-xs font-light text-neutral-400 sm:inline">
                {track.artist}
              </span>
            </div>
            <Progress fallbackDuration={track.duration} />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
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
              <span className="absolute -right-1.5 -top-1.5 text-[9px] font-bold">1</span>
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
    </div>
  );
}
