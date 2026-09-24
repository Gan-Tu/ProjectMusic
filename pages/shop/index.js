import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import ProductCard from "../../components/shop/ProductCard";
import { classNames } from "../../lib/format";
import { CATEGORIES, getProducts } from "../../utils/getFakeProducts";

export default function Shop({ products, categories }) {
  const router = useRouter();
  const [sort, setSort] = useState("featured");
  const category = categories.find((item) => item.slug === router.query.category);
  const visible = products
    .filter((product) => !category || product.category === category.slug)
    .sort((a, b) => {
      const lowestPrice = (product) =>
        product.tiers?.length
          ? Math.min(...product.tiers.map((tier) => tier.price))
          : product.price;
      if (sort === "price-low") return lowestPrice(a) - lowestPrice(b);
      if (sort === "price-high") return lowestPrice(b) - lowestPrice(a);
      if (sort === "newest") return b.addedAt.localeCompare(a.addedAt);
      return Number(b.featured) - Number(a.featured);
    });
  return (
    <AppContainer
      title={category?.label || "Shop"}
      curMenu="Shop"
      description="Music, studio essentials, and more. Shop the Truth Studios collection at Projct Music."
    >
      {!category && (
        <section className="grid bg-pmred md:grid-cols-2" aria-label="Featured collection">
          <div className="flex flex-col items-start justify-center px-6 py-10 text-white motion-safe:animate-fade-in sm:px-12 md:py-16 lg:px-20">
            <p className="mb-6 text-2xs font-bold uppercase tracking-[0.3em]">
              The studio collection / 01
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Truth
              <br />
              Studios
            </h1>
            <p className="mt-4 text-xl font-light uppercase tracking-[0.15em]">T-shirts</p>
            <p className="mt-6 max-w-xs text-sm leading-6 text-white/85">
              From the studio to the street.
              <br />
              Wear the sound.
            </p>
            <Link
              href="/shop/truth-studios-t-shirt"
              className="mt-7 inline-flex cursor-pointer items-center gap-5 rounded-full border border-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white hover:text-pmred"
            >
              Shop the original <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <Link
            href="/shop/truth-studios-t-shirt"
            aria-label="Shop the Truth Studios T-shirt"
            className="group relative block aspect-[4/3] cursor-pointer overflow-hidden bg-[#f1f1f1] md:aspect-auto md:min-h-[440px]"
          >
            <Image
              src="/shop/truth-tee.webp"
              alt="Black Truth Studios T-shirt with a vivid multicolor graphic"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              preload
              className="object-cover motion-safe:transition-transform motion-safe:duration-700 group-hover:scale-105"
            />
            <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-pmred">
              <ArrowUpRightIcon className="h-5 w-5" />
            </span>
          </Link>
        </section>
      )}
      <section aria-label="Shop catalog">
        <div className="border-b border-neutral-200 px-5 py-7 sm:px-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-wide">
                {category?.label || "The shop"}
              </h2>
              <p className="mt-2 text-xs text-neutral-500" aria-live="polite">
                {visible.length} products · Music. Culture. Community.
              </p>
            </div>
            <label className="flex items-center gap-3 text-2xs font-bold uppercase tracking-wider">
              Sort by
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="max-w-48 cursor-pointer rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium normal-case tracking-normal outline-pmred"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
          <nav
            aria-label="Shop categories"
            className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1"
          >
            {[{ slug: "all", label: "All" }, ...categories].map((item) => {
              const active = item.slug === (category?.slug || "all");
              return (
                <Link
                  key={item.slug}
                  href={
                    item.slug === "all"
                      ? "/shop"
                      : { pathname: "/shop", query: { category: item.slug } }
                  }
                  shallow
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={classNames(
                    "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-2xs font-bold uppercase tracking-wider transition-colors",
                    active
                      ? "border-pmred bg-pmred text-white"
                      : "border-neutral-200 text-neutral-500 hover:border-pmred hover:text-pmred"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={Boolean(category) && index < 4}
            />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="px-6 py-24 text-center">
            <h3 className="font-bold uppercase tracking-wide">More good things are coming</h3>
            <Link
              href="/shop"
              className="mt-4 inline-block cursor-pointer text-sm text-pmred underline"
            >
              Explore the full collection
            </Link>
          </div>
        )}
      </section>
    </AppContainer>
  );
}

export function getStaticProps() {
  return { props: { products: getProducts(), categories: CATEGORIES } };
}
