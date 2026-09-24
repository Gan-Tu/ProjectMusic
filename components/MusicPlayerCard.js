import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { HeartIcon, PlusIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../lib/player";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames, formatTime } from "../lib/format";
import { trackPurchaseItem } from "../lib/pricing";
import { Equalizer, PlayButton, TrackProgress } from "./music/TrackControls";
import { shareAlbum } from "./music/share";
import CommentThread, { useThreadComments } from "./comments/CommentThread";

export default function MusicPlayerCard({ musicData, track, queue, priority = false }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const player = usePlayer();
  const [commentOpen, setCommentOpen] = useState(false);
  const active = player.isCurrent(track.id);
  const liked = !!state.likes[track.id];
  const saved = state.playlist.some((item) => item.id === track.id);
  const comments = useThreadComments(`album:${musicData.id}`);
  const item = trackPurchaseItem(track);

  return (
    <article className="h-full border-b border-neutral-200">
      <div
        className={classNames(
          "relative flex min-h-36 transition-colors",
          active ? "bg-pmred text-white" : "bg-white text-neutral-900"
        )}
      >
        <Link
          href={`/albums/${musicData.id}`}
          className="relative w-24 shrink-0 cursor-pointer overflow-hidden sm:w-36"
        >
          <Image
            src={musicData.img_url}
            alt={`${musicData.name} cover`}
            fill
            sizes="(max-width: 639px) 96px, 144px"
            preload={priority}
            className="object-cover transition duration-300 hover:scale-105"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 sm:px-5">
          <div className="flex items-center gap-1 sm:gap-2">
            <PlayButton
              track={track}
              queue={queue}
              className={active ? "text-white" : "text-pmred"}
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/albums/${musicData.id}`}
                className="block cursor-pointer truncate text-xs font-extrabold uppercase tracking-wide sm:text-sm"
              >
                {musicData.name}
              </Link>
              <p
                className={classNames(
                  "mt-1 truncate text-xs",
                  active ? "text-white" : "text-neutral-500"
                )}
              >
                {musicData.artist}
              </p>
            </div>
            {player.isTrackPlaying(track.id) && <Equalizer />}
            <span className="ml-1 text-2xs tabular-nums sm:text-xs">
              {formatTime(track.duration)}
            </span>
          </div>
          <div
            className={classNames(
              "mt-3 flex flex-wrap items-center justify-end gap-x-3 border-t pt-2 text-2xs font-semibold uppercase tracking-wide sm:gap-x-4",
              active ? "border-white/25 text-white" : "border-neutral-200 text-neutral-500"
            )}
          >
            <button
              type="button"
              aria-expanded={commentOpen}
              aria-controls={`comments-${track.id}`}
              onClick={() => setCommentOpen(!commentOpen)}
              className="min-h-8 cursor-pointer hover:underline"
            >
              Comment{comments.length > 0 ? ` (${comments.length})` : ""}
            </button>
            <button
              type="button"
              aria-label={`Like ${track.title}`}
              aria-pressed={liked}
              onClick={() => actions.toggleLike(track.id)}
              className={classNames(
                "flex min-h-8 cursor-pointer items-center gap-1",
                liked && !active && "text-pmred"
              )}
            >
              {liked ? <HeartSolidIcon className="h-3 w-3" /> : <HeartIcon className="h-3 w-3" />}{" "}
              Like
            </button>
            <button
              type="button"
              onClick={() => shareAlbum(musicData.id)}
              className="min-h-8 cursor-pointer hover:underline"
            >
              Share
            </button>
            <button
              type="button"
              aria-label={`Add ${track.title} to playlist`}
              aria-pressed={saved}
              onClick={() => {
                actions.addToPlaylist(track);
                toast.success(saved ? "Already in your playlist" : "Added to your playlist");
              }}
              className="cursor-pointer p-1"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openModal("purchase", { item })}
              className="min-h-8 cursor-pointer font-bold hover:underline"
            >
              Buy
            </button>
          </div>
        </div>
        {active && <TrackProgress />}
      </div>
      {commentOpen && (
        <div id={`comments-${track.id}`} className="border-t border-neutral-200 bg-neutral-50 p-4">
          <CommentThread
            threadId={`album:${musicData.id}`}
            compact
            placeholder={`Comment on ${track.title}…`}
          />
        </div>
      )}
    </article>
  );
}
