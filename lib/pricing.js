import { formatNumber } from "./format";

// Shared prices so every purchase path (shop, cart, "Buy" pop-up, keyboard
// shortcut, credits pop-up) charges the same for the same thing.

export const CREDIT_PACKS = [
  { credits: 100, price: 0.99 },
  { credits: 500, price: 4.99 },
  { credits: 1000, price: 9.99 },
  { credits: 2000, price: 19.99 },
  { credits: 5000, price: 49.99 },
  { credits: 10000, price: 99.99 },
  { credits: 25000, price: 249.99 }
];

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
    tiers: [
      { id: "stream", label: "Stream access", credits: 50, price: null },
      { id: "download", label: "Stream and download", credits: 100, price: 0.99 }
    ]
  };
}

// A whole album (digital).
export function albumPurchaseItem(album) {
  return {
    id: `album:${album.id}`,
    name: album.name,
    subtitle: `${album.artist} · Digital album`,
    image: album.img_url,
    kind: "music",
    tiers: [
      { id: "stream", label: "Stream access", credits: 500, price: null },
      { id: "download", label: "Stream and download", credits: 900, price: 9.99 }
    ]
  };
}

// The purchasable line for one tier of an item: the same id, name and prices
// whether it's bought through the "Buy" pop-up or added to the cart.
export function tierLine(item, tierId) {
  const { tiers, ...rest } = item;
  if (!tiers?.length) return rest;
  const tier = tiers.find((t) => t.id === tierId) || tiers[tiers.length - 1];
  return {
    ...rest,
    id: `${item.id}:${tier.id}`,
    name: `${item.name} (${tier.label})`,
    credits: tier.credits,
    price: tier.price,
    options: { tier: tier.label }
  };
}
