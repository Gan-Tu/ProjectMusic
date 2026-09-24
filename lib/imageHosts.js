// Remote hosts whose images next/image may optimize (https only). next.config.js builds
// `images.remotePatterns` from this list, and components/ui/SmartImage.js renders every
// other source (admin-pasted URLs on any host, data:/blob: URLs) unoptimized.
// CommonJS so next.config.js can require it.

const IMAGE_HOSTS = [
  "s3.amazonaws.com",
  "images.unsplash.com",
  "picsum.photos",
  "fastly.picsum.photos",
  "i.scdn.co",
  "assets.audiomack.com",
  "i.ytimg.com", // YouTube thumbnails (posters of YouTube videos)
  "i.vimeocdn.com"
];

// Whether the default loader can optimize this src: site-relative paths ("/home/a.webp")
// and static imports, or https URLs on a listed host.
function isOptimizableSrc(src) {
  if (src && typeof src === "object") return true; // static import
  if (typeof src !== "string" || !src) return false;
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.port && IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

module.exports = { IMAGE_HOSTS, isOptimizableSrc };
