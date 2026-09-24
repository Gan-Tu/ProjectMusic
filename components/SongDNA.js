import { useStore } from "../lib/store";
import { classNames, seededRandom } from "../lib/format";

const KEYS = [
  "C",
  "Cm",
  "C#m",
  "D",
  "Dm",
  "Eb",
  "Em",
  "F",
  "F#m",
  "G",
  "Gm",
  "Ab",
  "Am",
  "Bb",
  "Bm"
];

// Deterministic "song DNA" for a track (tempo, key, energy).
export function songDNA(trackId) {
  const rand = seededRandom(`dna:${trackId}`);
  return {
    bpm: 72 + Math.floor(rand() * 90),
    key: KEYS[Math.floor(rand() * KEYS.length)],
    energy: 3 + Math.floor(rand() * 8)
  };
}

// Shown only when "DNA icon + information for each song" is enabled in Settings.
export default function SongDNA({ trackId, dark = false, className }) {
  const { state } = useStore();
  if (!state.settings.showSongDNA || !trackId) return null;
  const { bpm, key, energy } = songDNA(trackId);
  return (
    <span
      title="Song DNA: tempo, key and energy"
      className={classNames(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-2xs font-semibold uppercase tracking-wider",
        dark ? "text-white/60" : "text-neutral-500",
        className
      )}
    >
      <span className="rounded-xs bg-pmred px-1 text-white">DNA</span>
      {bpm} bpm · {key} · energy {energy}/10
    </span>
  );
}
