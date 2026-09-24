import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChartBarIcon,
  StarIcon,
  HeartIcon,
  RectangleStackIcon,
  GiftIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  TicketIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  TrophyIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import AlbumGrid from "../artists/AlbumGrid";
import PhotoGallery from "../pictures/PhotoGallery";
import { useStore } from "../../lib/store";
import { usePlayer } from "../../lib/player";
import { useUI } from "../../lib/ui";
import { formatNumber, formatLongDate, formatUSD, formatTime, pad2 } from "../../lib/format";
import { downloadDemoTrack } from "../../lib/demoAudio";

const FEATURES = [
  [
    "statistics",
    "Stats",
    "Get nerdy",
    "Your listening week, favorite sounds and artists in numbers.",
    ChartBarIcon
  ],
  [
    "playlist",
    "Playlist",
    "Arrange your favs",
    "Keep the songs you come back to in one place.",
    StarIcon
  ],
  [
    "suggested",
    "Suggested",
    "Similar interests",
    "A fresh selection for your next listening session.",
    HeartIcon
  ],
  [
    "purchased",
    "Purchased",
    "Complete overview",
    "All your records, downloads and orders together.",
    RectangleStackIcon
  ],
  [
    "rewards",
    "Rewards",
    "Gratefulness",
    "A little something back for being part of the community.",
    GiftIcon
  ],
  [
    "feedback",
    "Ideas",
    "Give us feedback",
    "Help make this a better place for music.",
    ChatBubbleLeftRightIcon
  ]
];

