import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../lib/format";

export default function CatalogToolbar({ active, query, onSearch, count }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-5 py-5 sm:px-8">
      <nav
        aria-label="Music catalog"
        className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest"
      >
        {[
          ["Tracks", "/musics"],
          ["Albums", "/albums"]
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={active === label ? "page" : undefined}
            className={classNames(
              "cursor-pointer py-2 transition hover:text-pmred",
              active === label ? "text-pmred" : "text-neutral-400"
            )}
          >
            {label}
          </Link>
        ))}
        <span className="text-[10px] font-normal tracking-normal text-neutral-400">
          {count} releases
        </span>
      </nav>
      <label className="flex w-full items-center gap-3 rounded-full border border-neutral-200 px-4 focus-within:border-pmred focus-within:ring-2 focus-within:ring-pmred/15 sm:w-72">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          type="search"
          aria-label="Search music or artists"
          placeholder="Search music or artists"
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
        />
      </label>
    </div>
  );
}
