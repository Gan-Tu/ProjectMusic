import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  CheckIcon,
  ChevronRightIcon,
  LinkIcon,
  MinusIcon,
  PlusIcon,
  ShareIcon
} from "@heroicons/react/24/outline";
import AppContainer from "../../components/AppContainer";
import Button from "../../components/ui/Button";
import ProductVisual, { DigitalIcon } from "../../components/shop/ProductVisual";
import RelatedProducts from "../../components/shop/RelatedProducts";
import { makeCartItem, showCartToast } from "../../components/shop/cart";
import { useStore } from "../../lib/store";
import { useCartCandidate, useUI } from "../../lib/ui";
import { classNames, formatCredits, formatUSD } from "../../lib/format";
import {
  CATEGORIES,
  getProductById,
  getProducts,
  getRelatedProducts
} from "../../utils/getFakeProducts";

function ProductDetail({ product, category, related }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(product.sizes?.[0]);
  const [color, setColor] = useState(product.colors?.[0]);
  const [tierId, setTierId] = useState(product.tiers?.[0]?.id);
  const { actions } = useStore();
  const { openModal } = useUI();
  const tier = product.tiers?.find((entry) => entry.id === tierId);
  const item = useMemo(
    () => makeCartItem(product, { tier, size, color }),
    [product, tier, size, color]
  );
  useCartCandidate({ ...item, qty: quantity });
  const isDigital = product.kind === "digital";

  function addToCart() {
    actions.addToCart(item, quantity);
    showCartToast(item, openModal, quantity);
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied");
    } catch {
      toast.error("Could not copy the link. Copy the address from your browser.");
    }
  }
  async function share() {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch (error) {
      if (error.name !== "AbortError") await copyLink();
    }
  }
  return (
    <AppContainer title={product.name} curMenu="Shop" description={product.description}>
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-5 text-2xs font-semibold uppercase tracking-wider sm:px-10"
      >
        <Link href="/shop" className="cursor-pointer text-neutral-500 hover:text-pmred">
          Shop
        </Link>
        <ChevronRightIcon className="h-3 w-3 text-neutral-400" />
        <Link
          href={`/shop?category=${product.category}`}
          className="cursor-pointer text-neutral-500 hover:text-pmred"
        >
          {category.label}
        </Link>
        <ChevronRightIcon className="h-3 w-3 text-neutral-400" />
        <span className="text-pmred-dark" aria-current="page">
          {product.name}
        </span>
      </nav>
      <div className="grid md:grid-cols-2">
        <section
          aria-label="Product gallery"
          className={isDigital ? "flex flex-col bg-pmred" : "bg-[#f4f4f4]"}
        >
          <div className="relative aspect-square max-h-[650px] w-full overflow-hidden">
            <ProductVisual product={product} image={product.images[imageIndex]} priority large />
          </div>
          {!isDigital && product.images.length > 1 && (
            <div className="flex flex-wrap gap-3 bg-white p-5 sm:px-10">
              {product.images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`View ${index === 0 ? "full product" : `detail ${index}`}`}
                  aria-pressed={imageIndex === index}
                  className={classNames(
                    "relative h-16 w-16 cursor-pointer overflow-hidden border-2 transition-colors",
                    imageIndex === index
                      ? "border-pmred"
                      : "border-transparent hover:border-neutral-300"
                  )}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
        <section
          aria-labelledby="product-name"
          className="flex flex-col justify-center px-6 py-9 sm:px-10 lg:px-14 lg:py-12"
        >
          <p className="mb-4 text-2xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {isDigital ? "More music. More possibilities." : "The Projct Music collection"}
          </p>
          <h1
            id="product-name"
            className="max-w-xl text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-3xl lg:text-4xl"
          >
            {product.name}
          </h1>
          <div
            className="mt-5 flex flex-wrap items-baseline gap-3"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-3xl font-light text-pmred">
              {item.price != null ? formatUSD(item.price) : formatCredits(item.credits)}
            </span>
            {item.credits != null && item.price != null && (
              <span className="text-xs text-neutral-500">
                or <span className="font-semibold text-pmred">{formatCredits(item.credits)}</span>{" "}
                credits
              </span>
            )}
          </div>
          {tier && (
            <p className="mt-2 text-xs text-neutral-500">
              {tier.label}
              {item.grantsCredits > 0 ? " added to your balance" : " · One-time purchase"}
            </p>
          )}
          <div className="my-7 border-y border-neutral-200 py-6">
            <div className="flex flex-wrap items-end gap-6">
              <fieldset>
                <legend className="mb-3 text-2xs font-bold uppercase tracking-wider">
                  Quantity
                </legend>
                <div className="flex h-10 items-center rounded-full border border-neutral-200">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="cursor-pointer rounded-l-full p-3 hover:text-pmred disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <output className="min-w-7 text-center text-xs font-semibold" aria-live="polite">
                    {quantity}
                  </output>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= 99}
                    onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                    className="cursor-pointer rounded-r-full p-3 hover:text-pmred disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
              </fieldset>
              {product.sizes && (
                <label className="flex flex-col gap-3 text-2xs font-bold uppercase tracking-wider">
                  Size
                  <select
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    className="h-10 min-w-24 cursor-pointer rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium outline-pmred"
                  >
                    {product.sizes.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              {product.colors && (
                <label className="flex flex-col gap-3 text-2xs font-bold uppercase tracking-wider">
                  Color
                  <select
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-10 cursor-pointer rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium outline-pmred"
                  >
                    {product.colors.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {product.tiers?.length > 1 && (
              <label className="mt-5 flex max-w-xs flex-col gap-3 text-2xs font-bold uppercase tracking-wider">
                Choose your plan
                <select
                  value={tierId}
                  onChange={(event) => setTierId(event.target.value)}
                  className="h-10 cursor-pointer rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium normal-case outline-pmred"
                >
                  {product.tiers.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label} — {formatUSD(entry.price)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="md" className="min-h-11 cursor-pointer" onClick={addToCart}>
                Add to cart
              </Button>
              <Button
                variant="outline"
                size="md"
                className="min-h-11 cursor-pointer"
                onClick={() => openModal("purchase", { item: { ...item, qty: quantity } })}
              >
                Buy now
              </Button>
            </div>
          </div>
          <h2 className="mb-3 text-2xs font-bold uppercase tracking-[0.15em]">
            Product description
          </h2>
          <p className="max-w-xl text-sm font-light leading-7 text-neutral-500">
            {product.description}
          </p>
          {product.subtitle && (
            <p className="mt-4 text-xs font-semibold text-neutral-600">{product.subtitle}</p>
          )}
          <p className="mt-5 flex items-center gap-2 text-2xs text-neutral-500">
            <CheckIcon className="h-4 w-4 text-pmred" />
            {isDigital
              ? "Available in your account after purchase"
              : product.kind === "ticket"
                ? "Digital ticket · Saved with your purchases"
                : "In stock · Carefully packed for your collection"}
          </p>
          <div className="mt-7 flex items-center gap-3 border-t border-neutral-100 pt-5">
            <span className="mr-1 text-2xs font-bold uppercase tracking-wider text-neutral-500">
              Share
            </span>
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy product link"
              className="cursor-pointer rounded-full border border-neutral-200 p-2.5 text-neutral-500 transition-colors hover:border-pmred hover:text-pmred"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="Share product"
              className="cursor-pointer rounded-full border border-neutral-200 p-2.5 text-neutral-500 transition-colors hover:border-pmred hover:text-pmred"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
      {product.tiers?.length > 1 && (
        <section aria-labelledby="plans-heading" className="border-t border-neutral-200">
          <h2
            id="plans-heading"
            className="px-5 py-7 text-xs font-extrabold uppercase tracking-[0.18em] sm:px-10"
          >
            Choose your plan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex">
            {product.tiers.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === tierId}
                onClick={() => setTierId(entry.id)}
                className={classNames(
                  "flex min-w-0 cursor-pointer flex-col items-center justify-center gap-3 border-r border-t border-neutral-200 px-3 py-7 transition-colors lg:flex-1",
                  entry.id === tierId
                    ? "bg-pmred text-white"
                    : "bg-neutral-50 text-pmred-dark hover:bg-pmred/10"
                )}
              >
                <DigitalIcon category={product.category} className="h-9 w-9" />
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {entry.label}
                </span>
                <span className="text-xs">{formatUSD(entry.price)}</span>
                {entry.id === tierId && (
                  <span className="text-2xs font-bold uppercase tracking-widest">Selected</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
      <RelatedProducts products={related} />
    </AppContainer>
  );
}

export default function ProductPage(props) {
  return <ProductDetail key={props.product.id} {...props} />;
}

export function getStaticPaths() {
  return {
    paths: getProducts().map((product) => ({ params: { id: product.id } })),
    fallback: "blocking"
  };
}

export function getStaticProps({ params }) {
  const product = getProductById(params.id);
  if (!product) return { notFound: true };
  return {
    props: {
      product,
      category: CATEGORIES.find((category) => category.slug === product.category),
      related: getRelatedProducts(product)
    }
  };
}
