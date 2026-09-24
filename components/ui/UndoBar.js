import { useEffect, useRef } from "react";
import { classNames } from "../../lib/format";

// Inline "Deleted · Undo" notice. Rendered next to what was removed (not as a
// toast) so it stays usable inside dialogs, which make the rest of the page inert.
// Give it a new `key` for each deletion to restart its timer.
export default function UndoBar({ message, onUndo, onDone, duration = 6000, className }) {
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  useEffect(() => {
    const timer = setTimeout(() => doneRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      role="status"
      className={classNames(
        "flex animate-fade-in items-center justify-between gap-4 bg-neutral-900 px-4 py-2.5 text-xs text-white",
        className
      )}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={() => {
          onUndo();
          doneRef.current?.();
        }}
        className="text-xs font-bold uppercase tracking-wider text-pmred hover:text-white"
      >
        Undo
      </button>
    </div>
  );
}
