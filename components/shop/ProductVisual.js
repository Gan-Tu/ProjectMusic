import Image from "next/image";
import {
  ArrowDownTrayIcon,
  PencilSquareIcon,
  ShoppingBagIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { classNames } from "../../lib/format";

export function DigitalIcon({ category, className = "h-20 w-20" }) {
  if (category === "credits") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="24" />
        <path d="M41 23a13 13 0 1 0 0 18M31 15v34" />
      </svg>
    );
  }
  if (category === "vip") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
        aria-hidden="true"
      >
        <path d="m10 22 12 9 10-18 10 18 12-9-5 26H15L10 22Zm5 18h34M16 54h32" />
        <circle cx="32" cy="7" r="2" />
        <circle cx="8" cy="16" r="2" />
        <circle cx="56" cy="16" r="2" />
      </svg>
    );
  }
  const Icon =
    { subscriptions: PencilSquareIcon, packages: ShoppingBagIcon, downloads: ArrowDownTrayIcon }[
      category
    ] || SparklesIcon;
  return <Icon className={className} strokeWidth={1.2} aria-hidden="true" />;
}

export default function ProductVisual({
  product,
  image,
  priority = false,
  large = false,
  className
}) {
  if (product.kind === "digital") {
    return (
      <div
        className={classNames(
          "flex h-full w-full flex-col items-center justify-center gap-5 bg-pmred px-5 py-10 text-center text-white",
          className
        )}
      >
        <DigitalIcon
          category={product.category}
          className={large ? "h-28 w-28 sm:h-36 sm:w-36" : "h-16 w-16 sm:h-24 sm:w-24"}
        />
        <span
          className={classNames(
            "max-w-sm font-extrabold uppercase tracking-wide",
            large ? "text-3xl sm:text-4xl" : "text-lg sm:text-xl"
          )}
        >
          {product.name}
        </span>
        {large && (
          <span className="text-xs font-medium uppercase tracking-[0.25em]">Projct Music</span>
        )}
      </div>
    );
  }
  return (
    <Image
      src={image || product.images[0]}
      alt={product.name}
      fill
      sizes={
        large
          ? "(max-width: 768px) 100vw, 50vw"
          : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      }
      preload={priority}
      className={classNames(
        "object-contain motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.035]",
        className
      )}
    />
  );
}
