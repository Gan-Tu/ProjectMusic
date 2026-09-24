import { videoCaptions } from "../../lib/media";

// English captions for a sample clip (clips without sound have none).
export default function CaptionsTrack({ src }) {
  const captions = videoCaptions(src);
  return captions ? <track kind="captions" src={captions} srcLang="en" label="English" /> : null;
}
