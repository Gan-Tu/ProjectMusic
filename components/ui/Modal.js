import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../lib/format";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl"
};

// Centered pop-up in the style of the mock: white panel, uppercase title row,
// body, and an optional footer row (buttons are right-aligned).
export default function Modal({
  open,
  onClose,
  title,
  headerExtra,
  footer,
  footerStart,
  size = "md",
  children,
  className,
  bodyClassName = "px-8 py-6",
  hideClose = false
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-neutral-100/80 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
          <DialogPanel
            transition
            className={classNames(
              "relative w-full bg-white text-left shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition duration-200 ease-out data-closed:translate-y-4 data-closed:opacity-0 sm:data-closed:translate-y-0 sm:data-closed:scale-95",
              SIZES[size] || size,
              className
            )}
          >
            {(title || headerExtra) && (
              <div className="relative z-10 flex flex-wrap items-center gap-x-8 gap-y-3 px-8 py-6 pr-14 shadow-[0_10px_20px_-18px_rgba(0,0,0,0.35)]">
                {title && (
                  <DialogTitle className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    {title}
                  </DialogTitle>
                )}
                {headerExtra}
              </div>
            )}
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-5 z-20 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-pmred"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            <div className={bodyClassName}>{children}</div>
            {(footer || footerStart) && (
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-8 py-5 shadow-[0_-10px_20px_-18px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">{footerStart}</div>
                <div className="ml-auto flex items-center gap-3">{footer}</div>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

// Slide-over panel from the right (cart, playlist, chat on small screens).
export function Drawer({ open, onClose, title, children, footer, widthClassName = "max-w-md" }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition-opacity duration-300 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-6">
          <DialogPanel
            transition
            className={classNames(
              "pointer-events-auto flex h-full w-screen flex-col bg-white shadow-2xl transition duration-300 ease-out data-closed:translate-x-full",
              widthClassName
            )}
          >
            <div className="flex items-center justify-between bg-black px-6 py-5 text-white">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1 text-neutral-400 transition hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="border-t border-neutral-200 px-6 py-5">{footer}</div>}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
