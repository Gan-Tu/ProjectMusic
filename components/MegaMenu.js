import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faPinterestP,
  faSoundcloud,
  faTumblr,
  faTwitter,
  faVimeoV,
  faVine,
  faWikipediaW,
  faYoutube
} from "@fortawesome/free-brands-svg-icons";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import {
  ArrowDownTrayIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  HandThumbUpIcon,
  HomeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  MusicalNoteIcon,
  NewspaperIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PhotoIcon,
  ShareIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TicketIcon,
  UserIcon,
  VideoCameraIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useUI, MEGA_MENU_TABS } from "../lib/ui";
import { classNames } from "../lib/format";
import { TabList, tabPanelProps } from "./ui/Tabs";
import { CapIcon, CreditsIcon, CrownIcon, DiscIcon, GemIcon, ShirtIcon, VinylIcon } from "./icons";

function brandIcon(icon) {
  function BrandIcon({ className }) {
    return <FontAwesomeIcon icon={icon} className={className} />;
  }
  return BrandIcon;
}

// `href` items navigate; `action` items open a pop-up.
export const MENUS = {
  home: [
    { label: "Artists", href: "/artists", Icon: UserIcon },
    { label: "Chat", action: "chat", Icon: ChatBubbleLeftRightIcon },
    { label: "News", href: "/news", Icon: BoltIcon },
    { label: "About", href: "/about", Icon: InformationCircleIcon },
    { label: "Videos", href: "/videos", Icon: VideoCameraIcon },
    { label: "Music", href: "/musics", Icon: MusicalNoteIcon, also: ["/albums"] },
    { label: "Pictures", href: "/pictures", Icon: PhotoIcon },
    { label: "Blog", href: "/blog", Icon: NewspaperIcon },
    { label: "Events", href: "/events", Icon: CalendarDaysIcon },
    { label: "Join List", action: "newsletter", Icon: ClipboardDocumentListIcon },
    { label: "Volunteer", href: "/volunteer", Icon: CheckBadgeIcon },
    { label: "Contact", href: "/contact", Icon: PaperAirplaneIcon }
  ],
  shop: [
    { label: "Credits", href: "/shop?category=credits", Icon: CreditsIcon },
    { label: "Subscriptions", href: "/shop?category=subscriptions", Icon: PencilSquareIcon },
    { label: "VIP", href: "/shop?category=vip", Icon: CrownIcon },
    { label: "Packages", href: "/shop?category=packages", Icon: ShoppingBagIcon },
    { label: "T-Shirts", href: "/shop?category=t-shirts", Icon: ShirtIcon },
    { label: "Hats", href: "/shop?category=hats", Icon: CapIcon },
    { label: "CDs", href: "/shop?category=cds", Icon: DiscIcon },
    { label: "Vinyl", href: "/shop?category=vinyl", Icon: VinylIcon },
    { label: "Downloads", href: "/shop?category=downloads", Icon: ArrowDownTrayIcon },
    { label: "Tickets", href: "/shop?category=tickets", Icon: TicketIcon },
    { label: "Accessories", href: "/shop?category=accessories", Icon: GemIcon },
    { label: "Exclusive", href: "/shop?category=exclusive", Icon: LockClosedIcon }
  ],
  socials: [
    { label: "Instagram", href: "/socials/instagram", Icon: brandIcon(faInstagram) },
    { label: "YouTube", href: "/socials/youtube", Icon: brandIcon(faYoutube) },
    { label: "Twitter", href: "/socials/twitter", Icon: brandIcon(faTwitter) },
    { label: "SoundCloud", href: "/socials/soundcloud", Icon: brandIcon(faSoundcloud) },
    { label: "Facebook", href: "/socials/facebook", Icon: brandIcon(faFacebookF) },
    { label: "Tumblr", href: "/socials/tumblr", Icon: brandIcon(faTumblr) },
    { label: "Vimeo", href: "/socials/vimeo", Icon: brandIcon(faVimeoV) },
    { label: "MySpace", href: "/socials/myspace", Icon: brandIcon(faUsers) },
    { label: "Vine", href: "/socials/vine", Icon: brandIcon(faVine) },
    { label: "Pinterest", href: "/socials/pinterest", Icon: brandIcon(faPinterestP) },
    { label: "Wikipedia", href: "/socials/wikipedia", Icon: brandIcon(faWikipediaW) },
    { label: "Like/Follow", href: "/socials", Icon: HandThumbUpIcon }
  ]
};

const TAB_META = {
  home: { label: "Home menu", Icon: HomeIcon },
  shop: { label: "Shop menu", Icon: ShoppingCartIcon },
  socials: { label: "Social menu", Icon: ShareIcon }
};

