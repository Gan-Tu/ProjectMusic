import { useEffect, useRef } from "react";
import { classNames } from "../../lib/format";

// Inline "Deleted · Undo" notice. Rendered next to what was removed (not as a
// toast) so it stays usable inside dialogs, which make the rest of the page inert.
// Give it a new `key` for each deletion to restart its timer. Keyboard focus moves to
// Undo when it appears (the deleted thing's controls are gone) and, if it's still
// there when the bar goes, to `returnFocusTo` (a ref).
export default function UndoBar({
  message,
  onUndo,
  onDone,
  duration = 6000,
  returnFocusTo,
  className
}) {
  const doneRef = useRef(onDone);
  const barRef = useRef(null);
  const undoRef = useRef(null);
  useEffect(() => {
    doneRef.current = onDone;
  });
  useEffect(() => {
    const timer = setTimeout(() => doneRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [duration]);
  useEffect(() => {
    undoRef.current?.focus({ preventScroll: true });
    const bar = barRef.current;
    const target = returnFocusTo;
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body || bar?.contains(active)) {
        target?.current?.focus({ preventScroll: true });
      }
    };
  }, [returnFocusTo]);

  return (
    <div
      ref={barRef}
      role="status"
      className={classNames(
        "flex animate-fade-in items-center justify-between gap-4 bg-neutral-900 px-4 py-2.5 text-xs text-white",
        className
      )}
    >
      <span>{message}</span>
      <button
        ref={undoRef}
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
