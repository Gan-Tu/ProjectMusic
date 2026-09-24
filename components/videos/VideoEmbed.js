import { useEffect, useRef } from "react";
import { parseVideoUrl } from "../../lib/media";
import { usePlayer } from "../../lib/player";

const ORIGINS = {
  youtube: "https://www.youtube-nocookie.com",
  vimeo: "https://player.vimeo.com"
};

// Playback state from a YouTube / Vimeo player message: 1 playing, 2 stopped.
function embedState(data) {
  if (data?.event === "onStateChange") return data.info === 1 ? 1 : 2;
  if (data?.event === "infoDelivery" && data.info?.playerState !== undefined) {
    return data.info.playerState === 1 ? 1 : 2;
  }
  if (data?.event === "play") return 1;
  if (data?.event === "pause" || data?.event === "ended") return 2;
  return undefined;
}

// A YouTube or Vimeo video in its own (privacy-enhanced) player. Mounted once the
// viewer pressed play, so it autoplays. The music pauses when the video starts, and
// the video pauses when the music starts again (lib/player.js).
export default function VideoEmbed({ src, title, className }) {
  const frameRef = useRef(null);
  const { pause } = usePlayer();
  const video = parseVideoUrl(src);
  const embedSrc =
    video.type === "youtube" && typeof window !== "undefined"
      ? `${video.embedUrl}&origin=${encodeURIComponent(window.location.origin)}`
      : video.embedUrl;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let playing = false;
    function onMessage(event) {
      if (event.source !== frame.contentWindow) return;
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const state = embedState(data);
      if (state === undefined) return;
      if (state === 1 && !playing) pause();
      playing = state === 1;
    }
    // Subscribe to the player's state changes.
    function onLoad() {
      const send = (message) =>
        frame.contentWindow?.postMessage(JSON.stringify(message), ORIGINS[video.type]);
      if (video.type === "youtube") {
        send({ event: "listening", id: 1, channel: "widget" });
      } else {
        for (const value of ["play", "pause", "ended"]) send({ method: "addEventListener", value });
      }
    }
    window.addEventListener("message", onMessage);
    frame.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("message", onMessage);
      frame.removeEventListener("load", onLoad);
    };
  }, [video.type, pause]);

  if (video.type === "file") return null;
  return (
    <iframe
      ref={frameRef}
      src={embedSrc}
      title={title}
      data-video-embed={video.type}
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={className}
    />
  );
}
