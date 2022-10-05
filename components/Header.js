import Image from "next/image";
import { MenuIcon, DotsHorizontalIcon } from "@heroicons/react/solid";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 grid grid-cols-3 bg-white px-2 shadow-md md:px-10">
      <div className="flex items-center uppercase font-extrabold text-md space-x-3">
        <div className="flex cursor-pointer items-center space-x-2 p-2">
          <MenuIcon className="h-6" />
        </div>
        <div className="text-pmred border-l pl-4 cursor-pointer transparent-selection">
          Video
        </div>
      </div>

      <div className="justify-center flex cursor-pointer">
        <div className="relative h-16 w-40">
          {/* TODO: change to home page after done */}
          <Link href="/artists">
            <Image
              src="https://pm-vue.projctone.com/static/img/logo.98d7b40.png"
              layout="fill"
              objectFit="contain"
              objectPosition="left"
              alt="Project Music logo"
            />
          </Link>
        </div>
      </div>

      <div className="flex space-x-5 uppercase font-extrabold text-md cursor-pointer transparent-selection items-center justify-end">
        <div className="border-r pr-4 hidden md:inline-flex">Sign Up</div>
        <div className="border-r pr-4 hidden md:inline-flex">Login</div>
        <div className="flex cursor-pointer items-center text-gray-400">
          <DotsHorizontalIcon className="h-6" />
        </div>
      </div>
    </header>
  );
}
