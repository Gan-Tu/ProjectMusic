import { useMemo } from "react";
import Image from "../../components/ui/SmartImage";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowUpRightIcon, ShareIcon } from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import AlbumCard from "../../components/AlbumCard";
import AlbumTrackRow from "../../components/music/AlbumTrackRow";
import Button from "../../components/ui/Button";
import CommentThread from "../../components/comments/CommentThread";
import { shareAlbum } from "../../components/music/share";
import { usePlayer } from "../../lib/player";
import { useStore } from "../../lib/store";
import { useUI, useCartCandidate } from "../../lib/ui";
import { formatTime } from "../../lib/format";
import { albumPurchaseItem, tierLine } from "../../lib/pricing";
import { getAlbumPage } from "../../lib/server/content";

// "Open in Spotify" for Spotify links, otherwise a generic label.
function externalLabel(url) {
  try {
    return new URL(url).hostname.endsWith("spotify.com") ? "Open in Spotify" : "Open release";
  } catch {
    return "Open release";
  }
}

export default function AlbumDetail({ album, tracks, more }) {
  const player = usePlayer();
  const { actions } = useStore();
  const { openModal } = useUI();
  const item = useMemo(() => albumPurchaseItem({ ...album, tracks }), [album, tracks]);
  useCartCandidate(tierLine(item, "download"));
  const totalTime = tracks.reduce((total, track) => total + track.duration, 0);
  return (
    <AppContainer
      title={`${album.name} — ${album.artist}`}
      curMenu="Albums"
      description={`Listen to ${album.name} by ${album.artist} on Projct Music.`}
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="min-w-0 py-8 lg:py-12">
          <div className="px-6 sm:px-10">
            <Link
              href="/albums"
              className="cursor-pointer text-2xs font-bold uppercase tracking-widest text-neutral-500 hover:text-pmred"
            >
              ← All releases
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-pmred">
              {album.artist}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
              {album.name}
            </h1>
            <p className="mt-4 text-xs text-neutral-500">
              {album.release_date && `${album.release_date.slice(0, 4)} · `}
              <span className="capitalize">{album.albumType}</span> · {tracks.length}{" "}
              {tracks.length === 1 ? "track" : "tracks"} · {formatTime(totalTime)}
            </p>
            {album.description && (
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-500">
                {album.description}
              </p>
            )}
            <div className="my-6 flex flex-wrap gap-2">
              <Button
                className="cursor-pointer"
                disabled={!tracks.length}
                onClick={() => player.playQueue(tracks)}
              >
                Play all
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  tracks.forEach(actions.addToPlaylist);
                  toast.success("Album added to your playlist");
                }}
              >
                Add all to playlist
              </Button>
              <Button
                variant="dark"
                className="cursor-pointer"
                onClick={() => openModal("purchase", { item })}
              >
                Buy · $9.99
              </Button>
            </div>
          </div>
          <ol className="border-t border-neutral-200">
            {tracks.map((track, index) => (
              <AlbumTrackRow key={track.id} track={track} queue={tracks} number={index + 1} />
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-6 px-6 text-2xs font-bold uppercase tracking-widest text-neutral-500 sm:px-10">
            <button
              type="button"
              onClick={() => shareAlbum(album.id)}
              className="flex cursor-pointer items-center gap-2 hover:text-pmred"
            >
              <ShareIcon className="h-4 w-4" /> Share album
            </button>
            {album.url && (
              <a
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-2 hover:text-pmred"
              >
                {externalLabel(album.url)} <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </section>
        <div className="relative order-first flex min-h-80 items-center justify-center overflow-hidden bg-neutral-950 p-10 sm:p-16 lg:order-none lg:min-h-[650px] lg:items-start">
          <Image
            src={album.img_url}
            alt=""
            fill
            sizes="60vw"
            className="scale-110 object-cover opacity-40 blur-2xl"
          />
          <div className="w-full max-w-lg lg:sticky lg:top-28 lg:mt-12">
            <div className="relative aspect-square w-full shadow-2xl">
              <Image
                src={album.img_url}
                alt={`${album.name} album cover`}
                fill
                sizes="(max-width: 1023px) 75vw, 40vw"
                preload
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      <section className="border-t border-neutral-200 px-6 py-12 sm:px-10">
        <CommentThread threadId={`album:${album.id}`} className="max-w-3xl" />
      </section>
      {more.length > 0 && (
        <section className="bg-black text-white">
          <h2 className="px-6 py-7 text-xs font-bold uppercase tracking-[0.2em] sm:px-10">
            More releases
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {more.map((release) => (
              <li key={release.id}>
                <AlbumCard musicData={release} linked />
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppContainer>
  );
}

// Rendered on first request (and re-rendered at most once a minute, or right away
// after a CRM edit), so albums created in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const page = await getAlbumPage(params.id);
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: page, revalidate: 60 };
}
