import Image from "next/image";
import Link from "next/link";
import AppContainer from "../components/AppContainer";
import Button from "../components/ui/Button";
import TopArtists from "../components/artists/TopArtists";
import PeopleTabs, { usePeopleTab } from "../components/profile/PeopleTabs";
import ProfileContent from "../components/profile/ProfileContent";
import { useSessionContext, DEFAULT_USER } from "../lib/SessionProvider";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { formatNumber } from "../lib/format";
import { getVideoSrc } from "../lib/media";
import { getArtistHomePageData } from "../utils/getFakeArtistsData";
import { getMusics } from "../utils/getFakeTracks";
import { toAlbumSummary } from "../utils/albumTracks";
import { getPhotos } from "../utils/getFakePhotos";

const TABS = [
  "overview",
  "playlist",
  "music",
  "videos",
  "pictures",
  "purchased",
  "suggested",
  "rewards",
  "statistics",
  "feedback"
];

export default function Profile({ albums, topArtists, photos, videos }) {
  const [session, dispatch] = useSessionContext();
  const { state } = useStore();
  const { openModal } = useUI();
  const { tab } = usePeopleTab(TABS, "overview");
  const user = session.user;
  // An uploaded photo replaces the default portrait from the mock.
  const portrait =
    user?.avatar && user.avatar !== DEFAULT_USER.avatar ? user.avatar : "/profile/nick-breton.webp";
  if (!session.user)
    return (
      <AppContainer title="Your profile" curMenu="Profile">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-28 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-pmred">
            Your corner of Projct Music
          </p>
          <h1 className="mt-5 text-3xl font-extrabold uppercase">Welcome back</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
            Log in to return to your playlist, purchases and favorites. This demo opens Nick
            Breton’s profile.
          </p>
          <div className="mt-8 flex gap-3">
            <Button
              className="cursor-pointer"
              onClick={() => dispatch({ type: "set_user", user: {} })}
            >
              Login
            </Button>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => dispatch({ type: "set_user", user: {} })}
            >
              Sign up
            </Button>
          </div>
        </div>
      </AppContainer>
    );
  return (
    <AppContainer
      title={session.user.name}
      curMenu="Profile"
      description="Your music, your community, your Projct Music profile."
    >
      <div className="grid bg-neutral-950 text-white lg:grid-cols-[minmax(0,3fr)_minmax(270px,1fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-6 bg-neutral-900 px-5 py-5 sm:px-10">
            <nav
              aria-label="Your account"
              className="flex items-center gap-6 text-2xs font-bold uppercase tracking-wider"
            >
              <Link href="/profile" className="cursor-pointer text-white">
                Profile
              </Link>
              <button
                onClick={() => openModal("chat")}
                className="cursor-pointer text-neutral-400 hover:text-white"
              >
                Inbox
              </button>
              <button
                onClick={() => openModal("credits")}
                className="cursor-pointer text-neutral-400 hover:text-white"
              >
                Credits
              </button>
              <Link
                href="/shop?category=vip"
                className="cursor-pointer text-neutral-400 hover:text-white"
              >
                VIP
              </Link>
            </nav>
            <dl className="flex gap-8 text-center sm:gap-10">
              {[
                ["Friends", "13K"],
                ["Followers", "6,9K"],
                ["Credits", formatNumber(state.credits)]
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dt className="order-2 mt-1 text-2xs font-bold uppercase tracking-wide text-neutral-400">
                    {label}
                  </dt>
                  <dd
                    className={`order-1 text-xl font-bold ${label === "Credits" ? "text-pmred" : ""}`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative flex min-h-80 overflow-hidden sm:min-h-96">
            <div className="relative w-[38%] shrink-0 sm:w-[32%]">
              <Image
                src={portrait}
                alt={`${user?.name || "Nick Breton"} portrait`}
                unoptimized={portrait.startsWith("data:")}
                fill
                preload
                sizes="(max-width: 639px) 38vw, 25vw"
                className="object-cover object-top"
              />
            </div>
            <div className="relative flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-10">
              <Image
                src="/profile/canal.webp"
                alt=""
                fill
                preload
                sizes="(max-width: 1023px) 70vw, 50vw"
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/20 to-black/70" />
              <div className="relative">
                <p className="mb-3 text-2xs font-bold uppercase tracking-[0.25em] text-pmred">
                  Truth Studios / Los Angeles
                </p>
                <h1 className="max-w-sm break-words text-3xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
                  {session.user.name}
                </h1>
                <p className="mt-4 text-xs font-light uppercase tracking-widest text-neutral-400">
                  {session.user.role}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button
                    size="xs"
                    className="cursor-pointer"
                    onClick={() => openModal("settings")}
                  >
                    Edit profile
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    className="cursor-pointer"
                    onClick={() => openModal("chat")}
                  >
                    Messages
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <TopArtists artists={topArtists} />
      </div>
      <PeopleTabs tabs={TABS} active={tab} />
      <div className="min-h-80">
        <ProfileContent
          tab={tab}
          albums={albums}
          photos={photos}
          videos={videos}
          topArtists={topArtists}
        />
      </div>
    </AppContainer>
  );
}

export function getStaticProps() {
  const albums = getMusics().map(toAlbumSummary);
  const videos = ["The next chapter", "Out of the ordinary", "A moment outside"].map(
    (title, index) => ({
      id: `profile-film-${index}`,
      title,
      poster: ["/pictures/studio.webp", "/pictures/nearby.webp", "/pictures/polaroids.webp"][index],
      src: getVideoSrc(`profile-film-${index}`)
    })
  );
  return {
    props: {
      albums,
      topArtists: getArtistHomePageData().slice(0, 10),
      photos: getPhotos("polaroids"),
      videos
    }
  };
}
