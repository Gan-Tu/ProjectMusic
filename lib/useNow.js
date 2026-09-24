import { useEffect, useState } from "react";

// Current time, refreshed every minute; 0 until mounted (server render + hydration).
export function useNow(intervalMs = 60 * 1000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}
