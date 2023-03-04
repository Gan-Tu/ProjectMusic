import AppContainer from "../../components/AppContainer";
import Image from "next/image";
import { getEvents } from "../../utils/getFakeEvents";
import Link from "next/link";

function getFormattedData(year, month, day) {
  // let dateStr = day < 10 ? `0${day}` : `${day}`;
  let dateStr = `${day < 10 ? "0" : ""}${day}`;
  let monthStr = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ][month - 1];
  return `${dateStr} ${monthStr} ${year}`;
}

export default function ArtistsHome({ eventData }) {
  return (
    <AppContainer curMenu={"Events"}>
      <ul
        role="list"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {eventData.map((x) => (
          <div
            className="py-5 flex flex-col border cursor-pointer hover:bg-pmred group min-h-fit"
            key={x.title}
          >
            <div className="grid grid-rows-2">
              <div className="uppercase flex flex-col items-end text-black group-hover:text-white mb-10 mr-10 mt-5">
                <h1 className="font-medium text-xs">
                  {getFormattedData(x.year, x.month, x.day)}
                </h1>
                <time className="font-semibold text-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-pmred mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {x.time}
                </time>
              </div>

              <div className="uppercase grid grid-cols-8 relative">
                <span className="absolute text-6xl text-neutral-200 z-0 group-hover:text-white -top-10 px-4 font-extralight scale-x-110">
                  {`${x.day < 10 ? "0" : ""}${x.day}`}
                </span>
                <div className="z-10 col-start-2 col-end-8 py-4 pl-4 pr-8 bg-white group-hover:bg-black flex items-center">
                  <h1 className="font-bold text-pmred group-hover:text-white text-3xl">
                    {x.title}
                  </h1>
                </div>
                <div className="bg-white group-hover:bg-black z-10"></div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-8 relative mt-5">
                <div className="flex flex-col col-start-2 col-end-8 py-10 pl-4 pr-8 border-y border-gray-200 group-hover:border-opacity-50">
                  <h1 className="uppercase font-semibold text-black group-hover:text-white text-medium">
                    {x.name}
                  </h1>
                  {x.address?.map((segment) => (
                    <h2
                      key={segment}
                      className="font-light text-neutral-400 group-hover:text-white text-sm group-hover:text-opacity-70"
                    >
                      {segment}
                    </h2>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center pt-6 pb-3">
                <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-sm click-animation border-pmred border-2 text-pmred font-semibold group-hover:border-white group-hover:bg-white">
                  Get Tickets
                </button>
              </div>
            </div>
          </div>
        ))}
      </ul>
    </AppContainer>
  );
}

export async function getStaticProps() {
  return {
    props: {
      eventData: getEvents()
    }
  };
}
