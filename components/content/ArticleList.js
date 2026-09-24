import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import AppContainer from "../AppContainer";
import ArticleCard from "../ArticleCard";
import Button from "../ui/Button";

function FilteredArticles({ posts, section, active }) {
  const [visible, setVisible] = useState(6);
  const filtered = active
    ? posts.filter((post) => post.category === active || post.tags.includes(active))
    : posts;
  return (
    <>
      <p className="sr-only" role="status">
        {filtered.length} articles{active ? ` about ${active}` : ""}
      </p>
      <ul className="grid gap-px bg-neutral-200 lg:grid-cols-2">
        {filtered.slice(0, visible).map((post, index) => (
          <li key={post.id}>
            <ArticleCard {...post} href={`/${section}/${post.id}`} priority={index === 0} />
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <div className="px-6 py-24 text-center">
          <h2 className="text-xl font-bold uppercase">No stories here yet</h2>
          <p className="my-4 text-neutral-500">Try another topic from the list above.</p>
          <Button href={`/${section}`} variant="outline">
            All stories
          </Button>
        </div>
      )}
      {filtered.length > visible ? (
        <div className="flex justify-center bg-neutral-50 py-10">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => setVisible((count) => count + 6)}
          >
            <ArrowPathIcon className="h-5 w-5" />
            Load more
          </Button>
        </div>
      ) : (
        filtered.length > 0 && (
          <p className="bg-neutral-50 py-10 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            You&apos;re all caught up
          </p>
        )
      )}
    </>
  );
}

export default function ArticleList({ posts, section }) {
  const router = useRouter();
  const active = typeof router.query.tag === "string" ? router.query.tag : "";
  const categories = [...new Set(posts.map((post) => post.category))];
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort();
  const title = section === "news" ? "News" : "Blog";
  return (
    <AppContainer
      curMenu={title}
      description={
        section === "news"
          ? "New music, studio sessions and stories from the Projct community."
          : "Notes on music, creativity and life inside Truth Studios."
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-5 border-b border-neutral-200 px-5 py-6 sm:px-10">
        <h1 className="text-sm font-extrabold uppercase tracking-[0.2em]">
          {title === "News" ? "Latest from Projct" : "Notes from the studio"}
        </h1>
        <nav aria-label="Article categories" className="flex flex-wrap items-center gap-2">
          {["", ...categories].map((category) => (
            <Link
              key={category}
              href={
                category ? { pathname: `/${section}`, query: { tag: category } } : `/${section}`
              }
              shallow
              scroll={false}
              aria-current={active === category ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${active === category ? "bg-pmred text-white" : "text-neutral-500 hover:bg-neutral-100"}`}
            >
              {category || "All"}
            </Link>
          ))}
          <select
            aria-label="Filter by tag"
            value={tags.includes(active) ? active : ""}
            onChange={(event) =>
              router.push(
                event.target.value
                  ? { pathname: `/${section}`, query: { tag: event.target.value } }
                  : `/${section}`,
                undefined,
                { shallow: true, scroll: false }
              )
            }
            className="max-w-40 cursor-pointer rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </select>
        </nav>
      </div>
      <FilteredArticles key={active} posts={posts} section={section} active={active} />
    </AppContainer>
  );
}
