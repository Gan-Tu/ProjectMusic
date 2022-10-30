import React, { useState } from "react";
import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import SettingsModal from "./SettingsModal";
import Image from "next/image";

export default function ActivityMenu({ onLogout }) {
  const [openSettings, setOpenSettings] = useState(false);
  return (
    <>
      <Popover className="relative h-full">
        {() => (
          <>
            <Popover.Button className="group flex items-center h-full rounded-md bg-white text-base font-medium hover:text-gray-900 focus:outline-none">
              <span className="uppercase cursor-pointer transparent-selection line-clamp-1 max-w-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 click-animation hover:scale-110 cursor-pointer "
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
              </span>
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
              <Popover.Panel className="absolute right-0 top-10 z-10 translate-x-1/2  transform px-2 sm:px-0 normal-case shadow-lg">
                <div className="flex flex-col  bg-white align-center justify-start gap-4 font-light p-4 text-sm min-w-full w-80 mx-2">
                  <div className="flex space-x-4 items-center border-b border-gray-300 pb-4 justify">
                    <div className="relative h-10 w-10 aspect-square cursor-pointer">
                      <Image
                        src="https://s3.amazonaws.com/projctmusic.com/little_simz_500x500_4944914752144939467.jpg"
                        layout="fill"
                        objectFit="contain"
                        objectPosition="left"
                        alt="Profile Thumbnail"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span>
                        <span className="text-pmred">Jessica</span> followed you
                      </span>
                      <span className="uppercase font-medium text-xs text-gray-700">
                        2 minutes ago
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-4 items-center border-b border-gray-300 pb-4">
                    <div className="relative h-10 w-10 aspect-square cursor-pointer">
                      <Image
                        src="https://s3.amazonaws.com/projctmusic.com/smino_500x500_3314714878444994791.jpg"
                        layout="fill"
                        objectFit="contain"
                        objectPosition="left"
                        alt="Profile Thumbnail"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span>
                        <span className="text-pmred">John</span> accept your
                        friend request
                      </span>
                      <span className="uppercase font-medium text-xs text-gray-700">
                        3 hours ago
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-4 items-center border-b border-gray-300 pb-4">
                    <div className="text-pmred w-10 pl-2">
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
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span>
                        You have a{" "}
                        <span className="text-pmred">new message</span> in your
                        inbox
                      </span>
                      <span className="uppercase font-medium text-xs text-gray-700">
                        1 day ago
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-4 items-center border-b border-gray-300 pb-4">
                    <div className="text-pmred w-10 pl-2">
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
                          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span>
                        We have sent you a{" "}
                        <span className="text-pmred">gift</span>.
                      </span>
                      <span>Check your rewards in your profile.</span>
                      <span className="uppercase font-medium text-xs text-gray-700">
                        15 September 2022
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-4 items-center border-b border-gray-300 pb-4">
                    <div className="text-pmred w-10 pl-2">
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
                          d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span>
                        <span className="text-pmred">New trophy</span> available
                        from Project Music
                      </span>
                      <span className="uppercase font-medium text-xs text-gray-700">
                        21 October 2022
                      </span>
                    </div>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      <SettingsModal isOpen={openSettings} setIsOpen={setOpenSettings} />
    </>
  );
}
