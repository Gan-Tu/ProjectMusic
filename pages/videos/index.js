import AppContainer from "../../components/AppContainer";
import VideoStage from "../../components/videos/VideoStage";
import { getVideos, getRelatedVideos } from "../../utils/getFakeVideos";

export default function Videos({ video, videos, related }) {
  return (
    <AppContainer
      title="Videos"
      curMenu="Videos"
      description="Original films, live sessions and music videos from the Projct Music collection."
    >
      <VideoStage key={video.id} video={video} videos={videos} related={related} />
    </AppContainer>
  );
}

export function getStaticProps() {
  const videos = getVideos();
  const video = videos[0];
  return { props: { video, videos, related: getRelatedVideos(video.id, 8) } };
}
