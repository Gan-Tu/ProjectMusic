import Image from "next/image";
import Link from "next/link";
import AppContainer from "../../components/AppContainer";
import Button from "../../components/ui/Button";
import TopArtists from "../../components/artists/TopArtists";
import AlbumGrid from "../../components/artists/AlbumGrid";
import PeopleTabs, { usePeopleTab } from "../../components/profile/PeopleTabs";
import PhotoGallery from "../../components/pictures/PhotoGallery";
import { getArtistHomePageData, getArtistProfile } from "../../utils/getFakeArtistsData";
import { getMusics } from "../../utils/getFakeTracks";
import { toAlbumSummary } from "../../utils/albumTracks";
import { getArtistPhotos } from "../../utils/getFakePhotos";
import { getEvents } from "../../utils/getFakeEvents";
import toast from "react-hot-toast";
import { isHiddenContact, useStore } from "../../lib/store";
import { useUI } from "../../lib/ui";
import { formatCompact, formatLongDate, hashString, pad2 } from "../../lib/format";

const TABS = ["music", "pictures", "timeline", "events", "about"];

export default function ArtistProfile({ artist, topArtists, albums, photos, events }) {
  const { state, actions } = useStore();
  const { openModal } = useUI();
  const { tab } = usePeopleTab(TABS, "music");
  const following = !!state.follows[`artist:${artist.id}`];
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
          <div className="relative aspect-square w-44 shrink-0 sm:w-52">
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
            <p className="text-2xs font-bold uppercase tracking-[0.25em] text-pmred-light">
              Artist / {artist.location}
            </p>
            <h1 className="mt-3 break-words text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl">
              {artist.name}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              Independent voices. Shared inspiration.
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
        <TopArtists artists={topArtists} />
      </div>
      <PeopleTabs tabs={TABS} active={tab} />
      <section
        key={`${artist.id}-${tab}`}
        className="min-h-72 px-5 py-8 sm:px-10 sm:py-10"
        aria-label={`${artist.name} ${tab}`}
      >
        {tab === "music" && (
          <>
            <SectionHeading
              title="On rotation"
              detail={`Listening inspiration selected for ${artist.name}.`}
            />
            <AlbumGrid albums={albums} />
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
            {[
              "There is something special about hearing an idea become a record. Back in the studio, making room for the next one.",
              "A few favorite sounds have made their way into this week’s rotation. Find your next discovery in the music tab.",
              "Good people, honest music, long nights. Thanks for being part of the journey."
            ].map((post, index) => (
              <article key={post} className="border-b border-neutral-200 py-6">
                <p className="text-2xs font-bold uppercase tracking-wider text-pmred">
                  {artist.name}{" "}
                  <span className="ml-3 font-normal text-neutral-400">
                    {formatLongDate(`2026-09-${pad2(22 - index * 4)}`)}
                  </span>
                </p>
                <p className="mt-4 text-sm leading-7 text-neutral-600">{post}</p>
                <button
                  type="button"
                  onClick={() => actions.toggleLike(`post:${artist.id}:${index}`)}
                  aria-pressed={!!state.likes[`post:${artist.id}:${index}`]}
                  className="mt-4 cursor-pointer text-xs text-pmred"
                >
                  {state.likes[`post:${artist.id}:${index}`] ? "♥ Liked" : "♡ Like"}
                </button>
              </article>
            ))}
          </div>
        )}
        {tab === "events" && (
          <>
            <SectionHeading
              title="Community events"
              detail="A look back at nights that brought us together."
            />
            <div className="grid sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event, index) => (
                <article
                  key={event.id || event.title || index}
                  className="border-b border-neutral-200 p-6 sm:border-r"
                >
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
                    {event.address?.[0] || event.venue} · {event.time}
                  </p>
                  <Button
                    href="/events"
                    variant="outline"
                    size="xs"
                    className="mt-6 cursor-pointer"
                  >
                    Explore events
                  </Button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "about" && (
          <div className="max-w-3xl">
            <SectionHeading title={`About ${artist.name}`} />
            <p className="text-base leading-8 text-neutral-500">{artist.bio}</p>
            <dl className="mt-8 grid gap-6 border-t border-neutral-200 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-2xs font-bold uppercase tracking-widest text-pmred">
                  Based in
                </dt>
                <dd className="mt-2 text-sm">{artist.location}</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold uppercase tracking-widest text-pmred">
                  Community
                </dt>
                <dd className="mt-2 text-sm">Projct Music / Truth Studios</dd>
              </div>
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
      <h2 className="text-sm font-extrabold uppercase tracking-widest">{title}</h2>
      {detail && <p className="mt-2 text-xs text-neutral-500">{detail}</p>}
    </header>
  );
}

export function getStaticPaths() {
  return {
    paths: getArtistHomePageData().map((artist) => ({ params: { id: artist.id } })),
    fallback: "blocking"
  };
}

export function getStaticProps({ params }) {
  const artist = getArtistProfile(params.id);
  if (!artist) return { notFound: true };
  const music = getMusics();
  const offset = hashString(artist.id) % music.length;
  const albums = Array.from(
    { length: 8 },
    (_, index) => music[(offset + index) % music.length]
  ).map(toAlbumSummary);
  return {
    props: {
      artist,
      topArtists: getArtistHomePageData().slice(0, 10),
      albums,
      photos: getArtistPhotos(artist),
      events: getEvents().slice(0, 6)
    }
  };
}
