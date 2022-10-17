import AppContainer from "../../components/AppContainer";
import { getMusicById } from "../../utils/getFakeTracks";
import Image from "next/image";
import { PlayIcon } from "@heroicons/react/solid";

export default function AlbumDetail({ musicData }) {
  return (
    <AppContainer curMenu={musicData?.name} curMusic={musicData?.name}>
      <div className="bg-black text-white relative flex items-center justify-center px-10 max-w-screen h-full">
        <div className="h-full w-full object-cover absolute inset-0 blur-lg brightness-50 z-0 aspect-square">
          <Image
            src={musicData.img_url}
            layout="fill"
            objectFit="cover"
            objectPosition="left"
            alt="Profile Thumbnail"
          />
        </div>
        <div className="flex items-center justify-center z-10 md:-translate-x-28">
          <div className="flex flex-col text-end p-5 space-y-2 max-w-xs">
            <p className="font-bold text-xl uppercase">{musicData.name}</p>
            <p className="pl-2 text-ellipsis overflow-hidden text-xs ">
              {musicData.release_date}
            </p>
          </div>
          <a href={musicData.url} target="_blank" rel="noopener noreferrer">
            <div className="cursor-pointer m-1 relative group w-64">
              <div className="relative aspect-square group-hover:opacity-90 transition-all duration-200 brightness-75 shadow-lg">
                <Image
                  src={musicData.img_url}
                  layout="fill"
                  objectFit="contain"
                  objectPosition="left"
                  alt="Profile Thumbnail"
                />
              </div>
              <div className="z-11 absolute top-1/2 left-1/2 -translate-x-6 -translate-y-6  text-white transparent-selection">
                <div className="flex cursor-pointer rounded-full max-w-fit click-animation group-hover:scale-110">
                  <PlayIcon className="w-12 h-12" />
                </div>
              </div>
            </div>
          </a>
        </div>
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
