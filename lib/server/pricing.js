import { sql } from "./db";
import { HttpError } from "./http";
import {
  ALBUM_TIERS,
  MAX_QTY,
  TRACK_TIERS,
  albumPurchaseItem,
  cartKey,
  creditPack,
  creditPackItem,
  productLine,
  tierLine,
  trackPurchaseItem
} from "../pricing";

// Authoritative prices for checkout (server-only). Every line the browser sends is
// rebuilt from the database with the same builders the pages use (lib/pricing.js),
// so the order records what was actually charged, never what the client claimed.
//
// Line ids the client produces:
//   <productId>                   shop products (options: size, color, tier label)
//   credits-<n>                   credit packs from the credits pop-up (no options);
//                                 with a tier option it's the shop's credit-pack product
//   ticket:<eventId>              event tickets (options.tier = tier name)
//   track:<trackId>:<tier>        single tracks (stream | download)
//   album:<albumId>:<tier>        digital albums (stream | download)

const MAX_LINES = 100;

const cents = (value) => (value == null ? null : Math.round(Number(value) * 100));
// The same coercions as lib/server/content.js, so prices match what pages show.
const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const orNull = (value) => (value == null ? null : num(value));
const slug = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Refusals name the cart line (its key) so the cart can point at it.
function unavailable(line, name = line.name) {
  return new HttpError(
    409,
    `${name || "An item in your order"} is no longer available. Remove it to check out.`,
    { code: "unavailable", key: line.key }
  );
}

function changed(line, name) {
  return new HttpError(
    409,
    `${name} has changed. Remove it from your cart and add it again from its page.`,
    { code: "item_changed", key: line.key }
  );
}

function sameOptions(a, b) {
  return cartKey("", a) === cartKey("", b);
}

// The client's line, checked for shape (prices are compared later).
function parseLine(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new HttpError(400, "Your order has an invalid item.");
  }
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id || id.length > 300) throw new HttpError(400, "Your order has an invalid item.");
  const qty = raw.qty === undefined ? 1 : raw.qty;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    throw new HttpError(400, `Quantities go from 1 to ${MAX_QTY}.`);
  }
  const options = {};
  if (raw.options != null) {
    if (typeof raw.options !== "object" || Array.isArray(raw.options)) {
      throw new HttpError(400, "Your order has an invalid item.");
    }
    for (const [key, value] of Object.entries(raw.options)) {
      if (value === undefined || value === null || value === "") continue;
      if (typeof value !== "string" || value.length > 200 || Object.keys(options).length > 5) {
        throw new HttpError(400, "Your order has an invalid item.");
      }
      options[key] = value;
    }
  }
  const price = raw.price;
  const credits = raw.credits;
  if (price != null && (typeof price !== "number" || !Number.isFinite(price) || price < 0)) {
    throw new HttpError(400, "Your order has an invalid price.");
  }
  if (credits != null && (!Number.isInteger(credits) || credits < 0)) {
    throw new HttpError(400, "Your order has an invalid price.");
  }
  return {
    id,
    qty,
    options,
    price: price ?? null,
    credits: credits ?? null,
    grantsCredits: Number(raw.grantsCredits) || 0,
    name: typeof raw.name === "string" ? raw.name.slice(0, 200) : "",
    key: typeof raw.key === "string" && raw.key.length <= 500 ? raw.key : cartKey(id, options)
  };
}

// What kind of thing a line id refers to.
function classify(line) {
  let match = /^ticket:(.+)$/.exec(line.id);
  if (match) return { type: "ticket", eventId: match[1] };
  match = /^track:(.+):([a-z0-9-]+)$/.exec(line.id);
  if (match) return { type: "track", trackId: match[1], tierId: match[2] };
  match = /^album:(.+):([a-z0-9-]+)$/.exec(line.id);
  if (match) return { type: "album", albumId: match[1], tierId: match[2] };
  match = /^credits-(\d+)$/.exec(line.id);
  if (match && !line.options.tier) return { type: "pack", credits: Number(match[1]) };
  return { type: "product", productId: line.id };
}

