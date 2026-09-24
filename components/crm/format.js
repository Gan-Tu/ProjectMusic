// Formatting helpers for the CRM (client-safe).

const pad = (n) => String(n).padStart(2, "0");

// Same rule as the server's url() helper: empty, an http(s) URL, or a site path
// ("/shop/x.webp", not "//host").
export function isValidUrlInput(value, { dataImage = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return true;
  if (dataImage && /^data:image\/(jpeg|png|webp);base64,/.test(text)) return true;
  if (text.startsWith("/")) return !text.startsWith("//");
  try {
    const { protocol } = new URL(text);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const URL_HINT = "Use a full http(s):// URL or a site path like /shop/image.webp.";

// 185 -> "3:05"
export function toMmSs(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// "3:05" / "1:02:05" / "185" -> seconds, or null when unreadable.
export function fromMmSs(text) {
  const value = String(text ?? "").trim();
  if (!value) return 0;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(value)) return null;
  return value.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

function zoneParts(ms, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(new Date(ms));
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second")
  };
}

// Offset (ms) of `timeZone` from UTC at the instant `ms`.
function zoneOffset(ms, timeZone) {
  const p = zoneParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

function safeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

// ISO instant -> "YYYY-MM-DDTHH:mm" wall-clock time in `timeZone` (datetime-local value).
export function isoToZonedInput(iso, timeZone) {
  const ms = new Date(iso).getTime();
  if (!iso || Number.isNaN(ms)) return "";
  const p = zoneParts(ms, safeZone(timeZone));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

// Wall-clock "YYYY-MM-DDTHH:mm" in `timeZone` -> ISO instant (handles DST changes).
export function zonedInputToIso(value, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
  if (!match) return "";
  const zone = safeZone(timeZone);
  const [, y, mo, d, h, mi] = match.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = zoneOffset(guess - zoneOffset(guess, zone), zone);
  let utc = guess - first;
  const second = zoneOffset(utc, zone);
  if (second !== first) utc = guess - second;
  return new Date(utc).toISOString();
}

const COMMON_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney"
];

export function timeZoneList() {
  try {
    const all = Intl.supportedValuesOf("timeZone");
    return all.includes("UTC") ? all : ["UTC", ...all];
  } catch {
    return COMMON_ZONES;
  }
}

export function formatDateTime(value, timeZone) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";
  // (dateStyle/timeStyle can't be combined with timeZoneName, so spell the parts out.)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone: safeZone(timeZone), timeZoneName: "short" } : {})
  });
}

export function formatDay(value) {
  if (!value) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `$${Number(value).toFixed(2)}`;
}

export function formatCount(value) {
  return Number(value || 0).toLocaleString("en-US");
}

export function timeAgo(value) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return "just now";
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60]
  ];
  for (const [unit, seconds] of units) {
    if (diff >= seconds) return `${Math.floor(diff / seconds)}${unit} ago`;
  }
  return "";
}
