import AppContainer from "../../components/AppContainer";
import SocialProfile from "../../components/socials/SocialProfile";
import {
  PhotoFeed,
  TwitterFeed,
  JournalFeed,
  VideoFeed
} from "../../components/socials/SocialFeeds";
import { TrackList, MyspaceProfile } from "../../components/socials/SocialMusic";
import WikipediaArticle from "../../components/socials/WikipediaArticle";
import EmptyState from "../../components/ui/EmptyState";
import { getSocialPage } from "../../lib/server/content";

// Whether a network page has nothing to show yet.
function isEmpty(network, content) {
  if (network === "wikipedia") return !content.article;
  if (network === "myspace") return !content.friends?.length && !content.tracks?.length;
  if (content.tracks) return !content.tracks.length;
  return !content.posts?.length;
}

// Networks without a layout of their own (e.g. added in the CRM) get the feed that
// suits most of their posts.
function fallbackFeed(posts) {
  const videos = posts.filter((post) => post.type === "video" && post.src).length;
  if (videos > posts.length / 2) return <VideoFeed posts={posts} network="youtube" />;
  if (!posts.some((post) => post.image)) return <TwitterFeed posts={posts} />;
  return <JournalFeed posts={posts} />;
}

function NetworkContent({ network, content }) {
  switch (network) {
    case "instagram":
      return <PhotoFeed posts={content.posts} />;
    case "pinterest":
      return <PhotoFeed posts={content.posts} pinterest />;
    case "twitter":
      return <TwitterFeed posts={content.posts} />;
    case "facebook":
      return <JournalFeed posts={content.posts} />;
    case "tumblr":
      return <JournalFeed posts={content.posts} tumblr />;
    case "youtube":
    case "vimeo":
    case "vine":
      return <VideoFeed posts={content.posts} network={network} />;
    case "soundcloud":
      return <TrackList tracks={content.tracks} />;
    case "myspace":
      return <MyspaceProfile friends={content.friends} tracks={content.tracks} />;
    case "wikipedia":
      return content.article ? <WikipediaArticle article={content.article} /> : null;
    default:
      return content.posts?.length ? fallbackFeed(content.posts) : null;
  }
}

export default function SocialNetworkPage({ profile, content }) {
  return (
    <AppContainer
      title={`${profile.name} · Truth Studios`}
      curMenu={profile.name}
      description={`Explore the Truth Studios ${profile.name} archive: music, studio sessions and the people behind the sound.`}
    >
      <SocialProfile profile={profile} count={content.posts?.length ?? content.tracks?.length} />
      {isEmpty(profile.id, content) ? (
        <EmptyState title="Nothing posted yet">
          New posts from {profile.name} will show up here soon.
        </EmptyState>
      ) : (
        <NetworkContent key={profile.id} network={profile.id} content={content} />
      )}
    </AppContainer>
  );
}

// Rendered on first request, so networks added in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const page = await getSocialPage(params.network);
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: page, revalidate: 60 };
}
