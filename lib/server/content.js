import { sql } from "./db";
import { videoThumbnail } from "../media";

// Public content queries (server-only; used by getStaticProps and pages/api/public).
//
// Rules (docs/crm/ARCHITECTURE.md §2): only `published` rows; a row is *listed* on a
// surface when the surface key is in its `placements`; detail pages render any
// published row. Lists are ordered by `sort_order`, then a natural secondary key.
// Results are plain JSON (dates as strings) in the shapes the components already use.
// Pages that need several lists read them in one round trip (a read-only transaction).

const readAll = (queries) => sql.transaction(queries, { readOnly: true });

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

// "2026-09-22" -> "September 22, 2026"
function longDate(ymd) {
  const [year, month, day] = String(ymd || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return "";
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

const pad2 = (n) => String(n).padStart(2, "0");
const slug = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const list = (value) => (Array.isArray(value) ? value : []);

// Wall-clock parts of an instant in the venue's time zone, in the shapes of the
// original event data: date "2026-09-01", time "07:00PM", startsAt with the offset.
function localTime(instant, timeZone) {
  const date = instant instanceof Date ? instant : new Date(instant);
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset"
    }).formatToParts(date);
  } catch {
    return localTime(date, "UTC");
  }
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  const [year, month, day, hour, minute] = ["year", "month", "day", "hour", "minute"].map((type) =>
    Number(get(type))
  );
  const offset = get("timeZoneName").replace("GMT", "") || "+00:00";
  const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
  return {
    year,
    month,
    day,
    date: ymd,
    time: `${pad2(hour % 12 || 12)}:${pad2(minute)}${hour < 12 ? "AM" : "PM"}`,
    startsAt: `${ymd}T${pad2(hour)}:${pad2(minute)}:00${offset}`
  };
}

// ---------------------------------------------------------------- artists

const ARTIST_COLUMNS = "a.id, a.name, a.location, a.image_url, a.cover_image_url";

function toArtist(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    imgUrl: row.image_url,
    coverImage: row.cover_image_url || row.image_url
  };
}

function toArtistProfile(row) {
  return {
    ...toArtist(row),
    tagline: row.tagline,
    bio: row.bio,
    followers: row.followers,
    listeners: row.listeners,
    sessions: row.sessions,
    links: row.links && typeof row.links === "object" ? row.links : {}
  };
}

function artistsQuery({ placement = null, limit = null } = {}) {
  return sql.query(
    `select ${ARTIST_COLUMNS} from artists a
     where a.status = 'published' and ($1::text is null or $1 = any(a.placements))
     order by a.sort_order, a.name
     limit $2`,
    [placement, limit]
  );
}

export async function listArtists({ placement = null, limit = null } = {}) {
  return (await artistsQuery({ placement, limit })).map(toArtist);
}

// ---------------------------------------------------------------- albums and tracks

const TRACK_JSON = `json_build_object('id', t.id, 'number', t.number, 'title', t.title,
  'artist', t.artist_name, 'duration', t.duration, 'src', t.audio_url)`;

// Album rows with their published tracks: tracks "all" (array), "first" (the first
// track only) or false (just the count). `where` uses $1..$n of `params`.
function albumsQuery({ where, params = [], tracks = "first", order, limit = null }) {
  const [aggregate, column] =
    tracks === "all"
      ? [`coalesce(json_agg(${TRACK_JSON} order by t.number, t.id), '[]'::json)`, "tracks"]
      : tracks === "first"
        ? [`(array_agg(${TRACK_JSON} order by t.number, t.id))[1]`, "first_track"]
        : ["null::json", "no_tracks"];
  return sql.query(
    `select al.id, al.name, al.artist_name, al.artist_id, al.cover_url, al.album_type,
       al.external_url, al.description, to_char(al.release_date, 'YYYY-MM-DD') as release_date,
       tr.total_tracks, tr.${column}
     from albums al
     left join lateral (
       select count(*)::int as total_tracks, ${aggregate} as ${column}
       from tracks t where t.album_id = al.id and t.status = 'published'
     ) tr on true
     where al.status = 'published' and (${where})
     order by ${order || "al.sort_order, al.release_date desc nulls last, al.name"}
     limit $${params.length + 1}`,
    [...params, limit]
  );
}

