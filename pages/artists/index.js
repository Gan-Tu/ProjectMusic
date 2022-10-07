import AppContainer from "../../components/AppContainer";
import Image from "next/image";
import { getArtistHomePageData } from "../../utils/getFakeArtistsData";
import Link from "next/link";

export default function ArtistsHome({ artistsData }) {
  return (
    <AppContainer curMenu={"Artists"}>
      <ul
        role="list"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        {artistsData.map((x) => (
          // TODO: change to actual artist name
          <Link href={`/artists/${x.id}`} key={x.id}>
            <li className="flex artists-alternate-row-reverse">
              <div className="relative flex-grow cursor-pointer flex-1 aspect-square">
                <Image
                  src={x.imgUrl}
                  layout="fill"
                  objectFit="cover"
                  objectPosition="left"
                  alt="Project Music logo"
                  className="hover:scale-105 transition-all duration-200 opacity-90 hover:opacity-100"
                />
              </div>
              <div className="flex items-center cursor-pointer flex-1 aspect-square">
                <div className=" flex flex-col flex-1 p-8  space-y-4 text-center">
                  <h1 className="font-extrabold text-sm uppercase border-b py-3 border-gray-200">
                    {x.name}
                  </h1>
                  <h2 className="text-xs uppercase text-gray-500">
                    {x.location}
                  </h2>
                </div>
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </AppContainer>
  );
}

export async function getStaticProps() {
  return {
    props: {
      artistsData: getArtistHomePageData()
    }
  };
}
