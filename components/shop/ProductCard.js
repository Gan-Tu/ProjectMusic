import Link from "next/link";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useStore } from "../../lib/store";
import { useUI } from "../../lib/ui";
import { formatCredits, formatUSD } from "../../lib/format";
import ProductVisual from "./ProductVisual";
import { makeCartItem, showCartToast } from "./cart";

export default function ProductCard({ product, priority = false }) {
  const { actions } = useStore();
  const { openModal } = useUI();
  const cheapestTier = product.tiers?.reduce(
    (best, tier) => (tier.price < best.price ? tier : best),
    product.tiers[0]
  );
  const price = cheapestTier?.price ?? product.price;
  const credits = cheapestTier ? cheapestTier.credits : product.credits;
  function addToCart() {
    const item = makeCartItem(product, { tier: cheapestTier });
    actions.addToCart(item, 1);
    showCartToast(item, openModal);
  }
  return (
    <article className="group relative min-w-0 border-b border-r border-neutral-200 bg-white">
      <Link
        href={`/shop/${product.id}`}
        className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-pmred"
      >
        <div className="relative aspect-square overflow-hidden bg-[#f4f4f4]">
          <ProductVisual product={product} priority={priority} />
        </div>
        <div className="min-h-28 px-4 py-5 sm:px-6">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {product.category.replaceAll("-", " ")}
          </p>
          <h3 className="pr-5 text-xs font-bold uppercase leading-relaxed tracking-wide transition-colors group-hover:text-pmred">
            {product.name}
          </h3>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm font-bold text-pmred">
            {product.tiers?.length > 1 && <span className="text-2xs font-medium">From</span>}
            {price != null && formatUSD(price)}
            {credits != null && (
              <span className="text-2xs font-medium text-neutral-500">
                {price != null ? "or " : ""}
                {formatCredits(credits)}
              </span>
            )}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={addToCart}
        aria-label={`Add ${product.name}${cheapestTier ? ` (${cheapestTier.label})` : ""} to cart`}
        title={
          cheapestTier ? `Add ${cheapestTier.label} to cart` : "Add to cart with default options"
        }
        className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-pmred shadow-xs transition hover:bg-pmred hover:text-white focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <ShoppingBagIcon className="h-5 w-5" />
      </button>
    </article>
  );
}
