export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function pad2(num) {
  return String(num).padStart(2, "0");
}

// 83 -> "01:23", 3725 -> "1:02:05"
export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

// 13000 -> "13K", 6900 -> "6,9K" (the mock uses a comma as decimal separator)
export function formatCompact(value) {
  if (value < 1000) return String(value);
  const k = value / 1000;
  return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "").replace(".", ",")}K`;
}

export function formatUSD(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function formatCredits(value) {
  return `₵${formatNumber(value)}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

// "2022-09-29" or Date -> "29 September 2022"
export function formatLongDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);
  return `${pad2(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// Chat-style time for an ISO timestamp: "14:05" on the day of `now`, "15 Sep" before
// (local time). Without `now` (before mount) it's always the clock time.
export function chatTime(iso, now = 0) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  if (now && date.toDateString() !== new Date(now).toDateString()) {
    return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })}`;
  }
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// Relative time for notifications/messages, e.g. "2 minutes ago".
export function timeAgo(input, now = Date.now()) {
  const diff = Math.max(0, now - new Date(input).getTime()) / 1000;
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];
  for (const [unit, secs] of units) {
    const n = Math.floor(diff / secs);
    if (n >= 1) return `${n} ${unit}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// Small deterministic hash so fake data and media picks are stable across renders.
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Seeded PRNG (mulberry32); returns a function producing floats in [0, 1).
export function seededRandom(seed) {
  let a = typeof seed === "number" ? seed : hashString(String(seed));
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPick(seed, list) {
  return list[hashString(String(seed)) % list.length];
}