function toTrack(track, album) {
  return {
    id: track.id,
    number: track.number,
    title: track.title,
    artist: track.artist || album.artist,
    cover: album.img_url,
    albumId: album.id,
    albumName: album.name,
    duration: track.duration,
    // Without a file the player falls back to a sample (lib/media.js getAudioSrc).
    ...(track.src ? { src: track.src } : {})
  };
}

function toAlbum(row) {
  const album = {
    id: row.id,
    name: row.name,
    img_url: row.cover_url,
    release_date: row.release_date || "",
    artist: row.artist_name,
    artistId: row.artist_id,
    totalTracks: row.total_tracks || 0,
    albumType: row.album_type
  };
  if (row.tracks) album.tracks = row.tracks.map((track) => toTrack(track, album));
  else if (row.first_track) album.tracks = [toTrack(row.first_track, album)];
  else if ("first_track" in row) album.tracks = [];
  return album;
}

function placementWhere(column = "al.placements") {
  return `$1::text is null or $1 = any(${column})`;
}

// Albums listed on a surface. `tracks`: "all" | "first" (default) | false.
export async function listAlbums({ placement = null, limit = null, tracks = "first" } = {}) {
  const rows = await albumsQuery({ where: placementWhere(), params: [placement], tracks, limit });
  return rows.map(toAlbum);
}

// An album (any placement) with its tracks, or null.
export async function getAlbum(id) {
  const [row] = await albumsQuery({ where: "al.id = $1", params: [id], tracks: "all" });
  if (!row) return null;
  return { ...toAlbum(row), url: row.external_url || null, description: row.description };
}

// The player's queue before the listener picks anything: the title tracks of the first
// 12 releases on the home page ("New releases").
export async function getDefaultQueue() {
  const albums = await listAlbums({ placement: "home", limit: 12, tracks: "first" });
  return albums.flatMap((album) => album.tracks.slice(0, 1));
}

// { album, tracks, more } for /albums/[id], or null for a missing / draft album.
// "More releases": catalog albums, the same artist first.
export async function getAlbumPage(id) {
  const album = await getAlbum(id);
  if (!album) return null;
  const more = await albumsQuery({
    where: "al.id <> $1 and 'music' = any(al.placements)",
    params: [id, album.artist, album.artistId],
    tracks: "all",
    order: `(al.artist_name = $2 or al.artist_id = $3) desc nulls last, al.sort_order,
      al.release_date desc nulls last, al.name`,
    limit: 6
  });
  const { tracks, ...summary } = album;
  return { album: summary, tracks, more: more.map(toAlbum) };
}

// ---------------------------------------------------------------- videos

function videosQuery({ where, params = [], limit = null }) {
  return sql.query(
    `select v.id, v.title, v.subtitle, v.description, v.video_url, v.poster_url, v.captions_url,
       v.duration, v.views, v.likes, v.credits, to_char(v.published_on, 'YYYY-MM-DD') as date,
       ar.id as artist_id, coalesce(nullif(v.artist_name, ''), ar.name, '') as artist,
       ar.image_url as artist_image, ar.cover_image_url as artist_cover
     from videos v
     left join artists ar on ar.id = v.artist_id and ar.status = 'published'
     where v.status = 'published' and (${where})
     order by v.sort_order, v.published_on desc, v.title
     limit $${params.length + 1}`,
    [...params, limit]
  );
}

