import { hashString } from "./format";

// Placeholder media. There are no licensed audio/video files for the catalog yet,
// so every track/video is mapped deterministically onto freely usable sample files.

const AUDIO_SAMPLE_COUNT = 16;

export function getAudioSrc(seed) {
  const n = (hashString(String(seed)) % AUDIO_SAMPLE_COUNT) + 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
}

export const VIDEO_SOURCES = [
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4"
];

export function getVideoSrc(seed) {
  return VIDEO_SOURCES[hashString(String(seed)) % VIDEO_SOURCES.length];
}

// Seeded stock photo (picsum.photos), stable for a given seed.
export function picsum(seed, width, height = width) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