// A products row in the shape the shop pages use (toProduct in lib/server/content.js).
function productShape(row) {
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    subtitle: row.subtitle || "",
    price: orNull(row.price),
    credits: orNull(row.credits),
    images: images.length ? images : ["/shop/digital.svg"],
    sizes: row.sizes || [],
    colors: row.colors || [],
    tiers: (Array.isArray(row.tiers) ? row.tiers : []).map((tier) => ({
      ...tier,
      id: String(tier.id ?? slug(tier.label)),
      label: String(tier.label ?? tier.id),
      price: orNull(tier.price),
      credits: orNull(tier.credits),
      grantsCredits: num(tier.grantsCredits)
    })),
    grantsCredits: row.grants_credits || 0,
    grantsDownloads: Boolean(row.grants_downloads)
  };
}

// An event's ticket tiers as the events pages show them (toTiers in content.js).
function eventTiers(value) {
  return (Array.isArray(value) ? value : []).map((tier) => ({
    name: String(tier?.name || "General admission"),
    price: num(tier?.price),
    credits: tier?.credits == null ? Math.round(num(tier?.price) * 90) : num(tier.credits)
  }));
}

function eventDate(row) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: row.time_zone || "America/Los_Angeles",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date(row.starts_at));
  } catch {
    return new Date(row.starts_at).toDateString();
  }
}

function priceTicket(line, event, now) {
  if (!event || event.status !== "published") throw unavailable(line);
  if (new Date(event.starts_at).getTime() <= now) {
    throw new HttpError(
      409,
      `Ticket sales for ${event.title} have ended. Remove it to check out.`,
      { code: "sales_ended", key: line.key }
    );
  }
  if (Object.keys(line.options).some((key) => key !== "tier")) throw changed(line, event.title);
  const tiers = eventTiers(event.tiers);
  if (!tiers.length) throw unavailable(line, `Tickets for ${event.title}`);
  const wanted = String(line.options.tier || "")
    .trim()
    .toLowerCase();
  let tier = tiers.find((t) => t.name.trim().toLowerCase() === wanted);
  // Event cards add the first tier as "General admission".
  if (!tier && (!wanted || wanted === "general admission")) tier = tiers[0];
  if (!tier) throw changed(line, `The ${line.options.tier} ticket for ${event.title}`);
  return {
    id: `ticket:${event.id}`,
    name: event.title,
    subtitle: [eventDate(event), event.venue].filter(Boolean).join(" · "),
    image: event.image_url || "",
    kind: "ticket",
    price: tier.price,
    credits: tier.credits,
    grantsCredits: 0,
    options: { tier: tier.name },
    startsAt: new Date(event.starts_at).toISOString()
  };
}

async function loadCatalog(parsed) {
  const ids = { products: new Set(), events: new Set(), tracks: new Set(), albums: new Set() };
  for (const { kind } of parsed) {
    if (kind.type === "product") ids.products.add(kind.productId);
    if (kind.type === "ticket") ids.events.add(kind.eventId);
    if (kind.type === "track") ids.tracks.add(kind.trackId);
    if (kind.type === "album") ids.albums.add(kind.albumId);
  }
  const list = (set) => [...set];
  const [products, tracks, albums, albumTracks] = await Promise.all([
    ids.products.size
      ? sql`
          select id, name, kind, subtitle, price, credits, images, sizes, colors, tiers,
                 grants_credits, grants_downloads, event_id, status
          from products where id = any(${list(ids.products)})
        `
      : [],
    ids.tracks.size
      ? sql`
          select t.id, t.title, t.status, coalesce(t.artist_name, a.artist_name) as artist,
                 a.cover_url, a.status as album_status
          from tracks t join albums a on a.id = t.album_id
          where t.id = any(${list(ids.tracks)})
        `
      : [],
    ids.albums.size
      ? sql`
          select id, name, artist_name, cover_url, status
          from albums where id = any(${list(ids.albums)})
        `
      : [],
    ids.albums.size
      ? sql`
          select id, title, album_id from tracks
          where album_id = any(${list(ids.albums)}) and status = 'published'
          order by album_id, number, id
        `
      : []
  ]);
  // Ticket products are sold through their event.
  for (const row of products) {
    if (row.kind === "ticket" && row.event_id) ids.events.add(row.event_id);
  }
  const events = ids.events.size
    ? await sql`
        select id, title, starts_at, time_zone, venue, image_url, tiers, status
        from events where id = any(${list(ids.events)})
      `
    : [];
  const byId = (rows) => new Map(rows.map((row) => [row.id, row]));
  const tracksByAlbum = new Map();
  for (const row of albumTracks) {
    if (!tracksByAlbum.has(row.album_id)) tracksByAlbum.set(row.album_id, []);
    tracksByAlbum.get(row.album_id).push({ id: row.id, title: row.title });
  }
  return {
    products: byId(products),
    events: byId(events),
    tracks: byId(tracks),
    albums: byId(albums),
    tracksByAlbum
  };
}

