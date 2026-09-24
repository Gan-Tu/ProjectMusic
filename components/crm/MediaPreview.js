/* eslint-disable @next/next/no-img-element -- admin-pasted URLs from any host, shown as-is */
import { useState } from "react";
import { classNames } from "../../lib/format";

// YouTube / Vimeo links become embeds; anything else is treated as a direct file.
export function parseVideoUrl(value) {
  const src = String(value || "").trim();
  if (!src) return null;
  let url;
  try {
    url = new URL(src, "https://projct.local");
  } catch {
    return { type: "file", src };
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    id =
      url.searchParams.get("v") ||
      url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ||
      null;
  }
  if (id)
    return { type: "youtube", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, src };
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeoId = url.pathname.match(/(\d{5,})/)?.[1];
    if (vimeoId) {
      return {
        type: "vimeo",
        id: vimeoId,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        src
      };
    }
  }
  return { type: "file", src };
}

export function ImagePreview({ src, className }) {
  const [failed, setFailed] = useState(null);
  if (!src) return null;
  return (
    <div
      className={classNames(
        "relative flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-[repeating-conic-gradient(#f5f5f5_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]",
        className
      )}
    >
      {failed === src ? (
        <span className="px-3 text-center text-2xs font-bold uppercase tracking-wider text-pmred">
          Image not found
        </span>
      ) : (
        <img
          src={src}
          alt="Preview"
          onError={() => setFailed(src)}
          className="max-h-full max-w-full object-contain"
        />
      )}
    </div>
  );
}

export function AudioPreview({ src, className }) {
  if (!src) return null;
  return (
    <audio
      controls
      preload="none"
      src={src}
      className={classNames("h-9 w-full max-w-md", className)}
    >
      <track kind="captions" />
    </audio>
  );
}

export function VideoPreview({ src, poster, captions, className }) {
  const video = parseVideoUrl(src);
  if (!video) return null;
  return (
    <div className={classNames("aspect-video w-full max-w-md overflow-hidden bg-black", className)}>
      {video.type === "file" ? (
        <video
          controls
          preload="metadata"
          src={video.src}
          poster={poster || undefined}
          className="h-full w-full"
        >
          {captions && <track kind="captions" src={captions} srcLang="en" label="English" />}
        </video>
      ) : (
        <iframe
          src={video.embedUrl}
          title="Video preview"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          className="h-full w-full border-0"
        />
      )}
    </div>
  );
}

export default function MediaPreview({ kind, src, poster, captions, className }) {
  if (kind === "image") return <ImagePreview src={src} className={className} />;
  if (kind === "audio") return <AudioPreview src={src} className={className} />;
  if (kind === "video") {
    return <VideoPreview src={src} poster={poster} captions={captions} className={className} />;
  }
  return null;
}
