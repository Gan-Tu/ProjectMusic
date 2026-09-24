import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { usePlayer, usePlayerProgress } from "../../lib/player";
import { classNames } from "../../lib/format";

export function PlayButton({ track, queue, className = "" }) {
  const player = usePlayer();
  const playing = player.isTrackPlaying(track.id);
  function handlePlay() {
    const sameQueue =
      !queue ||
      (queue.length === player.queue.length &&
        queue.every((item, index) => item.id === player.queue[index].id));
    // Same track and queue: plain toggle. Otherwise adopt this list as the queue
    // (playTrack still toggles when the track is already current).
    if (player.isCurrent(track.id) && sameQueue) player.togglePlay();
    else player.playTrack(track, queue);
  }
  return (
    <button
      type="button"
      aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
      onClick={handlePlay}
      className={classNames(
        "shrink-0 cursor-pointer rounded-full p-2 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2",
        className
      )}
    >
      {playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
    </button>
  );
}

export function TrackProgress() {
  const { currentTime, duration } = usePlayerProgress();
  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-black/10">
      <div
        className="h-full bg-white/90 transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Equalizer() {
  return (
    <span aria-hidden="true" className="inline-flex h-4 shrink-0 items-end gap-0.5">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="h-3 w-0.5 origin-bottom animate-equalizer bg-current motion-reduce:animate-none"
          style={{ animationDelay: `${bar * 150}ms` }}
        />
      ))}
    </span>
  );
}
