import { useSyncExternalStore } from "react";

function subscribe(onChange) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

// Whether this browser tab is in the foreground (true on the server and in hydration).
export function usePageVisible() {
  return useSyncExternalStore(
    subscribe,
    () => document.visibilityState === "visible",
    () => true
  );
}
