import Image from "../components/ui/SmartImage";
import Link from "next/link";
import AppContainer from "../components/AppContainer";
import HomeHero from "../components/home/HomeHero";
import NewReleases from "../components/home/NewReleases";
import VideoStrip from "../components/videos/VideoStrip";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { getHomePage } from "../lib/server/content";

export default function Home({ videos, albums, artists }) {
  return (
    <AppContainer
      title="Home"
      curMenu="Home"
      description="Independent sounds, original films and the artists behind them. Discover the world of Projct Music and Truth Studios."
    >
      {!videos.length && !albums.length && !artists.length && (
        <EmptyState
          dark
          title="New sounds are on the way"
          className="min-h-[60vh] justify-center"
          action={
            <Button href="/about" variant="light">
              About Projct Music
            </Button>
          }
        >
          Films, releases and the artists behind them will appear here soon.
        </EmptyState>
      )}
      {videos.length > 0 && (
        <>
          <HomeHero videos={videos} />
          <div className="flex items-center justify-between bg-black px-5 pt-7 pb-4 text-white md:px-10">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]">On rotation</h2>
            <Link
              href="/videos"
              className="text-xs font-bold uppercase tracking-widest text-pmred hover:text-white"
            >
              All videos <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <VideoStrip videos={videos} label="On rotation" />
        </>
      )}
      {albums.length > 0 && <NewReleases albums={albums} />}
      {artists.length > 0 && (
        <section aria-labelledby="artists-heading" className="bg-black text-white">
          <div className="flex items-center justify-between px-5 py-7 md:px-10">
            <h2 id="artists-heading" className="text-sm font-extrabold uppercase tracking-[0.2em]">
              The people behind the music
            </h2>
            <Link
              href="/artists"
              className="ml-4 shrink-0 text-xs font-bold uppercase tracking-widest text-pmred hover:text-white"
            >
              All artists <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group relative aspect-[4/3] overflow-hidden bg-neutral-900"
              >
                <Image
                  src={artist.coverImage}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                />
                <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-pmred/30" />
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4 pt-10 text-xs font-extrabold uppercase tracking-widest md:p-6 md:pt-12">
                  {artist.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppContainer>
  );
}

export async function getStaticProps() {
  return { props: await getHomePage(), revalidate: 60 };
}
