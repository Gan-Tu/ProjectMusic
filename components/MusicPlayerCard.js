import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

function MusicPlayerCard({ musicData, setCurMusic }) {
  const [onPause, setOnPause] = useState(false);

  useEffect(() => {
    setCurMusic(musicData.name);
  }, [musicData, setCurMusic, onPause]);

  return (
    <div className="cursor-pointer my-1">
      <div className="grid grid-cols-4 group">
        <div className="relative opacity-80 group-hover:opacity-100 transition-all duration-200 col-span-1 aspect-square">
          <Link href={`/musics/${musicData.id}`} key={musicData.id}>
            <Image
              src={musicData.img_url}
              layout="fill"
              objectFit="contain"
              objectPosition="left"
              alt="Track Thumbnail"
            />
          </Link>
        </div>
        <div className="col-span-3 px-10 py-4 grid grid-rows-2 group-hover:bg-pmred content-center">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div
                className="flex cursor-pointer rounded-full max-w-fit click-animation"
                onClick={() => setOnPause(!onPause)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="none"
                  className="w-10 h-10 fill-pmred group-hover:fill-white"
                >
                  {onPause ? (
                    <path
                      fillRule="evenodd"
                      d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  )}
                </svg>
              </div>
              <div className="pl-2 flex flex-col justify-start">
                <h1 className="text-ellipsis overflow-hidden font-bold uppercase group-hover:text-white line-clamp-1">
                  {musicData.name}
                </h1>
                <h2 className="text-ellipsis overflow-hidden text-neutral-500 font-light text-sm group-hover:text-neutral-200">
                  Welcome to the Nightclub
                </h2>
              </div>
            </div>
            <div className="text-sm font-bold group-hover:text-white accent-pink-500 ml-2">
              03:57
            </div>
          </div>
          <div className="border-t py-4 border-gray-200 uppercase transparent-selection text-sm group my-auto">
            <div className="flex align-middle justify-end">
              <span className="hover:text-pmred cursor-pointer text-neutral-500 group-hover:text-white px-4 border-r border-gray-300">
                Comment
              </span>
              <span className="cursor-pointer px-4 border-r border-gray-300 text-pmred group-hover:text-white">
                Like
              </span>
              <span className="hover:text-pmred cursor-pointer text-neutral-500 px-4 group-hover:text-white">
                Share
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicPlayerCard;
