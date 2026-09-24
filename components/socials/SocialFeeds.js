import { useEffect, useState, useMemo } from "react";
import CommentThread, { useThreadComments } from "../comments/CommentThread";
import Image from "next/image";
import {
  ArrowPathRoundedSquareIcon,
  ArrowUpRightIcon,
  ChatBubbleOvalLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  PlayIcon
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useStore } from "../../lib/store";
import { usePlayer } from "../../lib/player";
import { formatLongDate, formatNumber } from "../../lib/format";

// `likeKey` overrides the default "social:<id>" key (e.g. tracks share music likes).
// Seeded comments of a photo post (shared by its tile count and its lightbox thread).
function conversationSeed(post) {
  return post.conversation.map((comment, i) => ({
    id: `${post.id}#c${i}`,
    author: comment.author,
    text: comment.text,
    label: formatLongDate(post.date)
  }));
}

function CommentCount({ post }) {
  const seed = useMemo(() => conversationSeed(post), [post]);
  return useThreadComments(`social:${post.id}`, { seed }).length;
}

export function LikeButton({ id, likeKey, count = 0, label = "Like", inverse = false }) {
  const { state, actions } = useStore();
  const key = likeKey || `social:${id}`;
  const liked = Boolean(state.likes[key]);
  return (
    <button
      type="button"
      aria-label={`${liked ? "Unlike" : label} post`}
      aria-pressed={liked}
      onClick={() => actions.toggleLike(key)}
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 text-xs transition-colors ${inverse ? "text-white" : liked ? "text-pmred" : "text-neutral-500 hover:text-pmred"}`}
    >
      <HeartIcon className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      {formatNumber(count + (liked ? 1 : 0))}
      <span className="sr-only"> likes</span>
    </button>
  );
}

function RichText({ text }) {
  return text.split(/([@#][\w]+)/g).map((part, index) =>
    /^[@#]/.test(part) ? (
      <span
        className="font-medium text-pmred group-hover:text-white group-focus-visible:text-white"
        key={index}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

function GalleryArrows({ onMove }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous post"
        onClick={() => onMove(-1)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center bg-pmred text-white hover:bg-pmred-dark"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next post"
        onClick={() => onMove(1)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center bg-pmred text-white hover:bg-pmred-dark"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function useGalleryKeys(open, count, setSelected) {
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))
      )
        return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      setSelected((index) => (index + (event.key === "ArrowLeft" ? -1 : 1) + count) % count);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, count, setSelected]);
}

export function PhotoFeed({ posts, pinterest = false }) {
  const [selected, setSelected] = useState(null);
  const [limit, setLimit] = useState(12);
  const { state } = useStore();
  const post = selected == null ? null : posts[selected];
  const move = (step) => setSelected((index) => (index + step + posts.length) % posts.length);
  useGalleryKeys(selected != null, posts.length, setSelected);
  return (
    <>
      <div className={pinterest ? "bg-neutral-100 px-4 py-5 sm:px-8" : "bg-black"}>
        <div
          className={
            pinterest
              ? "columns-2 gap-4 md:columns-3 lg:columns-4"
              : "grid grid-cols-2 md:grid-cols-4"
          }
        >
          {posts.slice(0, limit).map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Open photo: ${item.alt}`}
              className={`group relative block w-full cursor-pointer overflow-hidden bg-neutral-900 text-left focus-visible:z-10 focus-visible:outline-4 focus-visible:outline-pmred ${pinterest ? "mb-4 break-inside-avoid" : "aspect-square"}`}
            >
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: pinterest ? item.ratio : "1 / 1" }}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 767px) 50vw, 25vw"
                  preload={index === 0}
                  className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-75 motion-reduce:transform-none motion-reduce:transition-none"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/20 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="flex items-center gap-2">
                    <HeartIcon className="h-5 w-5" />
                    {item.likes + (state.likes[`social:${item.id}`] ? 1 : 0)}
                  </span>
                  <span className="flex items-center gap-2">
                    <ChatBubbleOvalLeftIcon className="h-5 w-5" />
                    <CommentCount post={item} />
                  </span>
                </div>
              </div>
              {pinterest && (
                <div className="bg-white px-4 py-3">
                  <p className="text-xs font-semibold">{item.board}</p>
                  <p className="mt-1 text-xs text-neutral-500">Truth Studios</p>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-center py-10">
          {limit < posts.length ? (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setLimit(posts.length)}
            >
              Load more photographs
            </Button>
          ) : (
            <p className={`text-xs ${pinterest ? "text-neutral-500" : "text-neutral-400"}`}>
              You&apos;re all caught up. More from the studio soon.
            </p>
          )}
        </div>
      </div>
      <Modal
        open={post != null}
        onClose={() => setSelected(null)}
        title={pinterest ? "Studio inspiration" : "Truth Studios · Instagram"}
        size="full"
        bodyClassName="p-0"
      >
        {post && (
          <>
            <div className="grid md:grid-cols-[minmax(0,1.5fr)_minmax(250px,1fr)]">
              <div className="relative aspect-square bg-black">
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  sizes="(max-width: 767px) 95vw, 650px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col px-6 py-6 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-wider">@truthstudios</p>
                <time dateTime={post.date} className="mt-2 text-xs text-neutral-500">
                  {formatLongDate(post.date)}
                </time>
                <p className="mt-6 text-sm leading-7 text-neutral-700">
                  <RichText text={post.caption} />
                </p>
                <div className="mt-5 border-y border-neutral-200 py-2">
                  <LikeButton id={post.id} count={post.likes} />
                </div>
                <CommentThread
                  compact
                  title="Comments"
                  threadId={`social:${post.id}`}
                  seed={conversationSeed(post)}
                  className="mt-5"
                />
                <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                  <span className="text-xs text-neutral-500" aria-live="polite">
                    {selected + 1} / {posts.length}
                  </span>
                  <GalleryArrows onMove={move} />
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function TweetActions({ post }) {
  const { state, actions } = useStore();
  const reposted = Boolean(state.likes[`social:repost:${post.id}`]);
  return (
    <div className="flex items-center gap-6 border-t border-neutral-200 pt-3">
      <span className="flex items-center gap-2 text-xs text-neutral-500">
        <ChatBubbleOvalLeftIcon className="h-4 w-4" />
        {post.replies}
        <span className="sr-only"> replies</span>
      </span>
      <button
        type="button"
        aria-label="Repost"
        aria-pressed={reposted}
        onClick={() => actions.toggleLike(`social:repost:${post.id}`)}
        className={`flex min-h-10 cursor-pointer items-center gap-2 text-xs ${reposted ? "text-pmred" : "text-neutral-500 hover:text-pmred"}`}
      >
        <ArrowPathRoundedSquareIcon className="h-4 w-4" />
        {post.retweets + (reposted ? 1 : 0)}
      </button>
      <LikeButton id={post.id} count={post.likes} />
    </div>
  );
}

export function TwitterFeed({ posts }) {
  const { state } = useStore();
  const [selected, setSelected] = useState(null);
  const post = selected == null ? null : posts[selected];
  useGalleryKeys(selected != null, posts.length, setSelected);
  return (
    <>
      <div className="grid grid-cols-1 bg-neutral-100 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((item, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setSelected(index)}
            aria-label={`Read tweet: ${item.text}`}
            className="group flex min-h-72 cursor-pointer flex-col border-b border-r border-neutral-100 bg-white p-7 text-left transition-colors hover:bg-pmred hover:text-white focus-visible:bg-pmred focus-visible:text-white sm:p-8"
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <time
                  dateTime={item.date}
                  className="text-2xs text-neutral-500 group-hover:text-white/80 group-focus-visible:text-white/80"
                >
                  {formatLongDate(item.date)}
                </time>
                <p className="mt-1 text-2xs font-medium text-neutral-400 group-hover:text-white/70 group-focus-visible:text-white/70">
                  @truthstudios
                </p>
              </div>
              <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-pmred group-hover:text-white group-focus-visible:text-white" />
            </div>
            <p className="my-6 text-sm leading-6">
              <RichText text={item.text} />
            </p>
            <div className="mt-auto flex items-center gap-5 text-2xs text-neutral-400 group-hover:text-white/80 group-focus-visible:text-white/80">
              <span className="flex items-center gap-1">
                <ChatBubbleOvalLeftIcon className="h-3.5 w-3.5" />
                {item.replies}
              </span>
              <span className="flex items-center gap-1">
                <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5" />
                {item.retweets + (state.likes[`social:repost:${item.id}`] ? 1 : 0)}
              </span>
              <span className="flex items-center gap-1">
                <HeartIcon className="h-3.5 w-3.5" />
                {item.likes + (state.likes[`social:${item.id}`] ? 1 : 0)}
              </span>
            </div>
          </button>
        ))}
      </div>
      <Modal
        open={post != null}
        onClose={() => setSelected(null)}
        title="Truth Studios · Twitter"
        size="md"
      >
        {post && (
          <>
            <time dateTime={post.date} className="text-xs text-neutral-500">
              {formatLongDate(post.date)}
            </time>
            <p className="mb-8 mt-5 text-xl leading-relaxed">
              <RichText text={post.text} />
            </p>
            <TweetActions post={post} />
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-neutral-500" aria-live="polite">
                {selected + 1} / {posts.length}
              </p>
              <GalleryArrows
                onMove={(step) =>
                  setSelected((index) => (index + step + posts.length) % posts.length)
                }
              />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export function JournalFeed({ posts, tumblr = false }) {
  return (
    <div className="bg-neutral-50 px-4 py-6 sm:px-10 sm:py-10">
      <div className="mx-auto max-w-6xl columns-1 gap-6 md:columns-2">
        {posts.map((post, index) => (
          <article key={post.id} className="mb-6 break-inside-avoid bg-white">
            {post.image && (!tumblr || post.type === "photo") && (
              <div className="relative aspect-[4/3]">
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                  preload={index === 0}
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <p className="text-2xs font-semibold uppercase tracking-wider">Truth Studios</p>
              <time dateTime={post.date} className="mt-1 block text-2xs text-neutral-400">
                {formatLongDate(post.date)}
              </time>
              {tumblr && (
                <h2 className="mt-6 text-xs font-bold uppercase tracking-wider">{post.title}</h2>
              )}
              {post.type === "quote" ? (
                <blockquote className="my-6 border-l-2 border-pmred pl-5 text-2xl font-light leading-relaxed">
                  “{post.caption}”
                  <cite className="mt-4 block text-xs not-italic text-neutral-500">
                    — Notes from Truth Studios
                  </cite>
                </blockquote>
              ) : (
                <p className="my-5 text-sm leading-7 text-neutral-600">
                  <RichText text={post.caption} />
                </p>
              )}
              <LikeButton id={`${tumblr ? "tumblr" : "facebook"}:${post.id}`} count={post.likes} />
            </div>
          </article>
        ))}
      </div>
      <p className="py-6 text-center text-xs text-neutral-400">
        You&apos;re up to date with the studio.
      </p>
    </div>
  );
}

function VideoPreview({ post, pause, loop }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <video
        src={post.src}
        poster={post.image}
        autoPlay
        controls
        playsInline
        loop={loop}
        onPlay={pause}
        onError={() => setFailed(true)}
        className="aspect-video w-full bg-black"
        aria-label={post.title}
      />
      <div className="px-7 py-6">
        <p className="text-sm text-neutral-600">{post.caption}</p>
        {failed && (
          <p role="alert" className="mt-3 text-sm text-pmred">
            This preview couldn&apos;t load.{" "}
            <a
              href={post.src}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer underline"
            >
              Open the video directly
            </a>
            .
          </p>
        )}
      </div>
    </>
  );
}

export function VideoFeed({ posts, network }) {
  const [selected, setSelected] = useState(null);
  const { pause } = usePlayer();
  return (
    <>
      <div className="grid grid-cols-1 bg-black sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <button
            key={post.id}
            type="button"
            onClick={() => {
              pause();
              setSelected(post);
            }}
            className="group cursor-pointer text-left focus-visible:outline-4 focus-visible:outline-pmred"
            aria-label={`Play ${post.title}`}
          >
            <div
              className={`relative overflow-hidden ${network === "vine" ? "aspect-square" : "aspect-video"}`}
            >
              <Image
                src={post.image}
                alt={post.alt}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                preload={index === 0}
                className="object-cover brightness-75 transition duration-500 group-hover:scale-105 group-hover:brightness-100 motion-reduce:transform-none motion-reduce:transition-none"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pmred text-white transition-transform group-hover:scale-110 motion-reduce:transform-none">
                  <PlayIcon className="ml-1 h-6 w-6 fill-current" />
                </span>
              </span>
              <span className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 text-2xs text-white">
                {post.duration}
              </span>
            </div>
            <div className="px-6 py-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-pmred">
                {post.title}
              </h2>
              <p className="mt-2 text-xs text-neutral-400">
                {formatNumber(post.views)} views · {formatLongDate(post.date)}
              </p>
            </div>
          </button>
        ))}
      </div>
      <Modal
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.title || "Video"}
        size="full"
        bodyClassName="p-0"
      >
        {selected && (
          <VideoPreview key={selected.id} post={selected} pause={pause} loop={network === "vine"} />
        )}
      </Modal>
    </>
  );
}