function isActive(item, asPath) {
  if (!item.href) return false;
  const [path, query] = item.href.split("?");
  if (query) return asPath === item.href;
  const current = asPath.split(/[?#]/)[0];
  return [path, ...(item.also || [])].some((p) =>
    p === "/socials" ? current === p : current === p || current.startsWith(`${p}/`)
  );
}

// The black tab strip that replaces the left side of the header while open.
export function MegaMenuTabs() {
  const { megaMenu, setMegaMenuTab, closeMegaMenu } = useUI();
  return (
    <div className="flex h-full items-stretch">
      <TabList
        idBase="mega-menu-tabs"
        label="Menu categories"
        tabs={MEGA_MENU_TABS.map((tab, i) => {
          const { label, Icon } = TAB_META[tab];
          return {
            id: tab,
            label,
            title: `${label} (${i + 1})`,
            content: (
              <>
                <Icon className="h-6 w-6" />
                <span className="sr-only">{label}</span>
              </>
            )
          };
        })}
        value={megaMenu.tab}
        onChange={setMegaMenuTab}
        className="flex bg-black"
        tabClassName={(selected) =>
          classNames(
            "flex w-14 items-center justify-center border-b-2 transition-colors sm:w-[4.5rem]",
            selected
              ? "border-white bg-neutral-950 text-white"
              : "border-transparent text-neutral-600 hover:text-neutral-300"
          )
        }
      />
      <button
        type="button"
        onClick={closeMegaMenu}
        aria-label="Close menu"
        className="flex items-center px-4 text-pmred transition hover:text-pmred-dark sm:px-6"
      >
        <XMarkIcon className="h-7 w-7" />
      </button>
    </div>
  );
}

// The dropdown grid of the active tab (rendered by the header while open).
export default function MegaMenu() {
  const router = useRouter();
  const { megaMenu, closeMegaMenu, openModal } = useUI();
  const gridRef = useRef(null);
  const items = MENUS[megaMenu.tab];

  // Opening the menu moves focus into the grid; switching categories from the tabs
  // (arrow keys or a click) leaves focus on the tabs.
  useEffect(() => {
    if (document.activeElement?.closest('[role="tablist"]')) return;
    gridRef.current?.querySelector("[data-menu-item]")?.focus({ preventScroll: true });
  }, [megaMenu.tab]);

  // Arrow keys move through the 4-column grid ("next menu selection").
  function onKeyDown(e) {
    const nodes = Array.from(gridRef.current?.querySelectorAll("[data-menu-item]") || []);
    const index = nodes.indexOf(document.activeElement);
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 };
    if (e.key === "Escape") {
      e.preventDefault();
      closeMegaMenu();
    } else if (moves[e.key] !== undefined && nodes.length) {
      e.preventDefault();
      e.stopPropagation();
      const next = index < 0 ? 0 : (index + moves[e.key] + nodes.length) % nodes.length;
      nodes[next].focus();
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={closeMegaMenu}
        className="fixed inset-0 top-16 z-40 animate-fade-in bg-black/60"
      />
      <nav
        id="mega-menu-panel"
        aria-label={TAB_META[megaMenu.tab].label}
        onKeyDown={onKeyDown}
        className="absolute left-0 top-16 z-50 w-full animate-fade-in bg-neutral-950 shadow-2xl sm:w-[34rem]"
      >
        <div {...tabPanelProps("mega-menu-tabs", megaMenu.tab)}>
          <ul ref={gridRef} className="grid grid-cols-4">
            {items.map(({ label, href, action, Icon, also }) => {
              const active = isActive({ href, also }, router.asPath);
              const classes = classNames(
                "group flex aspect-square w-full flex-col items-center justify-center gap-3 px-0 text-center text-2xs font-semibold uppercase tracking-normal sm:px-1 sm:tracking-wide outline-none transition-colors sm:aspect-[4/3.3] sm:text-xs",
                active ? "bg-pmred text-white" : "text-white hover:bg-pmred focus-visible:bg-pmred"
              );
              const iconClasses = classNames(
                "h-7 w-7 sm:h-9 sm:w-9",
                active
                  ? "text-white"
                  : "text-pmred group-hover:text-white group-focus-visible:text-white"
              );
              return (
                <li key={label}>
                  {href ? (
                    <Link
                      href={href}
                      data-menu-item
                      aria-current={active ? "page" : undefined}
                      onClick={closeMegaMenu}
                      className={classes}
                    >
                      <Icon className={iconClasses} />
                      {label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      data-menu-item
                      onClick={() => openModal(action)}
                      className={classes}
                    >
                      <Icon className={iconClasses} />
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
