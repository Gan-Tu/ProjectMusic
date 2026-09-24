import { useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import VideoCard from "./VideoCard";

export default function VideoStrip({ videos, activeId, label = "Video collection" }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    const element = scrollRef.current;
    const active = element?.querySelector("[aria-current=page]");
    if (!element || !active) return;
    element.scrollLeft +=
      active.getBoundingClientRect().left -
      element.getBoundingClientRect().left -
      (element.clientWidth - active.clientWidth) / 2;
  }, [activeId]);

  function scroll(direction) {
    const element = scrollRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element?.scrollBy({
      left: direction * element.clientWidth * 0.75,
      behavior: reduced ? "instant" : "smooth"
    });
  }
  return (
    <section aria-label={label} className="relative min-w-0 bg-black md:px-11">
      <button
        type="button"
        aria-label="Scroll videos left"
        onClick={() => scroll(-1)}
        className="absolute top-1/3 left-0 z-10 hidden size-11 items-center justify-center bg-pmred text-white hover:bg-pmred-dark focus-visible:outline-2 focus-visible:outline-white md:flex"
      >
        <ChevronLeftIcon className="size-5" />
      </button>
      <div ref={scrollRef} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto">
        {videos.map((video) => (
          <div key={video.id} className="w-[170px] shrink-0 snap-start md:w-[220px]">
            <VideoCard video={video} active={video.id === activeId} compact />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll videos right"
        onClick={() => scroll(1)}
        className="absolute top-1/3 right-0 z-10 hidden size-11 items-center justify-center bg-pmred text-white hover:bg-pmred-dark focus-visible:outline-2 focus-visible:outline-white md:flex"
      >
        <ChevronRightIcon className="size-5" />
      </button>
    </section>
  );
}
