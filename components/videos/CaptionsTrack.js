import { videoCaptions } from "../../lib/media";

// English captions (WebVTT) for a video file: the video's own `captions` URL, else the
// captions of the matching sample clip (sample clips without sound have none).
export default function CaptionsTrack({ src, captions }) {
  const url = captions || videoCaptions(src);
  return url ? <track kind="captions" src={url} srcLang="en" label="English" /> : null;
}
