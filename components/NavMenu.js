import React from "react";
import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import Link from "next/link";

const paths = [
  // {
  //   name: "Home",
  //   href: "/"
  // },
  {
    name: "Artists",
    href: "/artists"
  },
  {
    name: "Albums",
    href: "/albums"
  },
  {
    name: "Events",
    href: "/events"
  },
  {
    name: "News",
    href: "/news"
  }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function NavMenu({ curMenu }) {
  let pathsLeft = paths.filter((x) => x.name !== curMenu);
  if (pathsLeft.length == 0) {
    return (
      <div className="text-pmred cursor-pointer transparent-selection">
        {curMenu}
      </div>
    );
  }
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={classNames(
              open ? "text-gray-900" : "text-gray-500",
              "group inline-flex items-center rounded-md bg-white text-base font-medium hover:text-gray-900 focus:outline-none"
            )}
          >
            <span className="uppercase cursor-pointer transparent-selection text-pmred line-clamp-1 max-w-xs">
              {curMenu}
            </span>
            <ChevronDownIcon
              className={classNames(
                open ? "text-gray-600" : "text-gray-400",
                "ml-2 h-5 w-5 group-hover:text-gray-700 fill-pmred"
              )}
              aria-hidden="true"
            />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-1/2 z-10 mt-3 w-52 -translate-x-1/2 transform px-2 sm:px-0">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="relative grid gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8">
                  {pathsLeft.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-m-3 block rounded-md p-3 transition duration-150 ease-in-out hover:bg-gray-50"
                    >
                      <p className="text-base font-medium text-gray-700 justify-start">
                        {item.name}
                      </p>
                      {/* <p className="mt-1 text-sm text-gray-500">
                        {item.description}
                      </p> */}
                    </Link>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
