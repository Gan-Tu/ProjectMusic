import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import Logo from "./Logo";
import NavMenu from "./NavMenu";
import MegaMenu, { MegaMenuTabs } from "./MegaMenu";
import SettingsMenu from "./SettingsMenu";
import ActivityMenu from "./ActivityMenu";
import MessagesMenu from "./MessagesMenu";
import { useSessionContext } from "../lib/SessionProvider";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames, formatNumber } from "../lib/format";

function CartButton({ count, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cart${count ? ` (${count} items)` : ""}`}
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

export default function Header({ curMenu }) {
  const [session, dispatch] = useSessionContext();
  const { state } = useStore();
  const { megaMenu, openMegaMenu, closeMegaMenu, openModal } = useUI();
  const user = session.user;
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
              <Link
                href="/profile"
                className="hidden items-center gap-4 text-xs font-extrabold uppercase tracking-wider md:flex"
              >
                {/* Visually hidden below xl, but it still names the link for screen readers. */}
                <span className="sr-only max-w-24 leading-tight xl:not-sr-only xl:block">
                  {user.name}
                </span>
                <span className="relative h-11 w-11 overflow-hidden bg-neutral-100">
                  <Image src={user.avatar} alt="" fill sizes="44px" className="object-cover" />
                </span>
              </Link>
              <span className={classNames(DIVIDER, "hidden md:block")} />
              <SettingsMenu />
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="hidden text-xs font-extrabold uppercase tracking-wider transition hover:text-pmred md:block"
              >
                Sign up
              </Link>
              <span className={classNames(DIVIDER, "hidden md:block")} />
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "set_user", user: {} });
                  toast.success("Welcome back, Nick!");
                }}
                className="hidden text-xs font-extrabold uppercase tracking-wider transition hover:text-pmred md:block"
              >
                Login
              </button>
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