// The line as the site sells it today (throws when it can't be sold).
function expectedLine(line, kind, catalog, now) {
  if (kind.type === "pack") {
    const pack = creditPack(kind.credits);
    if (!pack || Object.keys(line.options).length) throw unavailable(line);
    return creditPackItem(pack);
  }
  if (kind.type === "ticket") {
    return priceTicket(line, catalog.events.get(kind.eventId), now);
  }
  if (kind.type === "track") {
    const track = catalog.tracks.get(kind.trackId);
    const tier = TRACK_TIERS.find((t) => t.id === kind.tierId);
    if (!track || !tier || track.status !== "published" || track.album_status !== "published") {
      throw unavailable(line);
    }
    return tierLine(
      trackPurchaseItem({
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover_url
      }),
      tier.id
    );
  }
  if (kind.type === "album") {
    const album = catalog.albums.get(kind.albumId);
    const tier = ALBUM_TIERS.find((t) => t.id === kind.tierId);
    if (!album || !tier || album.status !== "published") throw unavailable(line);
    return tierLine(
      albumPurchaseItem({
        id: album.id,
        name: album.name,
        artist: album.artist_name,
        img_url: album.cover_url,
        tracks: catalog.tracksByAlbum.get(album.id) || []
      }),
      tier.id
    );
  }
  const row = catalog.products.get(kind.productId);
  if (!row || row.status !== "published") throw unavailable(line);
  if (row.kind === "ticket" && row.event_id) {
    return priceTicket(line, catalog.events.get(row.event_id), now);
  }
  const product = productShape(row);
  const { tier: tierLabel, size, color, ...other } = line.options;
  if (Object.keys(other).length) throw changed(line, product.name);
  const tier = tierLabel ? product.tiers.find((t) => t.label === tierLabel) : undefined;
  if (tierLabel && !tier) throw changed(line, `The ${tierLabel} option of ${product.name}`);
  if (size && !product.sizes.includes(size)) throw changed(line, `Size ${size} of ${product.name}`);
  if (color && !product.colors.includes(color)) throw changed(line, `${color} ${product.name}`);
  const expected = productLine(product, { tier, size, color });
  // e.g. the product gained sizes since it was added: the line needs a new choice.
  if (!sameOptions(expected.options, line.options)) throw changed(line, product.name);
  if (expected.price == null && expected.credits == null) throw unavailable(line, product.name);
  return expected;
}

// Re-prices checkout lines. Resolves to the canonical items to charge and record,
// or throws: 400 bad input, 409 { code } for unavailable / changed items and
// "price_changed" (with the current prices per cart line key) when any line's
// prices differ from what the client showed.
export async function priceLines(rawLines, now = Date.now()) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new HttpError(400, "Your cart is empty.");
  }
  if (rawLines.length > MAX_LINES) {
    throw new HttpError(400, `Check out at most ${MAX_LINES} different items at once.`);
  }
  const parsed = rawLines.map((raw) => {
    const line = parseLine(raw);
    return { line, kind: classify(line) };
  });
  const catalog = await loadCatalog(parsed);
  const repriced = [];
  const items = parsed.map(({ line, kind }) => {
    const expected = expectedLine(line, kind, catalog, now);
    const item = {
      ...expected,
      grantsCredits: expected.grantsCredits || 0,
      qty: line.qty,
      key: cartKey(expected.id, expected.options)
    };
    if (
      cents(line.price) !== cents(item.price) ||
      line.credits !== (item.credits ?? null) ||
      line.grantsCredits !== item.grantsCredits
    ) {
      repriced.push({
        key: line.key,
        id: line.id,
        name: item.name,
        price: item.price ?? null,
        credits: item.credits ?? null,
        grantsCredits: item.grantsCredits
      });
    }
    return item;
  });
  if (repriced.length) {
    throw new HttpError(409, "Prices changed — please review your cart.", {
      code: "price_changed",
      lines: repriced
    });
  }
  return items;
}
