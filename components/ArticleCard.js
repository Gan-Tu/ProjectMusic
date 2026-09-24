import Image from "./ui/SmartImage";
import Link from "next/link";
import Button from "./ui/Button";
import ShareLinks from "./content/ShareLinks";

export default function ArticleCard({
  imgUrl,
  imageAlt,
  imgAlt,
  title,
  date,
  author,
  snippet,
  href = "/news",
  category,
  priority = false,
  eager = false // visible on load, but not the one image worth preloading
}) {
  return (
    <article className="grid h-full grid-cols-[40%_60%] bg-white sm:grid-cols-2">
      <Link
        href={href}
        className="group relative min-h-80 overflow-hidden bg-neutral-200"
        aria-label={`Read ${title}`}
      >
        <Image
          src={imgUrl}
          fill
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 50vw, 25vw"
          alt={imageAlt || imgAlt || title}
          preload={priority}
          loading={eager && !priority ? "eager" : undefined}
          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
      </Link>
      <div className="flex min-w-0 flex-col justify-center px-4 py-7 sm:px-7 sm:py-10 xl:px-10">
        {category && (
          <p className="mb-3 text-2xs font-bold uppercase tracking-[0.18em] text-pmred">
            {category}
          </p>
        )}
        <h2 className="text-sm font-extrabold uppercase leading-snug tracking-wide wrap-anywhere sm:text-lg">
          <Link href={href} className="hover:text-pmred">
            {title}
          </Link>
        </h2>
        <p className="mt-3 text-xs leading-relaxed text-neutral-600">
          {date}
          <span className="block font-medium text-pmred-dark">{author}</span>
        </p>
        <p className="my-5 border-y border-neutral-200 py-4 text-xs font-light leading-relaxed text-neutral-500 sm:text-sm">
          {snippet}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button href={href} variant="outline" size="xs" className="cursor-pointer">
            Read more
          </Button>
          <ShareLinks href={href} title={title} />
        </div>
      </div>
    </article>
  );
}
