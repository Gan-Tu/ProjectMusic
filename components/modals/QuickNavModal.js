import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { MENUS } from "../MegaMenu";

const EXTRA_DESTINATIONS = [
  { label: "Home", href: "/" },
  { label: "Albums", href: "/albums" },
  { label: "Shop", href: "/shop" },
  { label: "Profile", href: "/profile" },
  { label: "Sign up", href: "/signup" }
];

const SHORTCUTS = [
  { title: "Start / Stop", text: "Space starts or stops the current song or video." },
  {
    title: "Back or forward scroll",
    text: "← → skip 10 seconds · Shift + ← → previous / next song."
  },
  { title: "Next menu selection", text: "↑ ↓ ← → move through the open menu." },
  { title: "Switch menu categories", text: "1 Home menu · 2 Shop menu · 3 Social menu." },
  { title: "Open playlist", text: "Press P on your keyboard." },
  { title: "Add item to cart", text: "Press B on a product (or buy the playing song)." },
  { title: "Mute / quick navigation", text: "M mutes · ? opens this panel · Esc closes." }
];

function Key({ children, active, wide }) {
  return (
    <kbd
      className={
        "flex h-9 items-center justify-center rounded-full border text-xs font-semibold " +
        (wide ? "w-16 " : "w-9 ") +
        (active ? "border-pmred bg-pmred text-white" : "border-neutral-300 text-neutral-600")
      }
    >
      {children}
    </kbd>
  );
}

export default function QuickNavModal({ open, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const destinations = useMemo(() => {
    const all = [
      ...EXTRA_DESTINATIONS,
      ...Object.values(MENUS)
        .flat()
        .filter((item) => item.href)
        .map(({ label, href }) => ({ label, href }))
    ];
    const seen = new Set();
    return all.filter((d) => !seen.has(d.href) && seen.add(d.href));
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? destinations.filter((d) => d.label.toLowerCase().includes(q)).slice(0, 6)
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick navigation"
      size="xl"
      footer={
        <Button variant="muted" size="xs" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
        <div className="flex flex-col items-center gap-8">
          <form
            className="relative w-full"
            onSubmit={(e) => {
              e.preventDefault();
              if (matches[0]) {
                onClose();
                router.push(matches[0].href);
              }
            }}
          >
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-2.5 h-5 w-5 text-neutral-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to a page…"
              aria-label="Jump to a page"
              autoFocus
              className="h-10 w-full rounded-full border border-neutral-200 pl-10 pr-4 text-sm placeholder:text-neutral-300 focus:border-pmred focus:outline-none"
            />
            {matches.length > 0 && (
              <ul className="absolute inset-x-0 top-12 z-10 bg-white py-1 shadow-xl ring-1 ring-black/5">
                {matches.map((d) => (
                  <li key={d.href}>
                    <Link
                      href={d.href}
                      onClick={onClose}
                      className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:bg-pmred hover:text-white"
                    >
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
          <div className="flex flex-col items-center gap-2" aria-hidden="true">
            <Key>↑</Key>
            <div className="flex gap-2">
              <Key>←</Key>
              <Key>↓</Key>
              <Key>→</Key>
            </div>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            <Key>1</Key>
            <Key active>2</Key>
            <Key>3</Key>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            <Key wide>Space</Key>
            <Key>P</Key>
            <Key>B</Key>
          </div>
        </div>
        <dl className="space-y-5">
          {SHORTCUTS.map((s) => (
            <div key={s.title}>
              <dt className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                {s.title}
              </dt>
              <dd className="mt-1 text-xs text-neutral-500">{s.text}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-neutral-500 md:col-start-2">
          Letter, number and ? shortcuts can be turned off in Settings → General.
        </p>
      </div>
    </Modal>
  );
}
