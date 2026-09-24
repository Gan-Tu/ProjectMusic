import { useRouter } from "next/router";
import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  QueueListIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { loginHref, useSessionContext } from "../lib/SessionProvider";
import { useUI } from "../lib/ui";
import { classNames } from "../lib/format";

// The red "…" menu at the right edge of the header.
export default function SettingsMenu() {
  const router = useRouter();
  const [session] = useSessionContext();
  const { openModal } = useUI();
  const loggedIn = Boolean(session.user);

  const items = loggedIn
    ? [
        {
          label: "Profile",
          Icon: UserCircleIcon,
          run: () => router.push("/profile"),
          mobileOnly: true
        },
        { label: "Cart", Icon: ShoppingCartIcon, run: () => openModal("cart"), mobileOnly: true },
        { label: "Notifications", Icon: GlobeAltIcon, run: () => openModal("notifications") },
        { label: "Chat", Icon: ChatBubbleLeftRightIcon, run: () => openModal("chat") },
        { label: "Settings", Icon: Cog6ToothIcon, run: () => openModal("settings") },
        { label: "Playlist", Icon: QueueListIcon, run: () => openModal("playlist") },
        { label: "Quick Navigation", Icon: Squares2X2Icon, run: () => openModal("quickNav") },
        {
          label: "Logout",
          Icon: ArrowRightStartOnRectangleIcon,
          run: async () => {
            const result = await session.logout();
            if (result.ok) toast.success("You have been logged out.");
            else toast.error(result.error);
          }
        }
      ]
    : [
        {
          label: "Login",
          Icon: ArrowLeftEndOnRectangleIcon,
          run: () => router.push(loginHref(router.asPath))
        },
        {
          label: "Sign Up",
          Icon: UserPlusIcon,
          run: () => router.push(loginHref(router.asPath, "/signup"))
        },
        { label: "Cart", Icon: ShoppingCartIcon, run: () => openModal("cart") },
        { label: "Quick Navigation", Icon: Squares2X2Icon, run: () => openModal("quickNav") }
      ];

  return (
    <Popover className="relative flex h-full items-center">
      <PopoverButton
        aria-label="More"
        className="flex h-full items-center px-1 text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-pmred focus-visible:ring-offset-4 transition hover:text-pmred data-open:text-pmred"
      >
        <EllipsisHorizontalIcon className="h-7 w-7" />
      </PopoverButton>
      <PopoverPanel
        transition
        anchor="bottom end"
        className="z-[60] w-64 bg-pmred py-1 text-white shadow-2xl transition duration-200 ease-out [--anchor-gap:0.75rem] data-closed:translate-y-1 data-closed:opacity-0"
      >
        {items.map(({ label, Icon, run, mobileOnly }) => (
          <CloseButton
            key={label}
            onClick={run}
            className={classNames(
              "flex w-full items-center gap-5 px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white hover:text-pmred focus-visible:bg-white focus-visible:text-pmred focus-visible:outline-none",
              mobileOnly && "lg:hidden"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </CloseButton>
        ))}
      </PopoverPanel>
    </Popover>
  );
}
