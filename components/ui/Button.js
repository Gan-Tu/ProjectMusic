import Link from "next/link";
import { classNames } from "../../lib/format";

const VARIANTS = {
  // filled red pill ("SUBMIT", "ADD TO CART", "BUY")
  primary: "bg-pmred text-white hover:bg-pmred-dark border-2 border-pmred hover:border-pmred-dark",
  // red outline pill ("READ MORE", "GET TICKETS")
  outline: "border-2 border-pmred text-pmred hover:bg-pmred hover:text-white",
  // light grey outline pill ("CANCEL", "CLOSE")
  muted:
    "border border-neutral-300 text-neutral-500 hover:border-neutral-500 hover:text-neutral-600",
  // white outline on dark backgrounds
  light: "border border-white/70 text-white hover:bg-white hover:text-black",
  dark: "bg-black text-white hover:bg-neutral-800 border-2 border-black",
  // borderless red text on light grey bands ("LOAD MORE"); the darker red stays readable
  ghost: "text-pmred-dark hover:bg-pmred/10"
};

const SIZES = {
  xs: "px-3 py-0.5 text-2xs",
  sm: "px-4 py-1 text-xs",
  md: "px-6 py-2 text-xs",
  lg: "px-8 py-3 text-sm"
};

export default function Button({
  variant = "primary",
  size = "sm",
  href,
  className,
  children,
  type = "button",
  ...props
}) {
  const classes = classNames(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