function toVideo(row) {
  const poster = row.poster_url || videoThumbnail(row.video_url);
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artistId: row.artist_id,
    artistImage: row.artist_cover || row.artist_image || poster,
    subtitle: row.subtitle,
    duration: row.duration,
    poster,
    src: row.video_url,
    captions: row.captions_url || null,
    views: row.views,
    likes: row.likes,
    date: row.date,
    description: row.description,
    credits: list(row.credits)
  };
}

export async function listVideos({ placement = null, limit = null } = {}) {
  const where = placementWhere("v.placements");
  const rows = await videosQuery({ where, params: [placement], limit });
  return rows.map(toVideo);
}

// The next videos after `id` in the list, wrapping around (like the original demo).
function relatedVideos(videos, id, n = 8) {
  const index = videos.findIndex((video) => video.id === id);
  const ordered = [...videos.slice(index + 1), ...videos.slice(0, Math.max(0, index))];
  return ordered.filter((video) => video.id !== id).slice(0, n);
}

// { video, videos, related } for /videos/[id] (any placement), or null. Without an id:
// the first video of the Videos tab (the /videos page).
export async function getVideoPage(id = null) {
  const [rows, listed] = await readAll([
    videosQuery({ where: "v.id = $1", params: [id] }),
    videosQuery({ where: "'videos' = any(v.placements)" })
  ]);
  const videos = listed.map(toVideo);
  const video = id ? rows[0] && toVideo(rows[0]) : videos[0];
  if (!video) return null;
  return { video, videos, related: relatedVideos(videos, video.id) };
}

// ---------------------------------------------------------------- events

function eventsQuery({ where, params = [], limit = null }) {
  return sql.query(
    `select e.id, e.title, e.subtitle, e.starts_at, e.time_zone, e.city, e.venue, e.street,
       e.locality, e.image_url, e.description, e.tiers,
       coalesce((
         select json_agg(json_build_object('id', a.id, 'name', a.name, 'location', a.location,
           'image_url', a.image_url, 'cover_image_url', a.cover_image_url)
           order by l.position, a.name)
         from event_lineup l join artists a on a.id = l.artist_id and a.status = 'published'
         where l.event_id = e.id
       ), '[]'::json) as lineup
     from events e
     where e.status = 'published' and (${where})
     order by e.sort_order, e.starts_at
     limit $${params.length + 1}`,
    [...params, limit]
  );
}

function toTiers(value) {
  return list(value).map((tier) => ({
    name: String(tier?.name || "General admission"),
    price: num(tier?.price),
    credits: tier?.credits == null ? Math.round(num(tier?.price) * 90) : num(tier.credits),
    description: String(tier?.description || "")
  }));
}

function toEvent(row) {
  const when = localTime(row.starts_at, row.time_zone);
  const tiers = toTiers(row.tiers);
  const address = [row.venue, row.street, row.locality].filter(Boolean);
  return {
    id: row.id,
    title: row.title,
    name: row.subtitle,
    year: when.year,
    month: when.month,
    day: when.day,
    time: when.time,
    date: when.date,
    startsAt: when.startsAt,
    timeZone: row.time_zone,
    city: row.city,
    address: address.length ? address : [row.city || "Venue to be announced"],
    image: row.image_url,
    // "From" price: the first (standard) tier, as on the Events page's "Get tickets".
    price: tiers[0]?.price ?? 0,
    credits: tiers[0]?.credits ?? 0,
    lineup: list(row.lineup).map(toArtist),
    description: row.description,
    tiers
  };
}

export async function listEvents({ placement = null, limit = null } = {}) {
  const where = placementWhere("e.placements");
  const rows = await eventsQuery({ where, params: [placement], limit });
  return rows.map(toEvent);
}

export async function getEvent(id) {
  const [row] = await eventsQuery({ where: "e.id = $1", params: [id] });
  return row ? toEvent(row) : null;
}

// ---------------------------------------------------------------- shop

