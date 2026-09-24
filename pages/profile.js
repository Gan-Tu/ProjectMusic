import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppContainer from "../components/AppContainer";
import Button from "../components/ui/Button";
import Image from "../components/ui/SmartImage";
import TopArtists from "../components/artists/TopArtists";
import PeopleTabs, { usePeopleTab } from "../components/profile/PeopleTabs";
import ProfileContent from "../components/profile/ProfileContent";
import { loginHref, useSessionContext } from "../lib/SessionProvider";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui";
import { classNames, formatNumber } from "../lib/format";
import { getVideoSrc } from "../lib/media";
import { listAlbums, listArtists, listPhotos } from "../lib/server/content";

const TABS = [
  "overview",
  "playlist",
  "music",
  "videos",
  "pictures",
  "purchased",
  "credits",
  "suggested",
  "rewards",
  "statistics",
  "feedback"
];

// The demo member's original photo; their profile shows the full portrait instead.
const DEMO_AVATAR =
  "https://s3.amazonaws.com/projctmusic.com/party_favor_500x500_4517214868832703424.jpeg";

// The logged-in member's profile. Guests are sent to the login page (and back here).
export default function Profile({ albums, topArtists, photos, videos }) {
  const [session] = useSessionContext();
  const router = useRouter();
  const { state } = useStore();
  const { openModal } = useUI();
  const { tab } = usePeopleTab(TABS, "overview");
  const user = session.user;

  // Logging out here goes home; arriving as a guest goes to the login page.
  const wasMember = useRef(false);
  useEffect(() => {
    if (user) {
      wasMember.current = true;
      return;
    }
    if (!session.hydrated) return;
    router.replace(wasMember.current ? "/" : loginHref(router.asPath));
  }, [user, session.hydrated, router]);

  if (!user)
    return (
      <AppContainer title="Your profile" curMenu="Profile">
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 py-28 text-center"
          aria-busy="true"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-pmred">
            Your corner of Projct Music
          </p>
          <h1 className="mt-5 text-3xl font-extrabold uppercase">Welcome back</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
            {session.hydrated
              ? "Log in to see your playlist, purchases and credits."
              : "Opening your profile…"}
          </p>
          {session.hydrated && (
            <div className="mt-8 flex gap-3">
              <Button className="cursor-pointer" href={loginHref(router.asPath)}>
                Login
              </Button>
              <Button
                className="cursor-pointer"
                variant="outline"
                href={loginHref(router.asPath, "/signup")}
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </AppContainer>
    );

  const portrait =
    user.isDemo && (!user.avatarUrl || user.avatarUrl === DEMO_AVATAR)
      ? "/profile/nick-breton.webp"
      : user.avatar;
  return (
    <AppContainer
      title={user.name}
      curMenu="Profile"
      description="Your music, your community, your Projct Music profile."
    >
      <div
        className={classNames(
          "grid bg-neutral-950 text-white",
          topArtists.length > 0 && "lg:grid-cols-[minmax(0,3fr)_minmax(270px,1fr)]"
        )}
      >
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
                className="cursor-pointer uppercase text-neutral-400 hover:text-white"
              >
                Inbox
              </button>
              <Link
                href="/profile?tab=credits"
                shallow
                scroll={false}
                className="cursor-pointer text-neutral-400 hover:text-white"
              >
                Credits
              </Link>
              <Link
                href="/shop?category=vip"
                className="cursor-pointer text-neutral-400 hover:text-white"
              >
                VIP
              </Link>
            </nav>
            <dl className="flex gap-8 text-center sm:gap-10">
              {[
                ["Orders", state.purchasesLoaded ? formatNumber(state.purchases.length) : "–"],
                ["Points", formatNumber(state.points)],
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
            <div className="relative w-[38%] shrink-0 bg-neutral-900 sm:w-[32%]">
              <Image
                src={portrait}
                alt={`${user.name} portrait`}
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
                <p className="mb-3 text-2xs font-bold uppercase tracking-[0.25em] text-pmred-light">
                  {user.location || "Projct Music"} / @{user.username}
                </p>
                <h1 className="max-w-sm break-words text-3xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
                  {user.name}
                </h1>
                <p className="mt-4 text-xs font-light uppercase tracking-widest text-neutral-400">
                  {user.role}
                  {user.isDemo ? " · Shared demo account" : ""}
                </p>
                {user.bio && (
                  <p className="mt-4 max-w-md text-sm font-light leading-6 text-neutral-300">
                    {user.bio}
                  </p>
                )}
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
        {topArtists.length > 0 && <TopArtists artists={topArtists} />}
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

// Public catalog content only: the member's own data loads in the browser.
export async function getStaticProps() {
  const [albums, topArtists, photos] = await Promise.all([
    listAlbums({ placement: "music" }),
    listArtists({ placement: "top", limit: 10 }),
    listPhotos({ placement: "profile" })
  ]);
  const videos = ["The next chapter", "Out of the ordinary", "A moment outside"].map(
    (title, index) => ({
      id: `profile-film-${index}`,
      title,
      poster: ["/pictures/studio.webp", "/pictures/nearby.webp", "/pictures/polaroids.webp"][index],
      src: getVideoSrc(`profile-film-${index}`)
    })
  );
  return { props: { albums, topArtists, photos, videos }, revalidate: 60 };
}
