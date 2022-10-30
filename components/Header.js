import Image from "next/image";
import Link from "next/link";
import NavMenu from "./NavMenu";
import MegaMenu from "./MegaMenu";
import SettingsMenu from "./SettingsMenu";
import ActivityMenu from "./ActivityMenu";
import { MenuIcon } from "@heroicons/react/solid";
import { useSessionContext } from "../lib/SessionProvider";
import { useState } from "react";

export default function Header({ curMenu }) {
  const [session, dispatch] = useSessionContext();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 grid grid-cols-4 xl:grid-cols-3 bg-white shadow-md px-2 md:px-10">
      <div className="flex items-center uppercase font-extrabold text-md space-x-3 col-span-1">
        {menuOpen ? (
          <div className="h-full -ml-2 md:-ml-10 items-center relative w-full">
            <MegaMenu curMenu={curMenu} onClose={() => setMenuOpen(false)} />
          </div>
        ) : (
          <>
            <button
              className="flex cursor-pointer items-center space-x-2 p-2 border-r pr-4 md:-ml-5"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon className="h-6" />
            </button>
            <div className="cursor-pointer transparent-selection pl-2 hidden lg:inline-flex">
              <NavMenu curMenu={curMenu} />
            </div>
          </>
        )}
      </div>

      <div className="justify-center flex cursor-pointer col-span-1">
        <div className="relative h-16 w-40 hidden lg:inline-flex">
          {/* TODO: change to home page after done */}
          <Link href="/artists">
            <div>
              <Image
                src="https://pm-vue.projctone.com/static/img/logo.98d7b40.png"
                layout="fill"
                objectFit="contain"
                objectPosition="left"
                alt="Project Music logo"
              />
            </div>
          </Link>
        </div>
      </div>

      <div className="flex space-x-5 uppercase font-extrabold text-md cursor-pointer transparent-selection items-center justify-end col-span-2 xl:col-span-1">
        {session.user ? (
          <>
            <div className="flex items-center">
              <div className="flex mx-4 space-x-5 text-gray-600 items-center">
                <div className="relative flex click-animation hover:scale-110 cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  <div className="z-10 absolute bg-pmred text-white text-xs rounded-md -right-2 -top-1 px-1">
                    12
                  </div>
                </div>
                <div className="border-x border-gray-400 px-4 py-1">
                  <ActivityMenu />
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-pmred text-sm">3740</span>
                  <span className="text-xs font-medium">Credits</span>
                </div>
                <div className="flex flex-col text-center border-gray-400 border-l pl-4">
                  <span className="text-sm">21,665</span>
                  <span className="text-xs font-medium">Points</span>
                </div>
              </div>
              <div className="border-r pr-4 hidden md:inline-flex items-center space-x-4 font-semibold">
                <span className="uppercase text-sm md:text-md">
                  Nick Breton
                </span>
                <div className="relative h-12 w-12 rounded-sm">
                  <div className="uppercase">
                    <Image
                      src="https://s3.amazonaws.com/projctmusic.com/party_favor_500x500_4517214868832703424.jpeg"
                      layout="fill"
                      objectFit="contain"
                      objectPosition="left"
                      alt="User logo"
                    />
                    {/* Log Out */}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex cursor-pointer items-center text-gray-400 h-full">
              <SettingsMenu onLogout={() => dispatch({ type: "unset_user" })} />
            </div>
          </>
        ) : (
          <>
            <div className="border-r pr-4 hidden md:inline-flex">Sign Up</div>
            <div className="pr-4 hidden md:inline-flex">
              <button
                className="uppercase"
                onClick={() =>
                  dispatch({ type: "set_user", user: "Nick Brenton" })
                }
              >
                Login
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
