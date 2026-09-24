import Link from "next/link";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const paths = [
  { name: "Home", href: "/" },
  { name: "Artists", href: "/artists" },
  { name: "Videos", href: "/videos" },
  { name: "Musics", href: "/musics" },
  { name: "Albums", href: "/albums" },
  { name: "Pictures", href: "/pictures" },
  { name: "Events", href: "/events" },
  { name: "News", href: "/news" },
  { name: "Blog", href: "/blog" },
  { name: "Shop", href: "/shop" },
  { name: "Socials", href: "/socials" }
];

// The red section label next to the menu button, doubling as a quick section switcher.
export default function NavMenu({ curMenu }) {
  const label = curMenu || "Home";
  const pathsLeft = paths.filter((x) => x.name.toLowerCase() !== label.toLowerCase());

  return (
    <Popover className="relative">
      <PopoverButton className="group inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-pmred outline-none">
        <span className="line-clamp-1 max-w-[12rem]">{label}</span>
        <ChevronDownIcon
          className="h-5 w-5 text-pmred/60 transition group-hover:text-pmred group-data-open:rotate-180"
          aria-hidden="true"
        />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor="bottom start"
        className="z-[60] w-56 bg-white py-2 shadow-2xl ring-1 ring-black/5 transition duration-200 ease-out [--anchor-gap:1.25rem] data-closed:translate-y-1 data-closed:opacity-0"
      >
        {pathsLeft.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition-colors hover:bg-pmred hover:text-white"
          >
            {item.name}
          </Link>
        ))}
      </PopoverPanel>
    </Popover>
  );
}
