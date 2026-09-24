/* eslint-disable @next/next/no-img-element -- admin-pasted URLs from any host, shown as-is */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../lib/format";
import { crmFetch } from "./api";
import { CONTROL } from "./ui";

const LABELS = {
  artist: "Artists",
  album: "Albums",
  track: "Tracks",
  video: "Videos",
  event: "Events",
  product: "Products",
  post: "Posts",
  member: "Members"
};

// Top-bar search across artists, albums, tracks, videos, events, products, posts and
// members; picking a result opens its editor (a track opens its album).
export default function GlobalSearch({ className, autoFocus = false, onNavigate }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ q: "", results: [], loading: false });
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return undefined;
    let alive = true;
    const timer = setTimeout(() => {
      setState((current) => ({ ...current, loading: true }));
      crmFetch(`/api/crm/search?q=${encodeURIComponent(term)}`)
        .then(({ results }) => alive && setState({ q: term, results, loading: false }))
        .catch(() => alive && setState({ q: term, results: [], loading: false }));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [term]);

  const active = term.length >= 2;
  const results = active && state.q ? state.results : [];
  let lastType = null;

  return (
    <Combobox
      value={null}
      onChange={(item) => {
        if (!item) return;
        setQuery("");
        onNavigate?.();
        router.push(item.href);
      }}
    >
      <div className={classNames("relative", className)}>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <ComboboxInput
          aria-label="Search the CRM"
          placeholder="Search artists, music, members…"
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={classNames(
            CONTROL,
            "h-10 w-full border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm"
          )}
        />
      </div>
      {active && (
        <ComboboxOptions
          anchor="bottom start"
          className="z-50 mt-2 max-h-[70vh] w-[var(--input-width)] min-w-80 overflow-y-auto border border-neutral-200 bg-white py-2 shadow-xl empty:invisible"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-neutral-500">
              {state.loading || state.q !== term ? "Searching…" : `Nothing matches “${term}”.`}
            </p>
          ) : (
            results.map((item) => {
              const heading = item.type !== lastType ? LABELS[item.type] : null;
              lastType = item.type;
              return (
                <div key={`${item.type}:${item.id}`}>
                  {heading && (
                    <p className="px-4 pb-1 pt-3 text-2xs font-bold uppercase tracking-widest text-neutral-400 first:pt-1">
                      {heading}
                    </p>
                  )}
                  <ComboboxOption
                    value={item}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2 data-focus:bg-neutral-100"
                  >
                    <span
                      className={classNames(
                        "relative h-8 w-8 shrink-0 overflow-hidden bg-neutral-100",
                        item.type === "member" && "rounded-full"
                      )}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{item.title}</span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-neutral-500">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                  </ComboboxOption>
                </div>
              );
            })
          )}
        </ComboboxOptions>
      )}
    </Combobox>
  );
}
