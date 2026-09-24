import AppContainer from "../../components/AppContainer";
import VideoStage from "../../components/videos/VideoStage";
import EmptyState from "../../components/ui/EmptyState";
import { getVideoPage } from "../../lib/server/content";

export default function Videos({ video, videos, related }) {
  return (
    <AppContainer
      title="Videos"
      curMenu="Videos"
      description="Original films, live sessions and music videos from the Projct Music collection."
    >
      {video ? (
        <VideoStage key={video.id} video={video} videos={videos} related={related} />
      ) : (
        <EmptyState dark title="No videos yet" className="min-h-[50vh] justify-center">
          New films are on the way. Check back soon.
        </EmptyState>
      )}
    </AppContainer>
  );
}

// The stage opens on the first video of the Videos tab.
export async function getStaticProps() {
  const page = await getVideoPage();
  return { props: page || { video: null, videos: [], related: [] }, revalidate: 60 };
}
