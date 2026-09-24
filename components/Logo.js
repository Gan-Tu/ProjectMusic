import Link from "next/link";
import { classNames } from "../lib/format";

export default function Logo({ className, href = "/" }) {
  return (
    <Link
      href={href}
      aria-label="Projct Music home"
      className={classNames(
        "inline-flex select-none items-center gap-2 whitespace-nowrap leading-none",
        className
      )}
    >
      <span className="text-[1.35em] font-extrabold tracking-tight text-neutral-900">PROJCT</span>
      <span className="border-2 border-pmred px-1.5 py-1 font-serif text-[1.05em] font-bold tracking-wide text-pmred">
        MUSIC
      </span>
    </Link>
  );
}
