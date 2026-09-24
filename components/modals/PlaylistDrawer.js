import { useState } from "react";
import Image from "next/image";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { MusicalNoteIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Drawer } from "../ui/Modal";
import UndoBar from "../ui/UndoBar";
import Button from "../ui/Button";
import { usePlayer } from "../../lib/player";
import { useStore } from "../../lib/store";
import { classNames } from "../../lib/format";

function TrackRow({ track, current, playing, onPlay, onRemove }) {
  return (
    <li
      className={classNames(
        "group flex items-center gap-3 px-6 py-2.5 transition-colors",
        current ? "bg-pmred text-white" : "hover:bg-neutral-50"
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        className="relative h-11 w-11 shrink-0 overflow-hidden bg-neutral-200"
      >
        {track.cover && (
          <Image src={track.cover} alt="" fill sizes="44px" className="object-cover" />
        )}
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity",
            current ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </span>
      </button>
      <button type="button" onClick={onPlay} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{track.title}</span>
        <span
          className={classNames(
            "block truncate text-xs",
            current ? "text-white/80" : "text-neutral-400"
          )}
        >
          {track.artist}
        </span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${track.title}`}
          className={classNames(
            "p-1 transition",
            current ? "text-white/80 hover:text-white" : "text-neutral-300 hover:text-pmred"
          )}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

// "P" shortcut: the play queue plus the user's saved playlist.
export default function PlaylistDrawer({ open, onClose }) {
  const player = usePlayer();
  const { state, actions } = useStore();
  const [tab, setTab] = useState("queue");
  const [undo, setUndo] = useState(null);

  return (
    <Drawer open={open} onClose={onClose} title="Playlist">
      <div
        className="flex border-b border-neutral-200 text-xs font-bold uppercase tracking-wider"
        role="tablist"
      >
        {[
          { id: "queue", label: `Up next (${player.queue.length})` },
          { id: "mine", label: `My playlist (${state.playlist.length})` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={classNames(
              "flex-1 border-b-2 py-3 transition",
              tab === t.id
                ? "border-pmred text-pmred"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {undo && tab === "mine" && (
        <UndoBar
          key={undo.id}
          message={undo.message}
          onUndo={undo.run}
          onDone={() => setUndo(null)}
        />
      )}
      {tab === "queue" ? (
        <ul className="py-2">
          {player.queue.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              current={i === player.index}
              playing={i === player.index && player.isPlaying}
              onPlay={() => (i === player.index ? player.togglePlay() : player.jumpTo(i))}
              onRemove={
                player.queue.length > 1 ? () => player.removeFromQueue(track.id) : undefined
              }
            />
          ))}
        </ul>
      ) : state.playlist.length ? (
        <>
          <div className="flex items-center gap-3 px-6 py-4">
            <Button size="xs" onClick={() => player.playQueue(state.playlist)}>
              <PlayIcon className="h-3.5 w-3.5" /> Play all
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                if (!player.shuffle) player.toggleShuffle();
                player.playQueue(state.playlist, Math.floor(Math.random() * state.playlist.length));
              }}
            >
              Shuffle
            </Button>
            <button
              type="button"
              onClick={() => {
                const saved = state.playlist;
                actions.clearPlaylist();
                setUndo({
                  id: Date.now(),
                  message: "Playlist cleared",
                  run: () => saved.forEach((track) => actions.addToPlaylist(track))
                });
              }}
              className="ml-auto text-2xs font-bold uppercase tracking-wider text-neutral-400 hover:text-pmred"
            >
              Clear
            </button>
          </div>
          <ul className="pb-2">
            {state.playlist.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                current={player.isCurrent(track.id)}
                playing={player.isTrackPlaying(track.id)}
                onPlay={() =>
                  player.playTrack(track, player.isCurrent(track.id) ? undefined : state.playlist)
                }
                onRemove={() => actions.removeFromPlaylist(track.id)}
              />
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
          <MusicalNoteIcon className="h-10 w-10 text-neutral-200" />
          <p className="text-sm font-bold uppercase tracking-wider">Your playlist is empty</p>
          <p className="text-xs text-neutral-400">
            Use the red + in the player (or on any track) to save songs here.
          </p>
          <Button href="/musics" variant="outline" onClick={onClose}>
            Discover music
          </Button>
        </div>
      )}
    </Drawer>
  );
}
