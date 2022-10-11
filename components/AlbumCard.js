import React from "react";
import Image from "next/image";

function getNumberFormatted(num) {
  return num < 10 ? `0${num}` : num;
}

function AlbumCard({ musicData, num }) {
  return (
    <div className="cursor-pointer m-1 relative group">
      {num && (
        <div className="z-10 absolute bg-pmred text-white px-3 py-2 text-sm top-3 left-3 rounded-sm">
          {getNumberFormatted(num)}
        </div>
      )}
      <div className="relative aspect-square group-hover:opacity-90 group-hover:brightness-[.3] transition-all duration-200">
        <Image
          src={musicData.img_url}
          layout="fill"
          objectFit="contain"
          objectPosition="left"
          alt="Profile Thumbnail"
        />
      </div>
      <div className="z-11 absolute bottom-10 left-3 text-white space-y-1 hidden group-hover:inline transition-all duration-200 transparent-selection">
        <div className="flex cursor-pointer rounded-full max-w-fit click-animation">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="none"
            className="w-10 h-10 fill-pmred"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
            />
          </svg>
        </div>
        <p className="pl-2 text-ellipsis overflow-hidden">{musicData.name}</p>
        <p className="pl-2 text-ellipsis overflow-hidden text-xs ">
          {musicData.release_date}
        </p>
      </div>
    </div>
  );
}

export default AlbumCard;
