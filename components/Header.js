import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  RectangleStackIcon,
  ShoppingCartIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import Image from "./ui/SmartImage";
import Logo from "./Logo";
import NavMenu from "./NavMenu";
import MegaMenu, { MegaMenuTabs } from "./MegaMenu";
import SettingsMenu from "./SettingsMenu";
import ActivityMenu from "./ActivityMenu";
import MessagesMenu from "./MessagesMenu";
import { loginHref, useSessionContext } from "../lib/SessionProvider";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames, formatNumber } from "../lib/format";

function CartButton({ count, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cart${count ? ` (${count} ${count === 1 ? "item" : "items"})` : ""}`}
      className={classNames(
        "group relative flex items-center text-neutral-500 transition hover:text-pmred",
        className
      )}
    >
      <ShoppingCartIcon className="h-6 w-6 transition group-hover:scale-110" />
      {count > 0 && (
        <span className="absolute -right-3 -top-2.5 min-w-5 rounded-full bg-pmred px-1.5 text-center text-2xs font-bold leading-5 text-white">
          {count}
        </span>
      )}
    </button>
  );
}

const DIVIDER = "h-8 w-px shrink-0 bg-neutral-200";

// The member's name and photo; opens their account menu.
function AccountMenu({ user }) {
  const [session] = useSessionContext();
  const router = useRouter();
  const { openModal } = useUI();
  const items = [
    { label: "Profile", Icon: UserCircleIcon, run: () => router.push("/profile") },
    {
      label: "Purchases",
      Icon: RectangleStackIcon,
      run: () => router.push("/profile?tab=purchased")
    },
    { label: "Credits", Icon: CurrencyDollarIcon, run: () => router.push("/profile?tab=credits") },
    { label: "Settings", Icon: Cog6ToothIcon, run: () => openModal("settings") },
    {
      label: "Logout",
      Icon: ArrowRightStartOnRectangleIcon,
      run: async () => {
        const result = await session.logout();
        if (result.ok) toast.success("You have been logged out.");
        else toast.error(result.error);
      }
    }
  ];
  return (
    <Popover className="relative hidden h-full items-center md:flex">
      <PopoverButton
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-4 text-xs font-extrabold uppercase tracking-wider outline-none transition hover:text-pmred focus-visible:ring-2 focus-visible:ring-pmred focus-visible:ring-offset-4 data-open:text-pmred"
      >
        {/* Shown from 2xl (below that it would crowd the centered logo). */}
        <span className="hidden max-w-24 text-left leading-tight 2xl:block">{user.name}</span>
        <span className="relative h-11 w-11 overflow-hidden bg-neutral-100">
          <Image src={user.avatar} alt="" fill sizes="44px" className="object-cover" />
        </span>
      </PopoverButton>
      <PopoverPanel
        transition
        anchor="bottom end"
        className="z-[60] w-64 bg-pmred py-1 text-white shadow-2xl transition duration-200 ease-out [--anchor-gap:0.75rem] data-closed:translate-y-1 data-closed:opacity-0"
      >
        <div className="border-b border-white/25 px-6 py-3.5">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-white/80">@{user.username}</p>
        </div>
        {items.map(({ label, Icon, run }) => (
          <CloseButton
            key={label}
            onClick={run}
            className="flex w-full items-center gap-5 px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white hover:text-pmred focus-visible:bg-white focus-visible:text-pmred focus-visible:outline-none"
          >
            <Icon className="h-5 w-5" />
            {label}
          </CloseButton>
        ))}
      </PopoverPanel>
    </Popover>
  );
}

export default function Header({ curMenu }) {
  const [session] = useSessionContext();
  const router = useRouter();
  const { state } = useStore();
  const { megaMenu, openMegaMenu, closeMegaMenu, openModal, activeModal } = useUI();
  const user = session.user;
  // Come back here after logging in (known after hydration; the links wait for it).
  const here = session.hydrated ? router.asPath : "";
  const cartCount = state.cart.reduce((sum, line) => sum + line.qty, 0);

  // When the mega menu closes (Esc, close button, backdrop), return keyboard focus
  // to the menu button instead of dropping it on the page body.
  const openerRef = useRef(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !megaMenu.open) {
      const active = document.activeElement;
      if (!active || active === document.body) openerRef.current?.focus();
    }
    wasOpen.current = megaMenu.open;
  }, [megaMenu.open]);

  // A pop-up opened from the mega menu can't hand focus back to the item that opened
  // it (the menu closed), so if closing one leaves focus on the page body, return it
  // to the menu button (after the leave transition and the dialog's own restore).
  const hadModal = useRef(false);
  useEffect(() => {
    const closed = hadModal.current && !activeModal;
    hadModal.current = Boolean(activeModal);
    if (!closed) return;
    const timer = setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body) openerRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, [activeModal]);

  return (
    <header
      className="sticky top-0 z-50 bg-white shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)]"
      onBlur={(e) => {
        // Close the mega menu when keyboard focus leaves the header (e.g. Tab past
        // the last item) so focus never lands on content hidden behind the backdrop.
        if (megaMenu.open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
          closeMegaMenu();
        }
      }}
    >
      <div className="relative flex h-16 items-center">
        <div className="flex h-full min-w-0 flex-1 items-center">
          {megaMenu.open ? (
            <MegaMenuTabs />
          ) : (
            <>
              <button
                ref={openerRef}
                type="button"
                onClick={() => openMegaMenu()}
                aria-label="Open menu"
                aria-expanded="false"
                aria-controls="mega-menu-panel"
                className="flex h-full items-center px-4 text-neutral-900 transition hover:text-pmred md:px-6"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <span className={classNames(DIVIDER, "hidden sm:block")} />
              <div className="hidden pl-5 sm:block md:pl-7">
                <NavMenu curMenu={curMenu} />
              </div>
            </>
          )}
        </div>

        <div
          className={classNames(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm md:text-base",
            megaMenu.open && "hidden md:block"
          )}
        >
          <Logo />
        </div>

        <div className="flex h-full flex-1 items-center justify-end gap-4 pr-3 md:gap-5 md:pr-6">
          {user ? (
            <>
              <CartButton
                count={cartCount}
                onClick={() => openModal("cart")}
                className={classNames(!cartCount && "hidden sm:flex")}
              />
              <div className="hidden items-center gap-5 lg:flex">
                <MessagesMenu />
                <span className={DIVIDER} />
                <ActivityMenu />
                <span className={DIVIDER} />
              </div>
              <button
                type="button"
                onClick={() => openModal("credits")}
                className="hidden flex-col items-center leading-tight xl:flex"
                title="Buy credits"
              >
                <span className="text-sm font-extrabold text-pmred">
                  {formatNumber(state.credits)}
                </span>
                <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-600">
                  Credits
                </span>
              </button>
              <Link
                href="/profile?tab=rewards"
                className="hidden flex-col items-center leading-tight xl:flex"
                title="Your points"
              >
                <span className="text-sm font-extrabold">{formatNumber(state.points)}</span>
                <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-600">
                  Points
                </span>
              </Link>
              <AccountMenu user={user} />
              <span className={classNames(DIVIDER, "hidden md:block")} />
              <SettingsMenu />
            </>
          ) : (
            <>
              {/* Until the session is known, don't flash Login at members. */}
              <div
                className={classNames(
                  "hidden items-center gap-4 md:flex md:gap-5",
                  !session.hydrated && "invisible"
                )}
              >
                <Link
                  href={loginHref(here, "/signup")}
                  className="text-xs font-extrabold uppercase tracking-wider transition hover:text-pmred"
                >
                  Sign up
                </Link>
                <span className={DIVIDER} />
                <Link
                  href={loginHref(here)}
                  className="text-xs font-extrabold uppercase tracking-wider transition hover:text-pmred"
                >
                  Login
                </Link>
              </div>
              <CartButton
                count={cartCount}
                onClick={() => openModal("cart")}
                className={classNames(!cartCount && "hidden")}
              />
              <span className={classNames(DIVIDER, "hidden md:block")} />
              <SettingsMenu />
            </>
          )}
        </div>
      </div>
      {megaMenu.open && <MegaMenu />}
    </header>
  );
}
