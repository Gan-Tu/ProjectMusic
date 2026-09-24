import { seededRandom } from "./format";

// Purchased "downloads" in the demo: a short synthesized WAV per track (unique
// melody per id). The streaming samples are cross-origin, so browsers won't save
// them as files; a generated same-origin blob downloads reliably everywhere.

const SAMPLE_RATE = 22050;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // major pentatonic-ish, in semitones

function writeString(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

export function demoTrackWav(seed, seconds = 12) {
  const rand = seededRandom(`wav:${seed}`);
  const root = 196 * 2 ** (Math.floor(rand() * 7) / 12); // around G3
  const noteLength = 0.25 + Math.floor(rand() * 3) * 0.125;
  const notes = Array.from({ length: Math.ceil(seconds / noteLength) }, () => {
    const step = SCALE[Math.floor(rand() * SCALE.length)];
    return root * 2 ** (step / 12);
  });

  const samples = Math.floor(seconds * SAMPLE_RATE);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const note = notes[Math.floor(t / noteLength)];
    const inNote = (t % noteLength) / noteLength;
    const envelope = Math.min(1, inNote * 20) * (1 - inNote) ** 1.5;
    const fade = Math.min(1, (seconds - t) * 2);
    const value =
      (Math.sin(2 * Math.PI * note * t) * 0.6 + Math.sin(2 * Math.PI * note * 2 * t) * 0.2) *
      envelope *
      fade *
      0.5;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, value)) * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

// Saves the demo audio for a purchased track as "<title>.wav".
export function downloadDemoTrack(track) {
  const url = URL.createObjectURL(demoTrackWav(track.id));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${track.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "track"}.wav`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
