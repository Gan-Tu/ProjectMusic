import AppContainer from "../../components/AppContainer";
import VideoStage from "../../components/videos/VideoStage";
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
        <p className="bg-black px-6 py-32 text-center text-sm text-neutral-400">
          New films are on the way. Check back soon.
        </p>
      )}
    </AppContainer>
  );
}

// The stage opens on the first video of the Videos tab.
export async function getStaticProps() {
  const page = await getVideoPage();
  return { props: page || { video: null, videos: [], related: [] }, revalidate: 60 };
}
