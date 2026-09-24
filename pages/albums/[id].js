import { useMemo } from "react";
import Image from "next/image";
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
import { getMusics, getMusicById, getAlbumTracks } from "../../utils/getFakeTracks";
import { toAlbumSummary } from "../../utils/albumTracks";

export default function AlbumDetail({ album, tracks, more }) {
  const player = usePlayer();
  const { actions } = useStore();
  const { openModal } = useUI();
  const item = useMemo(
    () => ({
      id: `album:${album.id}`,
      name: album.name,
      subtitle: `${album.artist} · Digital album`,
      image: album.img_url,
      kind: "music",
      price: 9.99,
      credits: 900
    }),
    [album]
  );
  useCartCandidate(item);
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
              className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-pmred"
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
              {album.release_date.slice(0, 4)} ·{" "}
              <span className="capitalize">{album.albumType}</span> · {tracks.length}{" "}
              {tracks.length === 1 ? "track" : "tracks"} · {formatTime(totalTime)}
            </p>
            <div className="my-6 flex flex-wrap gap-2">
              <Button
                className="cursor-pointer"
                onClick={() => player.playTrack(tracks[0], tracks)}
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
          <div className="mt-6 flex flex-wrap items-center gap-6 px-6 text-[10px] font-bold uppercase tracking-widest text-neutral-500 sm:px-10">
            <button
              type="button"
              onClick={() => shareAlbum(album.id)}
              className="flex cursor-pointer items-center gap-2 hover:text-pmred"
            >
              <ShareIcon className="h-4 w-4" /> Share album
            </button>
            <a
              href={album.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 hover:text-pmred"
            >
              Open in Spotify <ArrowUpRightIcon className="h-4 w-4" />
            </a>
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
          <div className="relative aspect-square w-full max-w-lg shadow-2xl lg:sticky lg:top-28 lg:mt-12">
            <Image
              src={album.img_url}
              alt={`${album.name} album cover`}
              fill
              sizes="(max-width: 1023px) 75vw, 40vw"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <section className="border-t border-neutral-200 px-6 py-12 sm:px-10">
        <CommentThread threadId={`album:${album.id}`} className="max-w-3xl" />
      </section>
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
    </AppContainer>
  );
}

export async function getStaticPaths() {
  return {
    paths: getMusics().map((album) => ({ params: { id: album.id } })),
    fallback: "blocking"
  };
}

export async function getStaticProps({ params }) {
  const album = getMusicById(params.id);
  if (!album) return { notFound: true };
  const others = getMusics().filter((release) => release.id !== album.id);
  const more = [
    ...others.filter((release) => release.artist === album.artist),
    ...others.filter((release) => release.artist !== album.artist)
  ]
    .slice(0, 6)
    .map(toAlbumSummary);
  return { props: { album, tracks: getAlbumTracks(album.id), more } };
}