export default function ProfileContent({ tab, albums, photos, videos, topArtists }) {
  const { state } = useStore();
  if (tab === "overview")
    return (
      <>
        <PrivacyBar />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([target, label, title, description, Icon]) => (
            <Link
              key={target}
              href={`/profile?tab=${target}`}
              shallow
              scroll={false}
              className="group flex cursor-pointer items-start gap-5 border-b border-neutral-200 px-6 py-10 transition-colors hover:bg-pmred hover:text-white focus-visible:bg-pmred focus-visible:text-white sm:border-r sm:px-10"
            >
              <Icon className="mt-4 h-7 w-7 shrink-0 text-pmred group-hover:text-white group-focus-visible:text-white" />
              <div>
                <p className="text-2xs font-bold uppercase tracking-[0.2em] text-pmred group-hover:text-white/70 group-focus-visible:text-white/70">
                  {label}
                </p>
                <h2 className="mt-1 text-sm font-extrabold uppercase tracking-wide">{title}</h2>
                <p className="mt-2 max-w-xs text-xs leading-5 text-neutral-500 group-hover:text-white/80 group-focus-visible:text-white/80">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </>
    );
  if (tab === "playlist")
    return (
      <Section
        title="Your playlist"
        detail={`${state.playlist.length} ${state.playlist.length === 1 ? "track" : "tracks"} · ${
          state.settings.sharePlaylist
            ? "Public: anyone with the link can listen"
            : "Private: only you can see it"
        }`}
      >
        <Playlist />
      </Section>
    );
  if (tab === "music") {
    const liked = albums.filter(
      (album) =>
        state.likes[`album:${album.id}`] ||
        state.likes[album.id] ||
        Object.keys(state.likes).some((id) => state.likes[id] && id.startsWith(`${album.id}-`))
    );
    return (
      <Section
        title="Music you love"
        detail="The albums and songs you have liked around Projct Music."
      >
        {liked.length ? (
          <AlbumGrid albums={liked} />
        ) : (
          <Empty
            title="Your next favorite is out there"
            text="Tap the heart on an album or song to keep it here."
            href="/musics"
            action="Explore music"
          />
        )}
      </Section>
    );
  }
  if (tab === "suggested")
    return (
      <Section
        title="Selected for your next session"
        detail="An eclectic mix from the Projct Music catalog."
      >
        <AlbumGrid albums={albums.slice(0, 12)} />
      </Section>
    );
  if (tab === "pictures")
    return (
      <Section title="Your photo wall" detail="Studio favorites and moments from the archive.">
        <PhotoGallery photos={photos} polaroids />
      </Section>
    );
  if (tab === "videos")
    return (
      <Section
        title="In the screening room"
        detail="A selection of sample films from the community."
      >
        <ProfileVideos videos={videos} />
      </Section>
    );
  if (tab === "purchased")
    return (
      <Section title="Your purchases" detail="Every order, in one place.">
        <Purchases />
      </Section>
    );
  if (tab === "rewards")
    return (
      <Section title="A little thank you" detail="Stay curious. Keep listening. Enjoy the rewards.">
        <Rewards />
      </Section>
    );
  if (tab === "statistics")
    return (
      <Section
        title="Your music in numbers"
        detail="A sample listening week from your demo profile."
      >
        <Statistics artists={topArtists} />
      </Section>
    );
  if (tab === "feedback")
    return (
      <Section title="Give us feedback" detail="Your ideas help shape Projct Music.">
        <Feedback />
      </Section>
    );
  return null;
}

function Section({ title, detail, children }) {
  return (
    <section className="px-5 py-8 sm:px-10">
      <header className="mb-8">
        <h2 className="text-sm font-extrabold uppercase tracking-widest">{title}</h2>
        <p className="mt-2 text-xs text-neutral-500">{detail}</p>
      </header>
      {children}
    </section>
  );
}

function Empty({ title, text, href, action }) {
  return (
    <div className="bg-neutral-50 px-5 py-16 text-center">
      <RectangleStackIcon className="mx-auto mb-5 h-9 w-9 text-pmred" />
      <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">{text}</p>
      <Button href={href} className="mt-6 cursor-pointer bg-white" variant="outline">
        {action}
      </Button>
    </div>
  );
}

function Playlist() {
  const { state, actions } = useStore();
  const player = usePlayer();
  if (!state.playlist.length)
    return (
      <Empty
        title="Make room for your favorites"
        text="Add a song from an album or the music catalog to start your own rotation."
        href="/musics"
        action="Find your first track"
      />
    );
  return (
    <>
      <Button className="mb-5 cursor-pointer" onClick={() => player.playQueue(state.playlist)}>
        <PlayIcon className="h-4 w-4" />
        Play all
      </Button>
      <ol>
        {state.playlist.map((track, index) => (
          <li
            key={track.id}
            className="flex items-center gap-3 border-b border-neutral-200 py-4 sm:gap-5"
          >
            <span className="hidden w-5 text-xs text-pmred sm:block">{pad2(index + 1)}</span>
            <div className="relative h-12 w-12 shrink-0 bg-neutral-100">
              <Image
                src={track.cover}
                alt={track.albumName || track.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <button
              onClick={() => player.playTrack(track, state.playlist)}
              aria-label={`${player.isTrackPlaying(track.id) ? "Pause" : "Play"} ${track.title}`}
              className="cursor-pointer p-2 text-pmred"
            >
              {player.isTrackPlaying(track.id) ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase">{track.title}</p>
              <p className="mt-1 truncate text-xs text-neutral-500">{track.artist}</p>
            </div>
            <span className="hidden text-xs text-neutral-500 sm:block">
              {track.duration ? formatTime(track.duration) : "—"}
            </span>
            <button
              onClick={() => actions.removeFromPlaylist(track.id)}
              aria-label={`Remove ${track.title} from playlist`}
              className="cursor-pointer p-2 text-neutral-500 hover:text-pmred"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

// Downloads for purchased "stream and download" music (generated demo audio).
function Downloads({ tracks }) {
  const link = (track) => (
    <button
      type="button"
      onClick={() => downloadDemoTrack(track)}
      title="Downloads a demo audio file for this track"
      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pmred hover:underline"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      {tracks.length === 1 ? "Download" : track.title}
    </button>
  );
  if (tracks.length === 1) return <div className="mt-2">{link(tracks[0])}</div>;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-pmred">
        Download tracks ({tracks.length})
      </summary>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {tracks.map((track) => (
          <li key={track.id}>{link(track)}</li>
        ))}
      </ul>
    </details>
  );
}

// Reflects the "Share timeline / playlist publicly" settings.
function PrivacyBar() {
  const { state } = useStore();
  const { openModal } = useUI();
  const chip = (label, on) => (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${on ? "bg-lime-500" : "bg-neutral-300"}`} />
      {label}:{" "}
      <strong className="font-semibold text-neutral-800">{on ? "Public" : "Private"}</strong>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-200 px-5 py-3 text-xs text-neutral-500 sm:px-10">
      {chip("Timeline", state.settings.shareTimeline)}
      {chip("Playlist", state.settings.sharePlaylist)}
      <button
        type="button"
        onClick={() => openModal("settings", { tab: "playlist" })}
        className="ml-auto text-2xs font-bold uppercase tracking-wider text-pmred hover:underline"
      >
        Change
      </button>
    </div>
  );
}

function Purchases() {
  const { state } = useStore();
  if (!state.purchases.length)
    return (
      <Empty
        title="Your collection starts here"
        text="Music, merch and experiences. Your confirmed orders will appear here."
        href="/shop"
        action="Explore the shop"
      />
    );
  return (
    <div className="space-y-6">
      {state.purchases.map((order) => (
        <article key={order.id} className="border border-neutral-200">
          <header className="flex flex-wrap items-center justify-between gap-4 bg-neutral-50 p-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide">{order.id}</h3>
              <p className="mt-1 text-xs text-neutral-500">{formatLongDate(order.date)}</p>
            </div>
            <p className="text-sm font-bold text-pmred">
              {order.method === "credits"
                ? `${formatNumber(order.totalCredits)} credits`
                : formatUSD(order.totalUsd)}
              <span className="mt-1 block text-right text-2xs font-normal uppercase text-neutral-500">
                Paid with {order.method}
              </span>
            </p>
          </header>
          <ul className="divide-y divide-neutral-100 px-5">
            {order.items.map((item, index) => (
              <li key={item.key || `${item.id}-${index}`} className="flex items-center gap-4 py-4">
                {item.image && (
                  <div className="relative h-12 w-12 shrink-0 bg-neutral-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase">{item.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {[item.subtitle, ...Object.values(item.options || {})]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.downloads?.length > 0 && <Downloads tracks={item.downloads} />}
                  {item.entitlement?.type === "downloads" && (
                    <p className="mt-2 text-xs text-neutral-500">
                      Unlimited downloads for {item.entitlement.days * (item.qty || 1)} days from{" "}
                      {formatLongDate(order.date)}. Use the download buttons on any album page.
                    </p>
                  )}
                </div>
                <span className="text-xs text-neutral-500">× {item.qty || 1}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Rewards() {
  const { state } = useStore();
  const { openModal } = useUI();
  const nextMilestone = (Math.floor(state.points / 5000) + 1) * 5000;
  const rewards = [
    ["Credits", CurrencyDollarIcon, "More music, more possibilities", "credits"],
    ["VIP", StarIcon, "A little closer to the action", "/shop?category=vip"],
    ["Tickets", TicketIcon, "Be there for the next moment", "/events"],
    ["Badges", TrophyIcon, "Community supporter", null],
    ["Downloads", ArrowDownTrayIcon, "Build your own collection", "/musics"],
    ["Photos", PhotoIcon, "Moments worth keeping", "/pictures"]
  ];
  return (
    <>
      <div className="mb-10 max-w-2xl">
        <p className="text-5xl font-light text-pmred">
          {formatNumber(state.points)}
          <span className="ml-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
            Points
          </span>
        </p>
        <progress
          value={state.points % 5000}
          max="5000"
          aria-label="Progress to next rewards milestone"
          className="mt-5 h-1.5 w-full accent-pmred"
        />
        <p className="mt-2 text-xs text-neutral-500">
          {formatNumber(nextMilestone - state.points)} points to your next milestone at{" "}
          {formatNumber(nextMilestone)}. Earn points with every purchase.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-6">
        {rewards.map(([title, Icon, description, target]) => (
          <div key={title} className="border-t border-neutral-200 py-6">
            <Icon className="mb-5 h-9 w-9 text-pmred" />
            <h3 className="text-xs font-bold uppercase tracking-wide">{title}</h3>
            <p className="mt-2 min-h-10 text-xs leading-5 text-neutral-500">{description}</p>
            {target === "credits" ? (
              <button
                onClick={() => openModal("credits")}
                className="mt-4 cursor-pointer text-2xs font-bold uppercase text-pmred"
              >
                View credits →
              </button>
            ) : target ? (
              <Link
                href={target}
                className="mt-4 inline-block cursor-pointer text-2xs font-bold uppercase text-pmred"
              >
                Explore →
              </Link>
            ) : (
              <span className="mt-4 inline-block text-2xs font-bold uppercase text-pmred">
                {state.points >= 20000 ? "Unlocked" : "20,000 points"}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function Statistics({ artists }) {
  const days = [
    ["Mon", 24],
    ["Tue", 38],
    ["Wed", 19],
    ["Thu", 46],
    ["Fri", 63],
    ["Sat", 81],
    ["Sun", 52]
  ];
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div>
        <h3 className="mb-8 text-xs font-bold uppercase tracking-widest">Plays per day</h3>
        <div className="flex h-52 items-end gap-3 border-b border-neutral-200 px-2">
          {days.map(([day, value]) => (
            <div key={day} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
              <span className="mb-2 text-2xs text-neutral-500">{value}</span>
              <div
                aria-label={`${day}: ${value} plays`}
                className="bg-pmred transition-colors hover:bg-black"
                style={{ height: `${value}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3 px-2">
          {days.map(([day]) => (
            <span key={day} className="flex-1 text-center text-2xs uppercase text-neutral-500">
              {day}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-6 text-xs font-bold uppercase tracking-widest">Top genres</h3>
        {[
          ["Hip-hop", 42],
          ["R&B / Soul", 29],
          ["Alternative", 18],
          ["Electronic", 11]
        ].map(([genre, value]) => (
          <div key={genre} className="mb-5">
            <p className="mb-2 flex justify-between text-xs">
              <span>{genre}</span>
              <span className="text-neutral-500">{value}%</span>
            </p>
            <div className="h-1.5 bg-neutral-100">
              <div className="h-full bg-pmred" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-2">
        <h3 className="mb-5 text-xs font-bold uppercase tracking-widest">Top artists</h3>
        <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-5">
          {artists.slice(0, 5).map((artist, index) => (
            <li
              key={artist.id}
              className="flex items-center gap-3 border-t border-neutral-200 py-5"
            >
              <span className="text-3xl font-light text-pmred">{pad2(index + 1)}</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/artists/${artist.id}`}
                  className="cursor-pointer text-xs font-bold uppercase hover:text-pmred"
                >
                  {artist.name}
                </Link>
                <div
                  className="mt-3 h-1 bg-neutral-100"
                  role="img"
                  aria-label={`${92 - index * 13} plays`}
                >
                  <div className="h-full bg-pmred" style={{ width: `${92 - index * 13}%` }} />
                </div>
                <p className="mt-2 text-2xs text-neutral-500">{92 - index * 13} plays</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Feedback() {
  const { state, actions } = useStore();
  const [text, setText] = useState("");
  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    actions.addFeedback(text.trim());
    setText("");
    toast.success("Thank you. Your feedback has been saved.");
  }
  return (
    <div className="max-w-3xl">
      <form onSubmit={submit}>
        <label htmlFor="profile-feedback" className="text-xs font-semibold text-neutral-600">
          What would make your experience better?
        </label>
        <textarea
          id="profile-feedback"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          required
          rows={6}
          placeholder="Your next great idea starts here…"
          className="mt-3 block w-full resize-y border border-neutral-200 bg-neutral-50 p-5 text-sm leading-6 outline-none focus:border-pmred"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-2xs text-neutral-500">{text.length} / 2,000 · Saved on this device</p>
          <Button type="submit" disabled={!text.trim()} className="cursor-pointer">
            Send feedback
          </Button>
        </div>
      </form>
      {state.feedback.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xs font-bold uppercase tracking-widest">Your ideas</h3>
          {state.feedback.map((entry) => (
            <article key={entry.id} className="group border-b border-neutral-200 py-5">
              <div className="flex items-center justify-between gap-4">
                <time className="text-2xs text-pmred">{formatLongDate(entry.at)}</time>
                <button
                  type="button"
                  onClick={() => {
                    actions.deleteFeedback(entry.id);
                    toast((t) => (
                      <span className="flex items-center gap-4">
                        Feedback deleted
                        <button
                          type="button"
                          onClick={() => {
                            actions.restoreFeedback(entry);
                            toast.dismiss(t.id);
                          }}
                          className="text-xs font-bold uppercase tracking-wider text-pmred"
                        >
                          Undo
                        </button>
                      </span>
                    ));
                  }}
                  aria-label="Delete this feedback"
                  className="text-2xs font-bold uppercase tracking-wider text-neutral-500 transition hover:text-pmred"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-500">
                {entry.text}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileVideos({ videos }) {
  const { pause } = usePlayer();
  const [active, setActive] = useState(null);
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {videos.map((video) => (
        <article key={video.id}>
          {active === video.id ? (
            <video
              controls
              autoPlay
              playsInline
              poster={video.poster}
              onPlay={pause}
              className="aspect-video w-full bg-black"
              src={video.src}
            >
              <track kind="captions" />
            </video>
          ) : (
            <button
              onClick={() => {
                pause();
                setActive(video.id);
              }}
              className="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-black"
              aria-label={`Play ${video.title}`}
            >
              <Image
                src={video.poster}
                alt={video.title}
                fill
                sizes="(max-width: 767px) 90vw, 30vw"
                className="object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-100"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <PlayIcon className="h-12 w-12 rounded-full bg-pmred p-3 text-white" />
              </span>
            </button>
          )}
          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide">{video.title}</h3>
          <p className="mt-2 text-xs text-neutral-500">Sample film · Projct Music screening room</p>
        </article>
      ))}
    </div>
  );
}
