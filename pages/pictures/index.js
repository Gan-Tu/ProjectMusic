import Image from "next/image";
import Link from "next/link";
import AppContainer from "../../components/AppContainer";
import { PHOTO_CATEGORIES } from "../../utils/getFakePhotos";

export default function Pictures({ categories }) {
  return (
    <AppContainer
      title="Pictures"
      curMenu="Pictures"
      description="Studio moments, artist portraits, polaroids and places around Projct Music."
    >
      <h1 className="sr-only">Pictures</h1>
      <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/pictures/${category.id}`}
            className="group relative flex min-h-80 cursor-pointer items-end overflow-hidden px-8 py-12 sm:min-h-[480px] lg:min-h-[calc(100svh-160px)] lg:px-10 lg:pb-28"
          >
            <Image
              src={category.image}
              alt={category.description}
              fill
              priority={index < 2}
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
              className="object-cover grayscale transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
            />
            <span
              className={`absolute inset-0 transition-colors duration-300 ${category.id === "artists" ? "bg-pmred/70" : "bg-white/75 group-hover:bg-pmred/80 group-focus-visible:bg-pmred/80"}`}
            />
            <div
              className={`relative z-10 max-w-48 transition-colors ${category.id === "artists" ? "text-white" : "text-black group-hover:text-white group-focus-visible:text-white"}`}
            >
              <h2 className="min-h-14 text-2xl font-extrabold uppercase leading-tight tracking-tight">
                {category.name}
              </h2>
              <span
                aria-hidden="true"
                className={`mt-3 block text-3xl font-extrabold tracking-widest ${category.id === "artists" ? "text-white" : "text-pmred group-hover:text-white group-focus-visible:text-white"}`}
              >
                ...
              </span>
              <p className="mt-5 min-h-10 text-xs leading-relaxed opacity-80">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AppContainer>
  );
}

export function getStaticProps() {
  return { props: { categories: PHOTO_CATEGORIES } };
}
