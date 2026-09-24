import { useEffect, useRef, useState } from "react";

export default function SongCounter() {
  const element = useRef(null);
  const [count, setCount] = useState(23652);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !window.IntersectionObserver) return;
    let frame;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / 1500, 1);
          setCount(Math.round(23652 * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(element.current);
    function stopAnimation() {
      if (media.matches) {
        cancelAnimationFrame(frame);
        observer.disconnect();
        setCount(23652);
      }
    }
    media.addEventListener("change", stopAnimation);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      media.removeEventListener("change", stopAnimation);
    };
  }, []);
  return (
    <div ref={element}>
      <h2 className="mb-4 text-2xl font-extrabold uppercase tracking-widest">Songs</h2>
      <p
        className="text-[clamp(4.5rem,11vw,8rem)] font-extralight leading-none tracking-tight text-pmred"
        aria-label="23,652 songs"
      >
        <span aria-hidden="true">{count.toLocaleString("en-US")}</span>
      </p>
    </div>
  );
}
