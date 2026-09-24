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

// Whether a video URL is one of the placeholder clips above.
export function isSampleVideo(src) {
  return VIDEOS.some((video) => video.src === src);
}

const YOUTUBE_ID = /^[\w-]{11}$/;
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];
const YOUTUBE_EMBED_HOSTS = ["youtube-nocookie.com", "www.youtube-nocookie.com"];

// "1m30s", "90s" or "90" -> 90 (YouTube start times).
function startSeconds(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function youtubeId(url) {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") return url.pathname.split("/")[1];
  if (!YOUTUBE_HOSTS.includes(host) && !YOUTUBE_EMBED_HOSTS.includes(host)) return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const [, kind, id] = url.pathname.split("/");
  return ["embed", "shorts", "live", "v"].includes(kind) ? id : null;
}

function vimeoMatch(url) {
  const host = url.hostname.toLowerCase();
  if (host === "player.vimeo.com") {
    const match = /^\/video\/(\d+)/.exec(url.pathname);
    return match && { id: match[1], hash: url.searchParams.get("h") };
  }
  if (host !== "vimeo.com" && host !== "www.vimeo.com") return null;
  // vimeo.com/<id>, vimeo.com/<id>/<hash> (unlisted), vimeo.com/channels/x/<id>, ...
  const parts = url.pathname.split("/").filter(Boolean);
  const index = parts.findIndex((part) => /^\d+$/.test(part));
  if (index < 0) return null;
  const hash = /^[\da-f]{6,}$/i.test(parts[index + 1] || "") ? parts[index + 1] : null;
  return { id: parts[index], hash: hash || url.searchParams.get("h") };
}

// What kind of video a URL points to, and how to play it:
//   { type: "youtube" | "vimeo", id, embedUrl, src }  -> render an <iframe src={embedUrl}>
//   { type: "file", src }                              -> render a <video src={src}>
// Embeds autoplay by default (they're only mounted once the viewer pressed play).
export function parseVideoUrl(input, { autoplay = true } = {}) {
  const src = String(input || "").trim();
  let url;
  try {
    url = new URL(src);
  } catch {
    return { type: "file", src };
  }
  const youtube = youtubeId(url);
  if (youtube && YOUTUBE_ID.test(youtube)) {
    const params = new URLSearchParams({ rel: "0", playsinline: "1", enablejsapi: "1" });
    if (autoplay) params.set("autoplay", "1");
    const start = startSeconds(url.searchParams.get("t") || url.searchParams.get("start"));
    if (start) params.set("start", String(start));
    return {
      type: "youtube",
      id: youtube,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtube}?${params}`,
      src
    };
  }
  const vimeo = vimeoMatch(url);
  if (vimeo) {
    const params = new URLSearchParams({ dnt: "1" });
    if (vimeo.hash) params.set("h", vimeo.hash);
    if (autoplay) params.set("autoplay", "1");
    return {
      type: "vimeo",
      id: vimeo.id,
      embedUrl: `https://player.vimeo.com/video/${vimeo.id}?${params}`,
      src
    };
  }
  return { type: "file", src };
}

// A still for a video without its own poster (YouTube publishes one per video).
export function videoThumbnail(input) {
  const video = parseVideoUrl(input);
  return video.type === "youtube" ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : "";
}

// Seeded stock photo (picsum.photos), stable for a given seed.
export function picsum(seed, width, height = width) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
