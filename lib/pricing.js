import { formatNumber } from "./format";
import { buildAlbumTracks } from "../utils/albumTracks";

// Shared prices so every purchase path (shop, cart, "Buy" pop-up, keyboard
// shortcut, credits pop-up) charges the same for the same thing. The server
// (lib/server/pricing.js) re-prices every checkout line with these same functions,
// so keep this module free of browser-only code.

export const MAX_QTY = 99; // per cart line

export const CREDIT_PACKS = [
  { credits: 100, price: 0.99 },
  { credits: 500, price: 4.99 },
  { credits: 1000, price: 9.99 },
  { credits: 2000, price: 19.99 },
  { credits: 5000, price: 49.99 },
  { credits: 10000, price: 99.99 },
  { credits: 25000, price: 249.99 }
];

// Music is sold as stream access (credits) or stream + download (credits or card).
export const TRACK_TIERS = [
  { id: "stream", label: "Stream access", credits: 50, price: null },
  { id: "download", label: "Stream and download", credits: 100, price: 0.99 }
];
export const ALBUM_TIERS = [
  { id: "stream", label: "Stream access", credits: 500, price: null },
  { id: "download", label: "Stream and download", credits: 900, price: 9.99 }
];

const UNIT_DAYS = { day: 1, week: 7, month: 30, year: 365 };

// "1 year" -> 365, "6 months" -> 180, "1 week" -> 7 ...
export function periodDays(label) {
  const match = /(\d+)\s*(day|week|month|year)/i.exec(label || "");
  return match ? Number(match[1]) * UNIT_DAYS[match[2].toLowerCase()] : 0;
}

export function creditPack(credits) {
  return CREDIT_PACKS.find((pack) => pack.credits === credits);
}

export function creditPackItem(pack) {
  return {
    id: `credits-${pack.credits}`,
    name: `${formatNumber(pack.credits)} Credits`,
    kind: "digital",
    price: pack.price,
    credits: null,
    grantsCredits: pack.credits
  };
}

// A single track: stream with credits, or stream + download with credits or card.
export function trackPurchaseItem(track) {
  return {
    id: `track:${track.id}`,
    name: track.title,
    subtitle: track.artist,
    image: track.cover,
    kind: "music",
    downloads: [{ id: track.id, title: track.title }],
    tiers: TRACK_TIERS
  };
}

// A whole album (digital). Uses the album's own tracklist when it has one.
export function albumPurchaseItem(album) {
  const tracks = Array.isArray(album.tracks) ? album.tracks : buildAlbumTracks(album);
  return {
    id: `album:${album.id}`,
    name: album.name,
    subtitle: `${album.artist} · Digital album`,
    image: album.img_url,
    kind: "music",
    downloads: tracks.map((t) => ({ id: t.id, title: t.title })),
    tiers: ALBUM_TIERS
  };
}

// The purchasable line for one tier of an item: the same id, name and prices
// whether it's bought through the "Buy" pop-up or added to the cart. Only the
// download tier carries the downloadable tracks (shown in purchase history).
export function tierLine(item, tierId) {
  const { tiers, downloads, ...rest } = item;
  if (!tiers?.length) return rest;
  const tier = tiers.find((t) => t.id === tierId) || tiers[tiers.length - 1];
  return {
    ...rest,
    id: `${item.id}:${tier.id}`,
    name: `${item.name} (${tier.label})`,
    credits: tier.credits,
    price: tier.price,
    options: { tier: tier.label },
    ...(tier.id === "download" && downloads?.length ? { downloads } : {})
  };
}

// Days of download access a download pass (or a bundle that includes one) grants: the
// tier's period; plans without one (Basic/Premium/Custom) run a year, and a pass sold
// without tiers runs 30 days.
export function passDays(tier) {
  if (!tier) return 30;
  return periodDays(tier.label) || 365;
}

// The cart line for a shop product with the chosen tier / size / color.
export function productLine(
  product,
  { tier = product.tiers?.[0], size = product.sizes?.[0], color = product.colors?.[0] } = {}
) {
  const options = {};
  if (size) options.size = size;
  if (color) options.color = color;
  if (tier) options.tier = tier.label;
  return {
    id: product.cartId || product.id,
    name: product.name,
    image: product.images?.[0],
    kind: product.kind,
    price: tier ? tier.price : product.price,
    credits: tier ? tier.credits : product.credits,
    grantsCredits: tier?.grantsCredits || product.grantsCredits || 0,
    options,
    subtitle: [product.subtitle, ...Object.values(options)].filter(Boolean).join(" · "),
    ...(product.startsAt ? { startsAt: product.startsAt } : {}),
    ...(product.grantsDownloads ? { entitlement: { type: "downloads", days: passDays(tier) } } : {})
  };
}

// A cart line's identity: the item id plus its chosen options.
export function cartKey(id, options) {
  const opts = Object.entries(options || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return opts ? `${id}?${opts}` : String(id);
}

// Money is added up in whole cents (floating-point dollars drift: 5 × 19.99 would
// come to 99.94999…), with `usd` derived from `cents`.
export function cartTotals(items) {
  const totals = items.reduce(
    (acc, item) => {
      acc.count += item.qty;
      if (item.price != null) acc.cents += Math.round(item.price * 100) * item.qty;
      if (item.credits != null) acc.credits += item.credits * item.qty;
      else acc.creditsPayable = false;
      if (item.price == null) acc.cardPayable = false;
      return acc;
    },
    { count: 0, cents: 0, credits: 0, creditsPayable: true, cardPayable: true }
  );
  return { ...totals, usd: totals.cents / 100 };
}

// Points for an order: 10 per dollar on card (from cents, so no rounding drift),
// 1 per 2 credits spent.
export function pointsFor(method, totals) {
  return Math.round(method === "card" ? totals.cents / 10 : totals.credits / 2);
}
