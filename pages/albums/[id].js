import AppContainer from "../../components/AppContainer";
import { getMusicById } from "../../utils/getFakeTracks";
import Image from "next/image";
import { PlayIcon } from "@heroicons/react/solid";

export default function AlbumDetail({ musicData }) {
  return (
    <AppContainer curMenu={musicData?.name}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-screen">
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-black text-white flex items-center justify-center">
          <div className="flex flex-col text-end p-5 space-y-2">
            <p className="font-bold text-xl uppercase">{musicData.name}</p>
            <p className="pl-2 text-ellipsis overflow-hidden text-xs ">
              {musicData.release_date}
            </p>
          </div>
          <a href={musicData.url}>
            <div className="cursor-pointer m-1 relative group w-64">
              <div className="relative aspect-square group-hover:opacity-90 transition-all duration-200 brightness-75">
                <Image
                  src={musicData.img_url}
                  layout="fill"
                  objectFit="contain"
                  objectPosition="left"
                  alt="Profile Thumbnail"
                />
              </div>
              <div className="z-11 absolute top-1/2 left-1/2 -my-6 -mx-6 text-white transparent-selection">
                <div className="flex cursor-pointer rounded-full max-w-fit click-animation group-hover:scale-110">
                  <PlayIcon className="w-12 h-12" />
                </div>
              </div>
            </div>
          </a>
        </div>
        <div className="">{/* TODO: add sidebar */}</div>
      </div>
    </AppContainer>
  );
}

export async function getServerSideProps({ params: { id } }) {
  return {
    props: {
      musicData: getMusicById(id)
    }
  };
}
