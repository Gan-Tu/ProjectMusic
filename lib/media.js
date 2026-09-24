import { hashString } from "./format";

// Placeholder media. There are no licensed audio/video files for the catalog yet,
// so every track/video is mapped deterministically onto freely usable sample files.

const AUDIO_SAMPLE_COUNT = 16;

export function getAudioSrc(seed) {
  const n = (hashString(String(seed)) % AUDIO_SAMPLE_COUNT) + 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
}

// Sample clips. Every clip with sound has English captions in public/captions (the
// Friday captions are MDN's); the silent 10-second clips need none.
const VIDEOS = [
  {
    src: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    captions: "/captions/big-buck-bunny-trailer.vtt"
  },
  {
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
    captions: "/captions/friday.vtt"
  },
  { src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4" },
  { src: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4" },
  {
    src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4"
  }
];

export function getVideoSrc(seed) {
  return VIDEOS[hashString(String(seed)) % VIDEOS.length].src;
}

// Caption file for a sample clip, or null when the clip has no sound.
export function videoCaptions(src) {
  return VIDEOS.find((video) => video.src === src)?.captions || null;
}

// Seeded stock photo (picsum.photos), stable for a given seed.
export function picsum(seed, width, height = width) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
