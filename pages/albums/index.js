import AppContainer from "../../components/AppContainer";
import { getMusics } from "../../utils/getFakeTracks";
import Link from "next/link";
import AlbumCard from "../../components/AlbumCard";

export default function Albums({ musics }) {
  return (
    <AppContainer curMenu={"Albums"}>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 bg-black">
        {musics.map((musicData, index) => (
          <Link href={`/albums/${musicData.id}`} key={musicData.id}>
            <li key={`album-${index}`}>
              <AlbumCard musicData={musicData} />
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
      musics: getMusics()
    }
  };
}