function productsQuery({ where, params = [], order, limit = null }) {
  return sql.query(
    `select p.id, p.name, p.category, p.kind, p.subtitle, p.description, p.price::float8 as price,
       p.credits, p.images, p.sizes, p.colors, p.tiers, p.grants_credits, p.grants_downloads,
       p.album_id, p.event_id, p.placements, to_char(p.added_on, 'YYYY-MM-DD') as added_at,
       coalesce(al.artist_name, ar.name) as artist_label,
       e.starts_at as event_starts_at, e.time_zone as event_time_zone, e.tiers as event_tiers
     from products p
     left join albums al on al.id = p.album_id
     left join artists ar on ar.id = p.artist_id
     left join events e on e.id = p.event_id
     where p.status = 'published' and (p.event_id is null or e.status = 'published')
       and (${where})
     order by ${order || "p.sort_order, p.added_on desc, p.name"}
     limit $${params.length + 1}`,
    [...params, limit]
  );
}

function toProduct(row) {
  const product = {
    id: row.id,
    name: row.name,
    category: row.category,
    kind: row.kind,
    price: row.price,
    credits: row.credits,
    images: list(row.images).length ? row.images : ["/shop/digital.svg"],
    description: row.description,
    featured: list(row.placements).includes("featured"),
    addedAt: row.added_at
  };
  // Optional fields only when set (components test for their presence).
  if (list(row.sizes).length) product.sizes = row.sizes;
  if (list(row.colors).length) product.colors = row.colors;
  if (list(row.tiers).length) {
    product.tiers = row.tiers.map((tier) => ({
      ...tier,
      id: String(tier.id ?? slug(tier.label)),
      label: String(tier.label ?? tier.id),
      price: tier.price == null ? null : num(tier.price),
      credits: tier.credits == null ? null : num(tier.credits)
    }));
  }
  if (row.grants_credits) product.grantsCredits = row.grants_credits;
  if (row.grants_downloads) product.grantsDownloads = true;
  if (row.artist_label) product.artist = row.artist_label;
  if (row.album_id) product.albumId = row.album_id;
  if (row.subtitle) product.subtitle = row.subtitle;
  // Tickets take their prices, tiers and sales end from the event.
  if (row.event_id) {
    product.eventId = row.event_id;
    if (row.kind === "ticket" && row.event_starts_at) {
      const when = localTime(row.event_starts_at, row.event_time_zone);
      const tiers = toTiers(row.event_tiers);
      product.cartId = `ticket:${row.event_id}`;
      product.startsAt = when.startsAt;
      if (tiers.length) {
        product.price = tiers[0].price;
        product.credits = tiers[0].credits;
        product.tiers = tiers.map((tier) => ({
          id: slug(tier.name),
          label: tier.name,
          price: tier.price,
          credits: tier.credits
        }));
      }
      product.subtitle ||= `${when.month}/${when.day}/${when.year} · ${when.time}`;
    }
  }
  return product;
}

const SHOP_CATEGORY_LISTED = `exists (select 1 from product_categories c
  where c.slug = p.category and c.status = 'published')`;

// Products listed on a surface ("shop", "featured" or "artist").
export async function listProducts({ placement = "shop", limit = null } = {}) {
  const rows = await productsQuery({
    where: `$1 = any(p.placements) and ${SHOP_CATEGORY_LISTED}`,
    params: [placement],
    limit
  });
  return rows.map(toProduct);
}

// The shop home: the catalog (placement "shop"), the featured row (placement
// "featured", listed there even when not in the catalog) and the categories.
export async function getShopPage() {
  const [products, featured, categories] = await readAll([
    productsQuery({ where: `'shop' = any(p.placements) and ${SHOP_CATEGORY_LISTED}` }),
    productsQuery({ where: `'featured' = any(p.placements) and ${SHOP_CATEGORY_LISTED}` }),
    categoriesQuery()
  ]);
  return {
    products: products.map(toProduct),
    featured: featured.map(toProduct),
    categories: categories.map(({ slug, label, icon }) => ({ slug, label, icon }))
  };
}

