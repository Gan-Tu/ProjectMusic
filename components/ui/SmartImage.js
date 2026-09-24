import Image from "next/image";
import { isOptimizableSrc } from "../../lib/imageHosts";

// Drop-in for next/image that also accepts admin-pasted URLs on any host: sources the
// optimizer isn't configured for (unknown hosts, data:/blob: URLs) render unoptimized
// instead of throwing. Takes the same props (ref included) as next/image; renders
// nothing without a src (an empty image field), leaving the placeholder background.
export default function SmartImage({ src, alt, unoptimized, ...props }) {
  if (!src) return null;
  return (
    <Image src={src} alt={alt} unoptimized={unoptimized || !isOptimizableSrc(src)} {...props} />
  );
}
