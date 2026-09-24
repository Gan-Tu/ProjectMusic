import { useEffect, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/20/solid";
import { classNames } from "../../lib/format";
import { URL_HINT, fromMmSs, isValidUrlInput, toMmSs } from "./format";
import { CONTROL } from "./ui";

const SMALL_BUTTON =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-pmred disabled:opacity-30 sm:h-8 sm:w-8";
const CELL_INPUT = classNames(CONTROL, "h-10 px-3 text-sm sm:h-9");

function DurationCell({ value, onChange, label }) {
  const [text, setText] = useState(null);
  const invalid = text !== null && fromMmSs(text) === null;
  return (
    <input
      value={text ?? toMmSs(value)}
      onChange={(event) => {
        setText(event.target.value);
        const seconds = fromMmSs(event.target.value);
        if (seconds !== null) onChange(seconds);
      }}
      onBlur={() => !invalid && setText(null)}
      aria-label={label}
      aria-invalid={invalid || undefined}
      placeholder="3:30"
      className={classNames(
        CELL_INPUT,
        "w-20 text-center",
        invalid ? "border-pmred" : "border-neutral-200"
      )}
    />
  );
}

// Inline tracks table of an album: number (from the order), title, duration (mm:ss),
// audio URL with a play button, status; add, remove and reorder.
export default function TracksEditor({ value, onChange }) {
  const tracks = Array.isArray(value) ? value : [];
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  function play(index) {
    const src = tracks[index]?.audio_url;
    if (!src) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlaying(null));
      audioRef.current.addEventListener("error", () => setPlaying(null));
    }
    const audio = audioRef.current;
    if (playing === index) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.src = src;
    audio.play().catch(() => setPlaying(null));
    setPlaying(index);
  }

  const update = (index, patch) =>
    onChange(tracks.map((track, i) => (i === index ? { ...track, ...patch } : track)));
  const move = (index, delta) => {
    const next = [...tracks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    audioRef.current?.pause();
    setPlaying(null);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {tracks.length === 0 && <p className="text-sm text-neutral-500">No tracks yet.</p>}
      {tracks.length > 0 && (
        <ol className="divide-y divide-neutral-100 border border-neutral-200">
          {tracks.map((track, index) => {
            const label = `Track ${index + 1}`;
            return (
              <li key={track.id || `new-${index}`} className="flex flex-col gap-2 p-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="w-6 shrink-0 text-right text-xs font-extrabold text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <input
                    value={track.title || ""}
                    onChange={(event) => update(index, { title: event.target.value })}
                    placeholder="Track title"
                    aria-label={`${label} title`}
                    required
                    className={classNames(CELL_INPUT, "min-w-0 flex-1 border-neutral-200")}
                  />
                  <DurationCell
                    value={track.duration}
                    onChange={(duration) => update(index, { duration })}
                    label={`${label} duration`}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pl-8 sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => play(index)}
                    disabled={!track.audio_url}
                    aria-label={playing === index ? `Pause ${label}` : `Play ${label}`}
                    className={classNames(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30 sm:h-9 sm:w-9",
                      playing === index
                        ? "bg-pmred text-white"
                        : "bg-neutral-900 text-white hover:bg-pmred"
                    )}
                  >
                    {playing === index ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={track.audio_url || ""}
                    onChange={(event) => update(index, { audio_url: event.target.value })}
                    placeholder="https://…/track.mp3"
                    aria-label={`${label} audio URL`}
                    aria-invalid={!isValidUrlInput(track.audio_url) || undefined}
                    title={isValidUrlInput(track.audio_url) ? undefined : URL_HINT}
                    className={classNames(
                      CELL_INPUT,
                      "min-w-40 flex-1",
                      isValidUrlInput(track.audio_url) ? "border-neutral-200" : "border-pmred"
                    )}
                  />
                  <select
                    value={track.status || "published"}
                    onChange={(event) => update(index, { status: event.target.value })}
                    aria-label={`${label} status`}
                    className={classNames(CELL_INPUT, "w-32 cursor-pointer border-neutral-200")}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${label} up`}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    disabled={index === tracks.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${label} down`}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    onClick={() => {
                      audioRef.current?.pause();
                      setPlaying(null);
                      onChange(tracks.filter((_, i) => i !== index));
                    }}
                    aria-label={`Remove ${label}`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <button
        type="button"
        onClick={() =>
          onChange([...tracks, { title: "", duration: 180, audio_url: "", status: "published" }])
        }
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-neutral-300 px-4 py-2.5 text-2xs font-bold uppercase tracking-wider text-neutral-500 transition hover:border-pmred hover:text-pmred sm:py-1.5"
      >
        <PlusIcon className="h-4 w-4" /> Add track
      </button>
    </div>
  );
}
