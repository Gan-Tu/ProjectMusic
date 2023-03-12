import AppContainer from "../../components/AppContainer";
import { getMusics } from "../../utils/getFakeTracks";
import MusicPlayerCard from "../../components/MusicPlayerCard";
import { useState } from "react";

export default function MusicOverview({ musics }) {
  const [curMusic, setCurMusic] = useState(null);
  return (
    <AppContainer curMenu={"Musics"} curMusic={curMusic}>
      <ul className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
        {musics.map((musicData, index) => (
          <li key={`musics-${index}`}>
            <MusicPlayerCard musicData={musicData} setCurMusic={setCurMusic} />
          </li>
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
