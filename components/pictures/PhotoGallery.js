import { useEffect, useState } from "react";
import Image, { getImageProps } from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShareIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import { useStore } from "../../lib/store";
import { classNames, pad2 } from "../../lib/format";

// Some originals live on hosts that refuse cross-origin fetches (S3), so downloads go
// through Next's same-origin image endpoint: full size, in the original format.
function downloadUrl(src) {
  if (src.startsWith("/")) return src;
  return getImageProps({ src, alt: "", width: 1920, height: 1920 }).props.src;
}

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

export default function PhotoGallery({ photos, polaroids = false }) {
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const { state, actions } = useStore();
  const photo = selected === null ? null : photos[selected];
  useEffect(() => {
    if (selected === null || !photos.length) return;
    const onKey = (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        setSelected(
          (index) => (index + (event.key === "ArrowRight" ? 1 : -1) + photos.length) % photos.length
        );
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selected, photos.length]);
  async function download() {
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl(photo.src));
      if (!response.ok) throw new Error("Download unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${photo.id}.${EXTENSIONS[blob.type] || "jpg"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Photo downloaded");
    } catch {
      toast.error("This photo cannot be downloaded here. Use Open original to save it.");
    } finally {
      setDownloading(false);
    }
  }
  async function share() {
    try {
      const url = new URL(window.location.href);
      url.hash = photo.id;
      if (navigator.share) await navigator.share({ title: photo.caption, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        toast.success("Photo link copied");
      }
    } catch (error) {
      if (error.name !== "AbortError")
        toast.error("Could not share this photo. Copy the page address instead.");
    }
  }
  useEffect(() => {
    const openHash = () => {
      const index = photos.findIndex((item) => `#${item.id}` === window.location.hash);
      if (index >= 0) setSelected(index);
    };
    const timer = window.setTimeout(openHash, 0);
    window.addEventListener("hashchange", openHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", openHash);
    };
  }, [photos]);
  return (
    <>
      <ul
        className={classNames(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          polaroids ? "gap-5 bg-neutral-100 p-5 sm:gap-8 sm:p-10" : "gap-1"
        )}
      >
        {photos.map((item, index) => (
          <li
            key={item.id}
            className={classNames(
              "min-w-0",
              polaroids &&
                "bg-white p-2 pb-4 shadow-sm transition-transform hover:-rotate-2 motion-reduce:transform-none"
            )}
          >
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Open photo: ${item.caption}`}
              className="group relative block aspect-square w-full cursor-pointer overflow-hidden bg-neutral-100"
            >
              <Image
                src={item.src}
                alt={item.caption}
                fill
                preload={index === 0}
                // The rest of the first row (up to four columns) is visible on load too.
                loading={index > 0 && index < 4 ? "eager" : undefined}
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              {!polaroids && (
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4 pt-12 text-left text-2xs font-bold uppercase tracking-wider text-white">
                  {item.caption}
                </span>
              )}
            </button>
            {polaroids && (
              <p className="px-1 pt-4 text-center text-xs text-neutral-600">{item.caption}</p>
            )}
          </li>
        ))}
      </ul>
      <Modal
        open={!!photo}
        onClose={() => setSelected(null)}
        title={photo?.caption || "Photo"}
        size="full"
        bodyClassName="p-0"
        footer={
          photo && (
            <>
              <a
                href={photo.src}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer text-xs text-neutral-500 hover:text-pmred"
              >
                Open original
              </a>
              <button
                disabled={downloading}
                onClick={download}
                className="flex cursor-pointer items-center gap-2 p-2 text-xs font-bold uppercase text-pmred disabled:opacity-40"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {downloading ? "Saving…" : "Download"}
              </button>
              <button
                onClick={share}
                className="flex cursor-pointer items-center gap-2 p-2 text-xs font-bold uppercase text-pmred"
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </button>
            </>
          )
        }
        footerStart={
          photo && (
            <button
              aria-label="Like photo"
              aria-pressed={!!state.likes[`photo:${photo.id}`]}
              onClick={() => actions.toggleLike(`photo:${photo.id}`)}
              className="cursor-pointer p-2 text-pmred"
            >
              <HeartIcon
                className={classNames("h-5 w-5", state.likes[`photo:${photo.id}`] && "fill-pmred")}
              />
            </button>
          )
        }
      >
        {photo && (
          <div className="relative bg-neutral-950">
            <div className="relative h-[55vh] min-h-60 sm:h-[65vh]">
              <Image
                src={photo.src}
                alt={photo.caption}
                fill
                sizes="(max-width: 768px) 95vw, 1100px"
                className="object-contain"
              />
            </div>
            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
              <button
                onClick={() => setSelected((selected + photos.length - 1) % photos.length)}
                aria-label="Previous photo"
                className="cursor-pointer bg-pmred p-3 text-white"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSelected((selected + 1) % photos.length)}
                aria-label="Next photo"
                className="cursor-pointer bg-pmred p-3 text-white"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="flex justify-between px-5 py-3 text-xs text-neutral-400">
              <span>{photo.location}</span>
              <span aria-live="polite">
                {pad2(selected + 1)} / {pad2(photos.length)}
              </span>
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
