import { useMemo } from "react";
import { useStore } from "./store";
import { useNow } from "./useNow";

export { periodDays } from "./pricing";

const DAY = 24 * 60 * 60 * 1000;

// Expiry (ms) of download access, or 0. Passes stack: each one extends access
// from the later of the current expiry and its purchase date.
export function downloadPassUntil(purchases) {
  const ordered = [...purchases].sort((a, b) => new Date(a.date) - new Date(b.date));
  let until = 0;
  for (const purchase of ordered) {
    if (purchase.status && purchase.status !== "completed") continue; // refunded / cancelled
    const bought = new Date(purchase.date).getTime();
    for (const item of purchase.items || []) {
      if (item.entitlement?.type !== "downloads") continue;
      until = Math.max(until, bought) + item.entitlement.days * (item.qty || 1) * DAY;
    }
  }
  return until;
}

// The logged-in member's download pass (from their orders on the server).
export function useDownloadPass() {
  const { state } = useStore();
  const until = useMemo(() => downloadPassUntil(state.purchases), [state.purchases]);
  const now = useNow();
  return { until, active: now > 0 && until > now };
}