function categoriesQuery() {
  return sql`
    select slug, label, icon from product_categories
    where status = 'published' order by sort_order, label
  `;
}

export async function listProductCategories() {
  return (await categoriesQuery()).map((row) => ({
    slug: row.slug,
    label: row.label,
    icon: row.icon
  }));
}

// { product, category, related } for /shop/[id] (any placement), or null.
export async function getProductPage(id) {
  const [rows, categories] = await readAll([
    productsQuery({ where: "p.id = $1", params: [id] }),
    sql`select slug, label, icon from product_categories where slug = (
      select category from products where id = ${id})`
  ]);
  if (!rows[0]) return null;
  const product = toProduct(rows[0]);
  const related = await productsQuery({
    where: `p.id <> $1 and 'shop' = any(p.placements) and ${SHOP_CATEGORY_LISTED}`,
    params: [id, product.category],
    order: "(p.category = $2) desc, p.sort_order, p.added_on desc, p.name",
    limit: 8
  });
  const category = categories[0] || { slug: product.category, label: product.category };
  return {
    product,
    category: { slug: category.slug, label: category.label, icon: category.icon || "bag" },
    related: related.map(toProduct)
  };
}

// ---------------------------------------------------------------- pictures

function toPhotoCategory(row) {
  return { id: row.id, name: row.name, description: row.description, image: row.image_url };
}

function photosQuery({ where, params = [], limit = null }) {
  return sql.query(
    `select ph.id, ph.src, ph.caption, ph.location, ph.alt from photos ph
     where ph.status = 'published' and (${where})
     order by ph.sort_order, ph.created_at, ph.id
     limit $${params.length + 1}`,
    [...params, limit]
  );
}

function toPhoto(row) {
  return {
    id: row.id,
    src: row.src,
    caption: row.caption,
    location: row.location,
    ...(row.alt ? { alt: row.alt } : {})
  };
}

export async function listPhotoCategories() {
  const rows = await sql`
    select id, name, description, image_url from photo_categories
    where status = 'published' order by sort_order, name
  `;
  return rows.map(toPhotoCategory);
}

// Photos filtered by category and/or artist, listed on `placement` (when given).
export async function listPhotos({
  categoryId = null,
  artistId = null,
  placement = null,
  limit = null
} = {}) {
  const rows = await photosQuery({
    where: `($1::text is null or ph.category_id = $1) and ($2::text is null or ph.artist_id = $2)
      and ($3::text is null or $3 = any(ph.placements))`,
    params: [categoryId, artistId, placement],
    limit
  });
  return rows.map(toPhoto);
}

// { category, photos } for /pictures/[category], or null.
export async function getPhotoCategoryPage(id) {
  const [categories, photos] = await readAll([
    sql`select id, name, description, image_url from photo_categories
        where id = ${id} and status = 'published'`,
    photosQuery({ where: "ph.category_id = $1 and 'pictures' = any(ph.placements)", params: [id] })
  ]);
  if (!categories[0]) return null;
  return { category: toPhotoCategory(categories[0]), photos: photos.map(toPhoto) };
}

// ---------------------------------------------------------------- news, blog, timeline

function postsQuery({ where, params = [], limit = null }) {
  return sql.query(
    `select p.slug, p.section, p.title, p.author, p.image_url, p.snippet, p.category, p.tags,
       p.body, to_char(p.published_on, 'YYYY-MM-DD') as published_on
     from posts p
     where p.status = 'published' and (${where})
     order by p.sort_order, p.published_on desc, p.created_at desc
     limit $${params.length + 1}`,
    [...params, limit]
  );
}

function toPost(row) {
  return {
    id: row.slug,
    title: row.title,
    date: longDate(row.published_on),
    author: row.author,
    imgUrl: row.image_url,
    snippet: row.snippet,
    category: row.category,
    tags: list(row.tags),
    body: list(row.body)
  };
}

