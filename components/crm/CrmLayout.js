import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  FilmIcon,
  GlobeAltIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  NewspaperIcon,
  PhotoIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UsersIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Logo from "../Logo";
import { classNames } from "../../lib/format";
import { crmFetch } from "./api";
import GlobalSearch from "./GlobalSearch";

export const NAV = [
  { href: "/crm", label: "Dashboard", icon: Squares2X2Icon, match: [""] },
  { href: "/crm/artists", label: "Artists", icon: MicrophoneIcon, match: ["artists"] },
  { href: "/crm/music", label: "Music", icon: MusicalNoteIcon, match: ["music"] },
  { href: "/crm/videos", label: "Videos", icon: FilmIcon, match: ["videos"] },
  { href: "/crm/events", label: "Events", icon: CalendarDaysIcon, match: ["events"] },
  { href: "/crm/shop", label: "Shop", icon: ShoppingBagIcon, match: ["shop", "shop-categories"] },
  {
    href: "/crm/pictures",
    label: "Pictures",
    icon: PhotoIcon,
    match: ["pictures", "photo-categories"]
  },
  { href: "/crm/posts", label: "Posts", icon: NewspaperIcon, match: ["posts"] },
  {
    href: "/crm/socials",
    label: "Socials",
    icon: GlobeAltIcon,
    match: ["socials", "social-posts"]
  },
  { href: "/crm/comments", label: "Comments", icon: ChatBubbleLeftRightIcon, match: ["comments"] },
  { href: "/crm/members", label: "Members", icon: UsersIcon, match: ["members"] },
  { href: "/crm/orders", label: "Orders", icon: ReceiptPercentIcon, match: ["orders"] },
  { href: "/crm/inbox", label: "Inbox", icon: InboxIcon, match: ["inbox"], badge: "inbox" },
  { href: "/crm/settings", label: "Settings", icon: Cog6ToothIcon, match: ["settings"] }
];

// Sidebar counts (unread inbox), kept between page navigations and reloaded when a
// page calls notifyBadges().
let cachedBadges = null;

function useBadges() {
  const [badges, setBadges] = useState(cachedBadges);
  useEffect(() => {
    let alive = true;
    const load = () =>
      crmFetch("/api/crm/badges")
        .then((data) => {
          cachedBadges = data;
          if (alive) setBadges(data);
        })
        .catch(() => {});
    load();
    window.addEventListener("crm:badges", load);
    return () => {
      alive = false;
      window.removeEventListener("crm:badges", load);
    };
  }, []);
  return badges;
}

function NavLinks({ onNavigate, badges }) {
  const router = useRouter();
  const segment = router.asPath.split(/[?#]/)[0].split("/")[2] || "";
  return (
    <nav aria-label="CRM" className="flex flex-col py-4">
      {NAV.map((item) => {
        const active = item.match.includes(segment);
        const Icon = item.icon;
        const count = item.badge ? badges?.[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "flex items-center gap-3 px-6 py-3 text-2xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pmred",
              active
                ? "bg-neutral-900 text-white shadow-[inset_4px_0_0_var(--color-pmred)]"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon
              className={classNames("h-5 w-5", active && "text-pmred-light")}
              aria-hidden="true"
            />
            {item.label}
            {count > 0 && (
              <span className="ml-auto min-w-5 rounded-full bg-pmred px-1.5 text-center text-2xs font-bold leading-5 tracking-normal text-white">
                {count > 99 ? "99+" : count}
                <span className="sr-only"> unread</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CrmLayout({ title, viewHref = "/", actions, children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const badges = useBadges();

  async function logout() {
    try {
      await crmFetch("/api/crm/logout", { method: "POST" });
    } catch (error) {
      toast.error(error.message);
    }
    router.replace("/crm/login");
  }

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <Head>
        <title>{`${title ? `${title} · ` : ""}CRM · Projct Music`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <header className="sticky top-0 z-40 flex h-16 items-center bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)]">
        <div className="flex h-full shrink-0 items-center gap-3 px-3 sm:px-5 lg:w-64 lg:border-r lg:border-neutral-200">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center text-neutral-900 transition hover:text-pmred lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <Logo href="/crm" className="min-h-10 text-xs sm:text-sm" />
          <span className="bg-black px-1.5 py-0.5 text-2xs font-bold tracking-widest text-white">
            CRM
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 px-3 sm:px-6 lg:justify-between lg:px-8">
          <h1 className="hidden min-w-0 shrink truncate text-sm font-extrabold uppercase tracking-wider xl:block">
            {title}
          </h1>
          <GlobalSearch className="hidden w-full max-w-sm md:block lg:ml-0 xl:ml-6" />
          <div className="flex shrink-0 items-center gap-1 sm:gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label="Search"
              aria-expanded={searchOpen}
              className="flex h-10 w-10 items-center justify-center text-neutral-600 transition hover:text-pmred md:hidden"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-10 min-w-10 items-center justify-center gap-1.5 px-2 py-2 text-2xs font-bold uppercase tracking-widest text-neutral-600 transition hover:text-pmred sm:flex"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              View site
            </a>
            <span className="hidden h-8 w-px bg-neutral-200 sm:block" aria-hidden="true" />
            <button
              type="button"
              onClick={logout}
              className="hidden min-h-10 min-w-10 items-center justify-center gap-1.5 px-2 py-2 text-2xs font-bold uppercase tracking-widest text-neutral-600 transition hover:text-pmred sm:flex"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>
      {searchOpen && (
        <div className="sticky top-16 z-30 border-b border-neutral-200 bg-white px-3 py-3 shadow-sm md:hidden">
          <GlobalSearch autoFocus onNavigate={() => setSearchOpen(false)} />
        </div>
      )}

      <Dialog open={open} onClose={setOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 transition-opacity duration-200 data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-black transition duration-200 ease-out data-closed:-translate-x-full"
          >
            <div className="flex h-16 items-center justify-between px-6">
              <span className="text-2xs font-bold uppercase tracking-[0.3em] text-white">
                Projct CRM
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-neutral-400 transition hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} badges={badges} />
            <div className="mt-auto flex flex-col border-t border-white/10 py-4">
              <a
                href={viewHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-6 py-3 text-2xs font-bold uppercase tracking-widest text-neutral-400 transition hover:bg-white/5 hover:text-white"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                View site
              </a>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-3 px-6 py-3 text-left text-2xs font-bold uppercase tracking-widest text-neutral-400 transition hover:bg-white/5 hover:text-white"
              >
                <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                Logout
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto bg-black lg:block">
          <NavLinks badges={badges} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 xl:hidden">
            <h1 className="text-lg font-extrabold uppercase tracking-wide">{title}</h1>
          </div>
          {actions && <div className="mb-6 flex flex-wrap items-center gap-3">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
