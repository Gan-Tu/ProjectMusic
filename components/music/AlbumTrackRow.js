import toast from "react-hot-toast";
import { HeartIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../../lib/player";
import { useStore } from "../../lib/store";
import { classNames, formatTime, pad2 } from "../../lib/format";
import { PlayButton, TrackProgress, Equalizer } from "./TrackControls";

export default function AlbumTrackRow({ track, queue, number }) {
  const player = usePlayer();
  const { state, actions } = useStore();
  const active = player.isCurrent(track.id);
  const liked = !!state.likes[track.id];
  const saved = state.playlist.some((item) => item.id === track.id);
  return (
    <li
      className={classNames(
        "relative flex items-center gap-1 border-b border-neutral-200 px-3 py-3 sm:gap-2 sm:px-6",
        active ? "bg-pmred text-white" : "hover:bg-neutral-50"
      )}
    >
      <span
        className={classNames(
          "w-5 text-[10px] tabular-nums",
          active ? "text-white/70" : "text-neutral-400"
        )}
      >
        {pad2(number)}
      </span>
      <PlayButton track={track} queue={queue} className={active ? "text-white" : "text-pmred"} />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{track.title}</span>
      {player.isTrackPlaying(track.id) && <Equalizer />}
      <span className="px-1 text-[10px] tabular-nums">{formatTime(track.duration)}</span>
      <button
        type="button"
        aria-label={`Like ${track.title}`}
        aria-pressed={liked}
        onClick={() => actions.toggleLike(track.id)}
        className={classNames("cursor-pointer rounded-full p-2", liked && !active && "text-pmred")}
      >
        {liked ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
      </button>
      <button
        type="button"
        aria-label={`Add ${track.title} to playlist`}
        aria-pressed={saved}
        onClick={() => {
          actions.addToPlaylist(track);
          toast.success(saved ? "Already in your playlist" : "Added to your playlist");
        }}
        className="cursor-pointer rounded-full p-2"
      >
        {saved ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      </button>
      {active && <TrackProgress />}
    </li>
  );
}
