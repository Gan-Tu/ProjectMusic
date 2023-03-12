import { useState } from "react";

export default function AudioPlayer({ curMusic }) {
  const [musicProgressValue, setMusicProgressValue] = useState(40);
  const [volumeValue, setVolumeValue] = useState(70);
  const [onPause, setOnPause] = useState(false);
  return (
    <div className="sticky bottom-0 bg-black h-24 z-30">
      <div className="grid grid-cols-5 md:grid-cols-12 h-24 place-items-center">
        <div className="flex items-center space-x-2 col-span-1 md:col-span-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={0.6}
            stroke="white"
            className="w-4 h-4 md:w-8 md:h-8 click-animation group-hover:scale-110 cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={0.6}
            stroke="white"
            className="w-8 h-8 md:w-12 md:h-12 click-animation group-hover:scale-110 cursor-pointer"
            onClick={() => setOnPause(!onPause)}
          >
            {onPause ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                />
              </>
            )}
          </svg>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={0.6}
            stroke="white"
            className="w-4 h-4 md:w-8 md:h-8 click-animation group-hover:scale-110 cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z"
            />
          </svg>
        </div>

        <div className="col-span-2 md:col-span-7 transparent-selection w-full px-1 md:px-4">
          <div className="text-white flex flex-col space-y-1 w-full">
            <span>{curMusic || "Draft Punk"}</span>
            <input
              className="slider cursor-pointer accent-white  bg-white"
              type="range"
              min="1"
              max="100"
              value={musicProgressValue}
              onChange={(e) => setMusicProgressValue(e.target.value)}
              onMouseMove={(e) => setMusicProgressValue(e.target.value)}
            />
            <div className="font-light">
              <span className="border-r border-gray-600 pr-2">01:56</span>
              <span className="pl-2 text-gray-600">03:45</span>
            </div>
          </div>
        </div>

        <div className="col-span-2 md:col-span-3">
          <div className="flex items-center">
            <div className="flex space-x-1 md:space-x-2 lg:space-x-4 xl:border-r-2 border-gray-500 py-2 pr-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={0.8}
                stroke="white"
                className="w-6 h-6 click-animation group-hover:scale-110 cursor-pointer"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                />
              </svg>
              <input
                className="slider cursor-pointer accent-white  bg-white"
                type="range"
                min="1"
                max="100"
                value={volumeValue}
                onChange={(e) => setVolumeValue(e.target.value)}
                onMouseMove={(e) => setVolumeValue(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={0.8}
                stroke="white"
                className="w-6 h-6 click-animation group-hover:scale-110 cursor-pointer rotate-180"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
                />
              </svg>
            </div>
            <div className="pl-5 hidden xl:inline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#FF0646"
                className="w-8 h-8 click-animation group-hover:scale-110 cursor-pointer"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
