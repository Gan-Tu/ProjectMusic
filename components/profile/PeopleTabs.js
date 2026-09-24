import Link from "next/link";
import { useRouter } from "next/router";
import { classNames } from "../../lib/format";

export function usePeopleTab(tabs, fallback) {
  const router = useRouter();
  const tab = tabs.includes(router.query.tab) ? router.query.tab : fallback;
  return { tab, router };
}

export default function PeopleTabs({ tabs, active }) {
  const router = useRouter();
  return (
    <nav
      aria-label="Profile sections"
      className="scrollbar-none flex gap-6 overflow-x-auto border-b border-neutral-200 bg-white px-5 sm:px-10"
    >
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={{ pathname: router.pathname, query: { ...router.query, tab } }}
          shallow
          scroll={false}
          aria-current={active === tab ? "page" : undefined}
          className={classNames(
            "cursor-pointer whitespace-nowrap border-b-2 py-5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-pmred",
            active === tab ? "border-pmred text-pmred" : "border-transparent text-neutral-500"
          )}
        >
          {tab}
        </Link>
      ))}
    </nav>
  );
}