// Posts listed on the /news or /blog page.
export async function listPosts(section) {
  const rows = await postsQuery({
    where: "p.section = $1 and 'listing' = any(p.placements)",
    params: [section]
  });
  return rows.map(toPost);
}

// { post, related } for /news/[id] or /blog/[id] (any placement), or null. Related:
// two listed posts of the section sharing the most tags.
export async function getPostPage(section, slugValue) {
  const [rows, listed] = await readAll([
    postsQuery({ where: "p.section = $1 and p.slug = $2", params: [section, slugValue] }),
    postsQuery({
      where: "p.section = $1 and p.slug <> $2 and 'listing' = any(p.placements)",
      params: [section, slugValue]
    })
  ]);
  if (!rows[0]) return null;
  const post = toPost(rows[0]);
  const shared = (other) => other.tags.filter((tag) => post.tags.includes(tag)).length;
  const related = listed
    .map(toPost)
    .sort((a, b) => shared(b) - shared(a))
    .slice(0, 2);
  return { post, related };
}

// ---------------------------------------------------------------- home and artist pages

// Everything the home page shows: videos (hero, featured, strip), new releases (with
// their first tracks as the play queue) and the artist wall.
export async function getHomePage() {
  const [videos, albums, artists] = await readAll([
    videosQuery({ where: "'home' = any(v.placements)" }),
    albumsQuery({ where: "'home' = any(al.placements)", tracks: "first", limit: 12 }),
    artistsQuery({ placement: "home" })
  ]);
  return {
    videos: videos.map(toVideo),
    albums: albums.map(toAlbum),
    artists: artists.map(toArtist)
  };
}

// Everything on /artists/[id] (see the tab table in the architecture doc), or null.
export async function getArtistPage(id) {
  const queries = [
    sql`select * from artists where id = ${id} and status = 'published'`,
    artistsQuery({ placement: "top", limit: 10 }),
    albumsQuery({
      where: "al.artist_id = $1 and 'artist' = any(al.placements)",
      params: [id],
      tracks: "all"
    }),
    albumsQuery({
      where: `exists (select 1 from artist_rotation r
          where r.album_id = al.id and r.artist_id = $1)`,
      params: [id],
      tracks: "all",
      order: `(select r.position from artist_rotation r
          where r.album_id = al.id and r.artist_id = $1), al.name`
    }),
    videosQuery({ where: "v.artist_id = $1 and 'artist' = any(v.placements)", params: [id] }),
    photosQuery({ where: "ph.artist_id = $1 and 'artist' = any(ph.placements)", params: [id] }),
    sql.query(
      `select p.slug, p.section, p.title, p.author, p.image_url, p.snippet, p.category, p.tags,
           p.body, to_char(p.published_on, 'YYYY-MM-DD') as published_on
         from posts p
         where p.status = 'published' and p.artist_id = $1 and 'artist' = any(p.placements)
         order by p.published_on desc, p.sort_order, p.created_at desc`,
      [id]
    ),
    eventsQuery({
      where: `'artist' = any(e.placements) and exists (
          select 1 from event_lineup l where l.event_id = e.id and l.artist_id = $1)`,
      params: [id]
    }),
    productsQuery({
      where: `'artist' = any(p.placements) and (p.artist_id = $1 or al.artist_id = $1)`,
      params: [id]
    })
  ];
  const [artists, top, discography, rotation, videos, photos, posts, events, merch] =
    await readAll(queries);
  if (!artists[0]) return null;
  return {
    artist: toArtistProfile(artists[0]),
    topArtists: top.map(toArtist),
    discography: discography.map(toAlbum),
    rotation: rotation.map(toAlbum),
    videos: videos.map(toVideo),
    photos: photos.map(toPhoto),
    // Timeline posts, plus news / blog posts linked to the artist (newest first).
    posts: posts.map((row) => ({
      ...toPost(row),
      section: row.section,
      isoDate: row.published_on
    })),
    events: events.map(toEvent),
    merch: merch.map(toProduct)
  };
}

