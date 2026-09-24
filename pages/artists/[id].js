import Image from "../../components/ui/SmartImage";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import Button from "../../components/ui/Button";
import TopArtists from "../../components/artists/TopArtists";
import AlbumGrid from "../../components/artists/AlbumGrid";
import PeopleTabs, { usePeopleTab } from "../../components/profile/PeopleTabs";
import PhotoGallery from "../../components/pictures/PhotoGallery";
import VideoCard from "../../components/videos/VideoCard";
import ProductCard from "../../components/shop/ProductCard";
import { isHiddenContact, useStore } from "../../lib/store";
import { useUI } from "../../lib/ui";
import { formatCompact, formatLongDate, pad2 } from "../../lib/format";
import { getArtistPage } from "../../lib/server/content";

const TABS = ["music", "videos", "pictures", "timeline", "events", "merch", "about"];
const ALWAYS_SHOWN = ["music", "timeline", "about"];

// Labels for the keys of `artist.links` (other keys are shown capitalized).
const LINK_LABELS = {
  website: "Website",
  instagram: "Instagram",
  youtube: "YouTube",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  twitter: "Twitter",
  tiktok: "TikTok",
  facebook: "Facebook",
  bandcamp: "Bandcamp",
  apple: "Apple Music"
};

function linkLabel(key) {
  return LINK_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export default function ArtistProfile({
  artist,
  topArtists,
  discography,
  rotation,
  videos,
  photos,
  posts,
  events,
  merch
}) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  // Tabs without content are left out (Music, Timeline and About always show).
  const sizes = {
    videos: videos.length,
    pictures: photos.length,
    events: events.length,
    merch: merch.length
  };
  const tabs = TABS.filter((name) => ALWAYS_SHOWN.includes(name) || sizes[name] > 0);
  const { tab } = usePeopleTab(tabs, "music");
  const following = !!state.follows[`artist:${artist.id}`];
  const links = Object.entries(artist.links || {}).filter(
    ([, href]) => typeof href === "string" && /^https?:\/\//.test(href)
  );
  return (
    <AppContainer title={artist.name} curMenu="Artists" description={artist.bio}>
      <div className="flex flex-wrap items-center justify-between gap-5 bg-neutral-800 px-5 py-5 text-white sm:px-10">
        <Link
          href="/artists"
          className="cursor-pointer text-xs font-bold uppercase tracking-widest text-pmred-light"
        >
          ← All artists
        </Link>
        <dl className="flex gap-8 text-center sm:gap-14">
          {[
            ["Listeners", artist.listeners],
            ["Followers", artist.followers + Number(following)],
            ["Sessions", artist.sessions]
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-2xs font-semibold uppercase tracking-widest text-neutral-400">
                {label}
              </dt>
              <dd className="mt-1 text-xl font-bold">{formatCompact(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid bg-neutral-900 text-white lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-10">
          <div className="relative aspect-square w-44 shrink-0 bg-neutral-800 sm:w-52">
            <Image
              src={artist.imgUrl}
              alt={artist.name}
              fill
              preload
              sizes="208px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-[0.25em] text-pmred-light wrap-anywhere">
              Artist{artist.location && ` / ${artist.location}`}
            </p>
            <h1 className="mt-3 text-4xl wrap-anywhere font-extrabold uppercase leading-none tracking-tight sm:text-5xl">
              {artist.name}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              {artist.tagline || "Independent voices. Shared inspiration."}
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                className="cursor-pointer"
                onClick={() => actions.toggleFollow(`artist:${artist.id}`)}
                aria-pressed={following}
              >
                {following ? "Following" : "Follow"}
              </Button>
              <Button
                className="cursor-pointer"
                variant="light"
                onClick={() => {
                  if (isHiddenContact(state, artist.name)) {
                    toast.error(
                      `You've blocked ${artist.name}. Unblock them in Settings → Security to send a message.`
                    );
                    return;
                  }
                  const chatId = artist.id;
                  actions.startChat({ id: chatId, name: artist.name, avatar: artist.imgUrl });
                  openModal("chat", { chatId });
                }}
              >
                Message
              </Button>
            </div>
          </div>
        </div>
        {topArtists.length > 0 && <TopArtists artists={topArtists} />}
      </div>
      <PeopleTabs tabs={tabs} active={tab} />
      <section
        key={`${artist.id}-${tab}`}
        className="min-h-72 px-5 py-8 sm:px-10 sm:py-10"
        aria-label={`${artist.name} ${tab}`}
      >
        {tab === "music" && (
          <>
            {discography.length > 0 && (
              <div className="mb-12">
                <SectionHeading title="Discography" detail={`Releases by ${artist.name}.`} />
                <AlbumGrid albums={discography} />
              </div>
            )}
            {rotation.length > 0 && (
              <>
                <SectionHeading
                  title="On rotation"
                  detail={`Listening inspiration selected for ${artist.name}.`}
                />
                <AlbumGrid albums={rotation} />
              </>
            )}
            {!discography.length && !rotation.length && (
              <EmptyState>New music from {artist.name} is on the way.</EmptyState>
            )}
          </>
        )}
        {tab === "videos" && (
          <>
            <SectionHeading title="Videos" detail={`Films and sessions with ${artist.name}.`} />
            <div className="-mx-5 grid grid-cols-2 bg-black sm:-mx-10 lg:grid-cols-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
        {tab === "pictures" && (
          <>
            <SectionHeading title="From the archive" detail="Portraits and studio inspiration." />
            <PhotoGallery photos={photos} />
          </>
        )}
        {tab === "timeline" && (
          <div className="mx-auto max-w-3xl">
            <SectionHeading title="Timeline" detail="Notes from the studio community." />
            {posts.map((post) => {
              const likeId = `post:${post.section}:${post.id}`;
              const article = post.section !== "timeline";
              return (
                <article
                  key={`${post.section}-${post.id}`}
                  className="border-b border-neutral-200 py-6"
                >
                  <p className="text-2xs font-bold uppercase tracking-wider text-pmred">
                    {article ? post.category || post.section : artist.name}{" "}
                    <time dateTime={post.isoDate} className="ml-3 font-normal text-neutral-400">
                      {formatLongDate(post.isoDate)}
                    </time>
                  </p>
                  {post.title && (
                    <h3 className="mt-3 text-sm font-extrabold uppercase tracking-wide wrap-anywhere">
                      {article ? (
                        <Link href={`/${post.section}/${post.id}`} className="hover:text-pmred">
                          {post.title}
                        </Link>
                      ) : (
                        post.title
                      )}
                    </h3>
                  )}
                  {post.imgUrl && (
                    <div className="relative mt-4 aspect-video overflow-hidden bg-neutral-100">
                      <Image
                        src={post.imgUrl}
                        alt={post.title || `${artist.name} on the timeline`}
                        fill
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  {(article || !post.body.length ? [post.snippet] : post.body)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="mt-4 text-sm leading-7 text-neutral-600 wrap-anywhere"
                      >
                        {paragraph}
                      </p>
                    ))}
                  <div className="mt-4 flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => actions.toggleLike(likeId)}
                      aria-pressed={!!state.likes[likeId]}
                      className="cursor-pointer text-xs text-pmred"
                    >
                      {state.likes[likeId] ? "♥ Liked" : "♡ Like"}
                    </button>
                    {article && (
                      <Link
                        href={`/${post.section}/${post.id}`}
                        className="text-2xs font-bold uppercase tracking-widest text-neutral-500 hover:text-pmred"
                      >
                        Read more →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
            {!posts.length && <EmptyState>No posts from {artist.name} yet.</EmptyState>}
          </div>
        )}
        {tab === "events" && (
          <>
            <SectionHeading
              title="Events"
              detail={`Nights with ${artist.name} and the Projct Music community.`}
            />
            <div className="grid sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <article key={event.id} className="border-b border-neutral-200 p-6 sm:border-r">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-light text-pmred">{pad2(event.day)}</span>
                    <span className="text-xs font-bold uppercase text-neutral-400">
                      {event.year}
                      <br />
                      {pad2(event.month)}
                    </span>
                  </div>
                  <h3 className="mt-5 text-sm font-bold uppercase">{event.title}</h3>
                  <p className="mt-2 text-xs text-neutral-500">
                    {event.address[0]} · {event.time}
                  </p>
                  <Button
                    href={`/events/${event.id}`}
                    variant="outline"
                    size="xs"
                    className="mt-6 cursor-pointer"
                  >
                    Event details
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "merch" && (
          <>
            <SectionHeading title="Merch" detail={`Records and merchandise from ${artist.name}.`} />
            <div className="-mx-5 grid grid-cols-2 border-t border-neutral-200 sm:-mx-10 md:grid-cols-3 lg:grid-cols-4">
              {merch.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
        {tab === "about" && (
          <div className="max-w-3xl">
            <SectionHeading title={`About ${artist.name}`} />
            {artist.bio ? (
              <p className="whitespace-pre-line text-base leading-8 text-neutral-500 wrap-anywhere">
                {artist.bio}
              </p>
            ) : (
              <EmptyState>More about {artist.name} soon.</EmptyState>
            )}
            <dl className="mt-8 grid gap-6 border-t border-neutral-200 pt-6 sm:grid-cols-2">
              {artist.location && (
                <div>
                  <dt className="text-2xs font-bold uppercase tracking-widest text-pmred">
                    Based in
                  </dt>
                  <dd className="mt-2 text-sm wrap-anywhere">{artist.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-2xs font-bold uppercase tracking-widest text-pmred">
                  Community
                </dt>
                <dd className="mt-2 text-sm">Projct Music / Truth Studios</dd>
              </div>
              {links.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-2xs font-bold uppercase tracking-widest text-pmred">Links</dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {links.map(([key, href]) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-2xs font-bold uppercase tracking-wider text-neutral-600 transition-colors hover:border-pmred hover:text-pmred"
                      >
                        {linkLabel(key)} <ArrowUpRightIcon className="h-3 w-3" />
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </section>
    </AppContainer>
  );
}

function SectionHeading({ title, detail }) {
  return (
    <header className="mb-7">
      <h2 className="text-sm font-extrabold uppercase tracking-widest wrap-anywhere">{title}</h2>
      {detail && <p className="mt-2 text-xs text-neutral-500 wrap-anywhere">{detail}</p>}
    </header>
  );
}

function EmptyState({ children }) {
  return <p className="py-10 text-sm text-neutral-500 wrap-anywhere">{children}</p>;
}

// Rendered on first request, so artists created in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const page = await getArtistPage(params.id);
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: page, revalidate: 60 };
}
