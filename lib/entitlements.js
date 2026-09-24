import { useEffect, useMemo, useState } from "react";
import { useStore } from "./store";

const DAY = 24 * 60 * 60 * 1000;
const UNIT_DAYS = { day: 1, week: 7, month: 30, year: 365 };

// "1 year" -> 365, "6 months" -> 180, "1 week" -> 7 ...
export function periodDays(label) {
  const match = /(\d+)\s*(day|week|month|year)/i.exec(label || "");
  return match ? Number(match[1]) * UNIT_DAYS[match[2].toLowerCase()] : 0;
}

// Latest expiry (ms) of any purchased "Unlimited Downloads" pass, or 0.
export function downloadPassUntil(purchases) {
  let until = 0;
  for (const purchase of purchases) {
    for (const item of purchase.items) {
      if (item.entitlement?.type !== "downloads") continue;
      const end = new Date(purchase.date).getTime() + item.entitlement.days * (item.qty || 1) * DAY;
      until = Math.max(until, end);
    }
  }
  return until;
}

// Current time, refreshed every minute; 0 until mounted (server render + hydration).
function useNow(intervalMs = 60 * 1000) {
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

export function useDownloadPass() {
  const { state } = useStore();
  const until = useMemo(() => downloadPassUntil(state.purchases), [state.purchases]);
  const now = useNow();
  return { until, active: now > 0 && until > now };
}
