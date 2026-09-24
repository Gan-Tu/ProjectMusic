/* eslint-disable @next/next/no-img-element -- admin-pasted URLs from any host, shown as-is */
import { useState } from "react";
import { PhotoIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../lib/format";

// Small building blocks for the CRM, in the site's visual language: square white
// cards, uppercase tracked labels, pill inputs and buttons, the pmred accent.

export const LABEL = "text-2xs font-bold uppercase tracking-widest text-neutral-500";
// CONTROL has no size, padding, text size or border color, so callers can compose those
// without conflicting utilities (e.g. `classNames(CONTROL, "h-9 w-20 px-3 text-sm ...")`).
export const CONTROL =
  "rounded-full border bg-white text-neutral-900 placeholder:text-neutral-300 transition focus:border-pmred focus:outline-none focus:ring-2 focus:ring-pmred/15 disabled:bg-neutral-50 disabled:text-neutral-500";
export const INPUT = `${CONTROL} h-10 w-full border-neutral-200 px-4 text-sm`;
export const SELECT = `${CONTROL} h-10 w-full cursor-pointer border-neutral-200 pl-4 pr-8 text-sm`;
// Auto-width select for toolbars.
export const INLINE_SELECT = `${CONTROL} h-10 cursor-pointer border-neutral-200 pl-4 pr-8 text-sm`;
const TEXTAREA_BASE =
  "w-full rounded-2xl border bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-300 transition focus:border-pmred focus:outline-none focus:ring-2 focus:ring-pmred/15";
export const TEXTAREA = `${TEXTAREA_BASE} border-neutral-200 text-sm leading-6`;
export function textareaClass({ invalid = false, mono = false } = {}) {
  return classNames(
    TEXTAREA_BASE,
    invalid ? "border-pmred" : "border-neutral-200",
    mono ? "font-mono text-xs leading-5" : "text-sm leading-6"
  );
}

export function Card({ title, actions, children, className, bodyClassName }) {
  return (
    <section className={classNames("border border-neutral-200 bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          {title && <h2 className="text-xs font-extrabold uppercase tracking-widest">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={classNames("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({ label, htmlFor, help, error, children, className }) {
  return (
    <div className={classNames("flex min-w-0 flex-col gap-2", className)}>
      {label && (
        <label htmlFor={htmlFor} className={LABEL}>
          {label}
        </label>
      )}
      {children}
      {help && !error && <p className="text-xs leading-5 text-neutral-500">{help}</p>}
      {error && <p className="text-xs font-medium text-pmred">{error}</p>}
    </div>
  );
}

export function Thumb({ src, alt = "", shape = "square", className }) {
  const [failed, setFailed] = useState(null);
  const shapes = {
    square: "aspect-square",
    wide: "aspect-video",
    round: "aspect-square rounded-full"
  };
  const broken = !src || failed === src;
  return (
    <span
      className={classNames(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-neutral-100 text-neutral-300",
        shapes[shape] || shapes.square,
        className
      )}
    >
      {broken ? (
        <PhotoIcon className="h-1/2 w-1/2 max-h-8 max-w-8" aria-hidden="true" />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );
}

const STATUS_TONES = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  visible: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  new: "bg-pmred/10 text-pmred-dark ring-pmred/20",
  draft: "bg-neutral-100 text-neutral-500 ring-neutral-400/30",
  hidden: "bg-amber-50 text-amber-700 ring-amber-600/20",
  suspended: "bg-amber-50 text-amber-700 ring-amber-600/20",
  refunded: "bg-sky-50 text-sky-700 ring-sky-600/20",
  cancelled: "bg-neutral-100 text-neutral-500 ring-neutral-400/30",
  read: "bg-neutral-100 text-neutral-600 ring-neutral-400/30",
  archived: "bg-neutral-100 text-neutral-400 ring-neutral-400/30"
};

export function StatusBadge({ value, className }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider ring-1 ring-inset",
        STATUS_TONES[value] || STATUS_TONES.draft,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {value}
    </span>
  );
}

export function Spinner({ label = "Loading…", className }) {
  return (
    <div
      role="status"
      className={classNames("flex items-center gap-3 py-10 text-xs text-neutral-500", className)}
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-pmred" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children, className }) {
  return (
    <div
      className={classNames(
        "flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-300 px-6 py-12 text-center",
        className
      )}
    >
      <p className="text-xs font-extrabold uppercase tracking-widest text-neutral-500">{title}</p>
      {children && <div className="text-sm text-neutral-500">{children}</div>}
    </div>
  );
}

export function ErrorNote({ children }) {
  return (
    <p
      role="alert"
      className="border-l-4 border-pmred bg-pmred/5 px-4 py-3 text-sm text-pmred-dark"
    >
      {children}
    </p>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }) {
  return (
    <label className={classNames("relative block min-w-0", className)}>
      <span className="sr-only">Search</span>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={classNames(CONTROL, "h-10 w-full border-neutral-200 pl-10 pr-4 text-sm")}
      />
    </label>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const button =
    "rounded-full border border-neutral-200 px-4 py-1.5 text-2xs font-bold uppercase tracking-wider transition hover:border-pmred hover:text-pmred disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 pt-4">
      <button
        type="button"
        className={button}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span className="text-xs text-neutral-500">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className={button}
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

// Pill-shaped segmented control (e.g. sub-tabs, scope choice).
export function Segmented({ options, value, onChange, label, className }) {
  return (
    <div role="group" aria-label={label} className={classNames("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={classNames(
              "rounded-full border px-4 py-1.5 text-2xs font-bold uppercase tracking-wider transition-colors",
              active
                ? "border-pmred bg-pmred text-white"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-pmred hover:text-pmred"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={classNames("ml-1.5", active ? "text-white/80" : "text-neutral-400")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
