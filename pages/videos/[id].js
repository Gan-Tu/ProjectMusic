import AppContainer from "../../components/AppContainer";
import VideoStage from "../../components/videos/VideoStage";
import { getVideoPage } from "../../lib/server/content";

export default function VideoDetail({ video, videos, related }) {
  return (
    <AppContainer
      title={video.artist ? `${video.artist} — ${video.title}` : video.title}
      curMenu="Videos"
      description={video.description}
    >
      <VideoStage key={video.id} video={video} videos={videos} related={related} />
    </AppContainer>
  );
}

// Rendered on first request, so videos created in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const page = await getVideoPage(params.id);
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: page, revalidate: 60 };
}
