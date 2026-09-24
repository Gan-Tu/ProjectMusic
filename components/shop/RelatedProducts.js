import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import ProductCard from "./ProductCard";

export default function RelatedProducts({ products }) {
  const strip = useRef(null);
  function move(direction) {
    strip.current?.scrollBy({
      left: direction * strip.current.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
  }
  return (
    <section aria-labelledby="related-heading" className="border-t border-neutral-200">
      <div className="flex items-center justify-between gap-4 px-5 py-7 sm:px-10">
        <h2 id="related-heading" className="text-xs font-extrabold uppercase tracking-[0.18em]">
          Related products
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous related products"
            className="cursor-pointer bg-pmred p-2 text-white hover:bg-pmred-dark"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next related products"
            className="cursor-pointer bg-pmred p-2 text-white hover:bg-pmred-dark"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        ref={strip}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
        aria-label="Related products"
      >
        {products.map((product) => (
          <div className="w-[65%] shrink-0 snap-start sm:w-1/3 lg:w-1/5" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
