import Image from "next/image";
import AppContainer from "../../components/AppContainer";
import { ArrowLeftIcon } from "@heroicons/react/solid";
import Link from "next/link";
import { getArtistData } from "../../utils/getFakeArtistsData";

function AlbumCard({ imgUrl, num }) {
  return (
    <div className="cursor-pointer m-1 relative">
      <div className="z-10 absolute bg-pmred text-white px-3 py-2 text-sm top-3 left-3 rounded-sm">
        {num < 9 ? `0${num + 1}` : num}
      </div>
      <div className="relative aspect-square hover:opacity-90">
        <Image
          src={`https://picsum.photos/id/${num * 7}/220`}
          layout="fill"
          objectFit="contain"
          objectPosition="left"
          alt="Profile Thumbnail"
        />
      </div>
    </div>
  );
}

export default function ArtistProfile({ artistsData }) {
  return (
    <AppContainer title={`${artistsData.name} - Profile`}>
      <div className="min-h-screen flex flex-col">
        <div className="uppercase p-8 bg-neutral-800 text-white flex text-center font-semibold text-sm transparent-selection  place-content-between drop-shadow-4">
          <div className="flex space-x-10">
            <Link href="/artists">
              <button className="text-pmred mr-5 flex items-center cursor-pointer click-animation">
                <div className="flex cursor-pointer items-center p-2 mr-4 ">
                  <ArrowLeftIcon className="h-4" />
                </div>
                Back
              </button>
            </Link>
            <div className="flex space-x-8 border-l-2 border-neutral-500 pl-10 items-center">
              <p className="text-neutral-500 cursor-pointer">Profile</p>
              <p className="cursor-pointer hover:text-neutral-200">Inbox</p>
              <p className="cursor-pointer hover:text-neutral-200">Credits</p>
              <p className="cursor-pointer hover:text-neutral-200">VIP</p>
            </div>
          </div>
          <div className="items-center space-x-14 px-8 hidden lg:inline-flex">
            <div className="flex flex-col border-r-2 pr-14 border-neutral-500 ">
              <p className="text-2xl">13K</p>
              <p className="cursor-pointer">Friends</p>
            </div>
            <div className="flex flex-col border-r-2 pr-14 border-neutral-500 ">
              <p className="text-2xl">6,9K</p>
              <p className="cursor-pointer">Followers</p>
            </div>
            <div className="flex flex-col text-pmred">
              <p className="text-2xl">3740</p>
              <p className="cursor-pointer">Credits</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-96 bg-neutral-900 transparent-selection">
          <div className="flex items-center space-x-10 my-10 px-5 sm:px-20">
            <div className="relative h-52 w-52 aspect-square cursor-pointer">
              <Image
                src={artistsData.imgUrl}
                layout="fill"
                objectFit="contain"
                objectPosition="left"
                alt="Profile Thumbnail"
              />
            </div>
            <div className="text-white flex flex-col items-start">
              <p className="cursor-pointer font-light uppercase">
                Administrator
              </p>
              <p className="cursor-pointer font-extrabold text-3xl py-4">
                {artistsData.name || "Nick Breton"}
              </p>
              <div className="flex space-x-4 py-2">
                <button className="bg-pmred rounded-full cursor-pointer px-4 py-2 items-center text-sm click-animation">
                  Follow
                </button>
                <button className="bg-transparent border rounded-full cursor-pointer px-4 py-2 items-center text-sm click-animation">
                  Message
                </button>
              </div>
            </div>
          </div>
          <div className="py-10 bg-gradient-to-bl from-neutral-900 to-neutral-800 px-5 sm:px-20">
            <h1 className="uppercase text-pmred font-semibold">
              Top 10 Artists
            </h1>
            <div className="grid grid-cols-2 mt-10">
              <ul className="text-white uppercase space-y-5 font-medium text-sm">
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5 ">01</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Taylor Swift
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5 ">02</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Kiesza Hideaway
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5 ">03</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Raign Fix Me
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5 ">04</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    John Newman
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5 ">05</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Linkin Park
                  </span>
                </li>
              </ul>
              <ul className="text-white uppercase space-y-5 font-medium text-sm">
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5">06</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Aloe Blacc
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5">07</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Mind Vortex
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5">08</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Ellie Goulding
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5">09</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Armin Van Buuren
                  </span>
                </li>
                <li className="cursor-pointer grid grid-cols-6">
                  <span className="text-pmred mw-5">10</span>
                  <span className="flex-1 col-span-5 hover:text-neutral-200">
                    Three Days Grace
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="z-50 relative">
          <div className="bg-white -translate-y-16  max-w-fit p-10 absolute shadow-2xl left-1/4">
            <div className="flex space-x-5 justify-center items-center uppercase text-xs text-neutral-700 font-light">
              <span className="cursor-pointer border-r-2 pr-5 font-semibold text-pmred ">
                Playlist
              </span>
              <span className="cursor-pointer border-r-2 pr-5 hover:text-neutral-500">
                Timeline
              </span>
              <span className="cursor-pointer border-r-2 pr-5 hover:text-neutral-500">
                Statistics
              </span>
              <span className="cursor-pointer border-r-2 pr-5 hover:text-neutral-500">
                Purchased
              </span>
              <span className="cursor-pointer border-r-2 pr-5 hover:text-neutral-500">
                Suggested
              </span>
              <span className="cursor-pointer">Rewards</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[...Array(35).keys()].map((x) => (
              <AlbumCard imgUrl={artistsData.imgUrl} key={x} num={x} />
            ))}
          </div>
        </div>
      </div>
    </AppContainer>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      artistsData: getArtistData(query.id)
    }
  };
}
