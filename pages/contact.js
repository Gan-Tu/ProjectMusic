import AppContainer from "../components/AppContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPinterestP,
  faSoundcloud,
  faTumblr,
  faTwitch,
  faVimeoV,
  faVine
} from "@fortawesome/free-brands-svg-icons";

export default function ContactHome() {
  return (
    <AppContainer curMenu={"Contact"}>
      <div className="bg-neutral-200 h-full flex flex-col">
        <div className="bg-white rounded-lg py-28 uppercase flex flex-col items-center space-y-5">
          <h1 className="font-bold tracking-wide text-pmred text-4xl">
            contact@projctmusic.com
          </h1>
          <h2 className="font-semibold tracking-wide">
            Customer Service Contact
          </h2>
        </div>

        <div className="flex-1 grid grid-rows-4 gap-10">
          <div className="grid grid-cols-8 gap-3 text-pmred uppercase font-medium items-center row-start-2">
            <div className="bg-white rounded-lg col-span-1 col-start-2">
              <div className="bg-white rounded-lg flex flex-col py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <FontAwesomeIcon
                  icon={faTwitch}
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                />
                Twitch
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <svg
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  {" "}
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />{" "}
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
                YouTube
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <FontAwesomeIcon
                  icon={faVimeoV}
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                />
                Viemo
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <svg
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  {" "}
                  <path stroke="none" d="M0 0h24v24H0z" />{" "}
                  <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
                </svg>
                Facebook
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <svg
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />{" "}
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />{" "}
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram
              </div>
            </div>
          </div>
          <div className="grid grid-cols-8 gap-3 text-pmred uppercase font-medium row-start-3">
            <div className="bg-white rounded-lg col-span-1 col-start-3">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <FontAwesomeIcon
                  icon={faTumblr}
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                />
                Tumblr
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <FontAwesomeIcon
                  icon={faVine}
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                />
                Vine
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <FontAwesomeIcon
                  icon={faPinterestP}
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                />
                Pinterst
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <FontAwesomeIcon
                  icon={faSoundcloud}
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                />
                Soundcloud
              </div>
            </div>
            <div className="bg-white rounded-lg col-span-1">
              <div className="bg-white rounded-lg flex flex-col  py-12 items-center col-span-1 col-start-2 click-animation transparent-selection cursor-pointer group hover:text-white hover:bg-pmred">
                <svg
                  className="h-8 w-8 text-pmred group-hover:text-white mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  {" "}
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
                Twitter
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppContainer>
  );
}
