import Link from "next/link";
import Image from "next/image";
import { HeartIcon } from "@heroicons/react/24/outline";
import AppContainer from "../AppContainer";
import ArticleCard from "../ArticleCard";
import { useStore } from "../../lib/store";
import ShareLinks from "./ShareLinks";
import CommentThread from "../comments/CommentThread";

export default function ArticleDetail({ post, related, section }) {
  const { state, actions } = useStore();
  const likeId = `${section}-${post.id}`;
  return (
    <AppContainer
      title={post.title}
      curMenu={section === "news" ? "News" : "Blog"}
      description={post.snippet}
    >
      <article>
        <div className="relative flex min-h-100 items-end overflow-hidden bg-neutral-900 sm:min-h-130">
          <Image
            src={post.imgUrl}
            fill
            sizes="100vw"
            priority
            alt={post.title}
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
          <div className="relative w-full px-6 py-12 sm:px-[10%] sm:py-16">
            <Link
              href={`/${section}`}
              className="mb-5 inline-block text-xs font-bold uppercase tracking-widest text-white hover:text-pmred"
            >
              ← All {section === "news" ? "news" : "stories"}
            </Link>
            <h1 className="max-w-3xl text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
              <span className="bg-pmred px-2 py-1 text-white [box-decoration-break:clone]">
                {post.title}
              </span>
            </h1>
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[minmax(0,1fr)_240px] md:px-10 md:py-16">
          <div className="min-w-0">
            <p className="mb-8 text-xs text-neutral-400">
              Posted on {post.date}
              <span className="ml-3 font-semibold text-pmred">{post.author}</span>
            </p>
            <p className="mb-8 text-xl font-light leading-relaxed text-neutral-800">
              {post.snippet}
            </p>
            <div className="space-y-6 text-sm font-light leading-8 text-neutral-500">
              {post.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <CommentThread
              key={`${section}-${post.id}`}
              threadId={`${section}:${post.id}`}
              className="mt-12 border-t border-neutral-200 pt-8"
            />
          </div>
          <aside className="border-t border-neutral-200 pt-8 md:border-t-0 md:pt-0">
            <div className="flex flex-wrap items-center gap-4">
              <ShareLinks href={`/${section}/${post.id}`} title={post.title} />
              <button
                type="button"
                aria-pressed={!!state.likes[likeId]}
                aria-label={state.likes[likeId] ? "Unlike article" : "Like article"}
                onClick={() => actions.toggleLike(likeId)}
                className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-pmred"
              >
                <HeartIcon className={`h-5 w-5 ${state.likes[likeId] ? "fill-pmred" : ""}`} />
                {state.likes[likeId] ? "Liked" : "Like"}
              </button>
            </div>
            <h2 className="mb-4 mt-10 text-xs font-bold uppercase tracking-widest">Filed under</h2>
            <div className="flex flex-wrap gap-2">
              {[...new Set([post.category, ...post.tags])].map((tag) => (
                <Link
                  href={{ pathname: `/${section}`, query: { tag } }}
                  key={tag}
                  className="rounded-full bg-neutral-100 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-neutral-500 hover:bg-pmred hover:text-white"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <div className="mt-10 border-t border-neutral-200 pt-6">
              <p className="text-xs font-bold uppercase tracking-widest">
                Truth Studios / Los Angeles
              </p>
              <p className="mt-3 text-sm font-light leading-relaxed text-neutral-400">
                Music, people and the stories in between.
              </p>
              <Link href="/about" className="mt-4 inline-block text-xs font-semibold text-pmred">
                Our story →
              </Link>
            </div>
          </aside>
        </div>
      </article>
      <section className="border-t border-neutral-200">
        <h2 className="px-6 py-8 text-sm font-extrabold uppercase tracking-widest sm:px-10">
          Related {section === "news" ? "news" : "stories"}
        </h2>
        <ul className="grid gap-px bg-neutral-200 lg:grid-cols-2">
          {related.map((item) => (
            <li key={item.id}>
              <ArticleCard {...item} href={`/${section}/${item.id}`} />
            </li>
          ))}
        </ul>
      </section>
    </AppContainer>
  );
}
