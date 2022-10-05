import Image from "next/image";
import { useRouter } from "next/router";
import { MenuIcon, DotsHorizontalIcon } from "@heroicons/react/solid";

export default function Header() {
  const router = useRouter();
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
          <Image
            src="https://pm-vue.projctone.com/static/img/logo.98d7b40.png"
            layout="fill"
            objectFit="contain"
            objectPosition="left"
            alt="Project Music logo"
            onClick={() => router.push("/")}
          />
        </div>
      </div>

      <div className="flex space-x-5 uppercase font-extrabold text-md cursor-pointer transparent-selection items-center justify-end">
        <div className="border-r pr-4">Sign Up</div>
        <div className="border-r pr-4">Login</div>
        <div className="flex cursor-pointer items-center text-gray-400">
          <DotsHorizontalIcon className="h-6" />
        </div>
      </div>
    </header>
  );
}