// ---------------------------------------------------------------- socials

function toNetwork(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    followers: row.followers,
    url: row.url,
    color: row.color,
    icon: row.icon
  };
}

export async function listSocialNetworks() {
  const rows = await sql`
    select id, name, handle, followers, url, color, icon from social_networks
    where status = 'published' and 'socials' = any(placements)
    order by sort_order, name
  `;
  return rows.map(toNetwork);
}

// A social post in the union of the shapes the feeds use (photo grids, tweets,
// journals, video previews); empty fields are left out.
function toSocialPost(row) {
  const image = row.image_url || (row.video_url ? videoThumbnail(row.video_url) : "");
  const post = {
    id: row.id,
    type: row.kind,
    date: row.date,
    likes: row.likes,
    comments: row.comment_count,
    replies: row.replies,
    retweets: row.reposts,
    views: row.views,
    caption: row.body,
    text: row.body,
    alt: row.alt || row.title || row.body.slice(0, 120),
    conversation: list(row.conversation)
  };
  const optional = {
    image,
    title: row.title,
    src: row.video_url,
    duration: row.duration,
    board: row.board,
    ratio: row.ratio
  };
  for (const [key, value] of Object.entries(optional)) if (value) post[key] = value;
  return post;
}

// { profile, content } for /socials/[network], or null. `content` holds `posts`, or
// `tracks` (+ `friends`) for the music networks, or `article` for Wikipedia.
export async function getSocialPage(network) {
  const [networks, posts, albums, friends, settings] = await readAll([
    sql`select id, name, handle, followers, url, color, icon from social_networks
        where id = ${network} and status = 'published'`,
    sql`select id, kind, title, body, image_url, video_url, alt, likes, comment_count, replies,
          reposts, views, duration, board, ratio, conversation,
          to_char(posted_on, 'YYYY-MM-DD') as date
        from social_posts
        where network_id = ${network} and status = 'published'
        order by sort_order, posted_on desc, id`,
    albumsQuery({
      where: "'socials' = any(al.placements) and $1::text in ('soundcloud', 'myspace')",
      params: [network],
      tracks: "first"
    }),
    artistsQuery({ placement: "friends", limit: network === "myspace" ? null : 0 }),
    sql`select value from site_settings
        where key = 'wikipedia_article' and ${network}::text = 'wikipedia'`
  ]);
  if (!networks[0]) return null;
  const profile = toNetwork(networks[0]);
  const tracks = albums.map(toAlbum).flatMap((album) => album.tracks.slice(0, 1));
  let content;
  if (network === "soundcloud") content = { tracks };
  else if (network === "myspace") content = { friends: friends.map(toArtist), tracks };
  else if (network === "wikipedia") content = { article: settings[0]?.value || null };
  else content = { posts: posts.map(toSocialPost) };
  return { profile, content };
}

// ---------------------------------------------------------------- comments

export const MAX_COMMENT_LENGTH = 1000;

// A comment row joined with its author (`u`), who may have renamed or changed avatar
// since posting; comments of deleted accounts keep the name they were posted with.
export const COMMENT_COLUMNS = `c.id, c.thread_id, c.user_id, c.body, c.likes, c.created_at,
  c.edited_at, coalesce(u.name, c.author_name) as author,
  case when u.id is null then c.author_avatar else u.avatar_url end as avatar`;

const isoTime = (value) => (value ? new Date(value).toISOString() : null);

// The public shape: { id, author, avatar, text, at, editedAt, likes, mine }.
export function toComment(row, userId) {
  return {
    id: row.id,
    author: row.author,
    avatar: row.avatar || null,
    text: row.body,
    at: isoTime(row.created_at),
    editedAt: isoTime(row.edited_at),
    likes: row.likes,
    mine: Boolean(userId) && row.user_id === userId
  };
}
