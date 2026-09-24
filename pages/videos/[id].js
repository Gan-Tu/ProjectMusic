import AppContainer from "../../components/AppContainer";
import VideoStage from "../../components/videos/VideoStage";
import { getVideoById, getVideos, getRelatedVideos } from "../../utils/getFakeVideos";

export default function VideoDetail({ video, videos, related }) {
  return (
    <AppContainer
      title={`${video.artist} — ${video.title}`}
      curMenu="Videos"
      description={video.description}
    >
      <VideoStage key={video.id} video={video} videos={videos} related={related} />
    </AppContainer>
  );
}

export function getStaticPaths() {
  return { paths: getVideos().map((video) => ({ params: { id: video.id } })), fallback: false };
}

export function getStaticProps({ params }) {
  const video = getVideoById(params.id);
  if (!video) return { notFound: true };
  return { props: { video, videos: getVideos(), related: getRelatedVideos(video.id, 8) } };
}
