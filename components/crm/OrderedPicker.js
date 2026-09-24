import { useMemo } from "react";
import { ArrowDownIcon, ArrowUpIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../lib/format";
import { useOptions } from "./api";
import { SELECT, Thumb } from "./ui";

const SMALL_BUTTON =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-pmred disabled:opacity-30 sm:h-8 sm:w-8";

// Ordered multi-select of `type` options (artists for a line-up, albums for "On
// rotation"): pick from a select, reorder with the arrows, remove with ×.
export default function OrderedPicker({ type, value, onChange, addLabel = "Add…", emptyText }) {
  const options = useOptions([type])[type];
  const byId = useMemo(
    () => new Map((options || []).map((option) => [option.value, option])),
    [options]
  );
  const selected = Array.isArray(value) ? value : [];
  const remaining = (options || []).filter((option) => !selected.includes(option.value));
  const move = (index, delta) => {
    const next = [...selected];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {selected.length === 0 ? (
        <p className="text-sm text-neutral-500">{emptyText || "Nothing picked yet."}</p>
      ) : (
        <ol className="divide-y divide-neutral-100 border border-neutral-200">
          {selected.map((id, index) => {
            const option = byId.get(id);
            return (
              <li key={id} className="flex items-center gap-3 px-3 py-2">
                <span className="w-5 text-right text-2xs font-bold text-neutral-400">
                  {index + 1}
                </span>
                <Thumb src={option?.image} className="w-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{option?.label || id}</span>
                  <span className="block truncate text-xs text-neutral-500">
                    {[
                      option?.hint,
                      option?.status === "draft" && "draft",
                      !option && options && "missing"
                    ]
                      .filter(Boolean)
                      .join(" · ") || id}
                  </span>
                </span>
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${option?.label || id} up`}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${option?.label || id} down`}
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  onClick={() => onChange(selected.filter((item) => item !== id))}
                  aria-label={`Remove ${option?.label || id}`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <select
        value=""
        onChange={(event) => event.target.value && onChange([...selected, event.target.value])}
        aria-label={addLabel}
        className={classNames(SELECT, "max-w-md")}
        disabled={!options}
      >
        <option value="">{options ? addLabel : "Loading…"}</option>
        {remaining.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.hint ? ` — ${option.hint}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
