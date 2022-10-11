import { useRouter } from "next/router";
import AppContainer from "../../components/AppContainer";
import { getMusicById } from "../../utils/getFakeTracks";

export default function AlbumDetail() {
  const router = useRouter();
  const { id } = router.query;
  const musicData = getMusicById(id);
  return (
    <AppContainer curMenu={musicData.name}>
      <p>Album {musicData.name}</p>
    </AppContainer>
  );
}
