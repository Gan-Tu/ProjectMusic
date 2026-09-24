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
import { getSocialProfiles, getSocialPage } from "../../utils/getFakeSocials";

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
      return <WikipediaArticle article={content.article} />;
    default:
      return null;
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
      <NetworkContent key={profile.id} network={profile.id} content={content} />
    </AppContainer>
  );
}

export function getStaticPaths() {
  return {
    paths: getSocialProfiles().map(({ id }) => ({ params: { network: id } })),
    fallback: "blocking"
  };
}

export function getStaticProps({ params }) {
  const data = getSocialPage(params.network);
  if (!data) return { notFound: true };
  return { props: data };
}
