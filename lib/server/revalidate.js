import { sql } from "./db";

// On-demand ISR for CRM edits. Server-only.
//
//   const paths = await pathsForChange("albums", row, previousRow);
//   await revalidatePaths(res, paths);   // never throws
//
// In `next dev` every request re-runs getStaticProps anyway, so revalidation is skipped
// there unless CRM_REVALIDATE_IN_DEV=1.

// Every list page of the public site ("Refresh public site").
export const LIST_PATHS = [
  "/",
  "/musics",
  "/albums",
  "/artists",
  "/videos",
  "/events",
  "/shop",
  "/pictures",
  "/news",
  "/blog",
  "/socials",
  "/profile"
];

const MAX_PATHS = 60;

export async function revalidatePaths(res, paths) {
  const unique = [
    ...new Set((paths || []).filter((p) => typeof p === "string" && p.startsWith("/")))
  ];
  const list = unique.slice(0, MAX_PATHS);
  const result = { revalidated: [], failed: [], skipped: false };
  if (!list.length || typeof res?.revalidate !== "function") return result;
  if (process.env.NODE_ENV !== "production" && process.env.CRM_REVALIDATE_IN_DEV !== "1") {
    result.skipped = true;
    result.paths = list; // what would have been revalidated (handy when debugging)
    return result;
  }
  // unstable_onlyGenerated: pages never rendered yet are left to fallback: "blocking".
  const settled = await Promise.allSettled(
    list.map((path) => res.revalidate(path, { unstable_onlyGenerated: true }))
  );
  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") result.revalidated.push(list[index]);
    else result.failed.push(list[index]);
  });
  if (result.failed.length) {
    console.warn(`[crm] revalidation failed for ${result.failed.join(", ")}`);
  }
  return result;
}

const MUSIC_SOCIALS = ["/socials/soundcloud", "/socials/myspace"];

// Public paths affected by a change to `row` of `entity` (and, for updates/deletes, the
// row as it was before). Call it before deleting (relations are gone afterwards).
export async function pathsForChange(entity, row, previousRow) {
  const rows = [row, previousRow].filter(Boolean);
  const paths = new Set();
  const add = (...list) => list.forEach((path) => path && paths.add(path));
  const artistPages = (ids) => ids.filter(Boolean).forEach((id) => add(`/artists/${id}`));
  const ids = [...new Set(rows.map((item) => item.id).filter(Boolean))];

  switch (entity) {
    case "artists": {
      add("/", "/artists", "/events", "/videos", "/profile", "/socials", "/socials/myspace");
      artistPages(ids);
      // Detail pages that show the artist: events with them in the line-up and their
      // videos. (Call before deleting: the cascades remove these links.)
      const [events, videos] = await Promise.all([
        sql.query("select distinct event_id from event_lineup where artist_id = any($1::text[])", [
          ids
        ]),
        sql.query("select id from videos where artist_id = any($1::text[])", [ids])
      ]);
      events.forEach((item) => add(`/events/${item.event_id}`));
      videos.forEach((item) => add(`/videos/${item.id}`));
      break;
    }
    // An album's artist pages: its Music tab (old and new artist_id) and, through vinyl /
    // CD products of the album, their Merch tab.
    case "albums":
    case "tracks": {
      const albumIds = entity === "tracks" ? [...new Set(rows.map((item) => item.album_id))] : ids;
      add("/", "/musics", "/albums", "/profile", ...MUSIC_SOCIALS);
      albumIds.forEach((id) => add(`/albums/${id}`));
      artistPages(rows.map((item) => item.artist_id));
      const [rotation, products, owners] = await Promise.all([
        sql.query(
          "select distinct artist_id from artist_rotation where album_id = any($1::text[])",
          [albumIds]
        ),
        sql.query("select id from products where album_id = any($1::text[])", [albumIds]),
        entity === "tracks"
          ? sql.query("select artist_id from albums where id = any($1::text[])", [albumIds])
          : []
      ]);
      artistPages([...rotation, ...owners].map((item) => item.artist_id));
      if (products.length) add("/shop", ...products.map((item) => `/shop/${item.id}`));
      break;
    }
    case "videos": {
      add("/", "/videos");
      ids.forEach((id) => add(`/videos/${id}`));
      artistPages(rows.map((item) => item.artist_id));
      break;
    }
    case "events": {
      add("/", "/events", "/shop");
      ids.forEach((id) => add(`/events/${id}`));
      const lineup = rows.flatMap((item) => (Array.isArray(item.lineup) ? item.lineup : []));
      const [stored, tickets] = await Promise.all([
        sql.query("select distinct artist_id from event_lineup where event_id = any($1::text[])", [
          ids
        ]),
        sql.query("select id from products where event_id = any($1::text[])", [ids])
      ]);
      artistPages([...lineup, ...stored.map((item) => item.artist_id)]);
      tickets.forEach((item) => add(`/shop/${item.id}`));
      break;
    }
    // Merch tab: products linked to the artist, plus vinyl / CD products whose album
    // belongs to the artist (albums.artist_id), for the old and the new album_id.
    case "products": {
      add("/shop");
      ids.forEach((id) => add(`/shop/${id}`));
      artistPages(rows.map((item) => item.artist_id));
      const albumIds = rows.map((item) => item.album_id).filter(Boolean);
      if (albumIds.length) {
        const owners = await sql.query("select artist_id from albums where id = any($1::text[])", [
          albumIds
        ]);
        artistPages(owners.map((item) => item.artist_id));
      }
      rows.forEach((item) => item.event_id && add(`/events/${item.event_id}`));
      break;
    }
    case "product_categories": {
      add("/shop");
      break;
    }
    case "photo_categories": {
      add("/pictures", "/profile");
      ids.forEach((id) => add(`/pictures/${id}`));
      break;
    }
    case "photos": {
      add("/pictures", "/profile");
      rows.forEach((item) => item.category_id && add(`/pictures/${item.category_id}`));
      artistPages(rows.map((item) => item.artist_id));
      break;
    }
    case "posts": {
      rows.forEach((item) => {
        if (item.section === "news" || item.section === "blog") {
          add("/", `/${item.section}`, item.slug && `/${item.section}/${item.slug}`);
        }
      });
      artistPages(rows.map((item) => item.artist_id));
      break;
    }
    case "social_networks": {
      add("/socials");
      ids.forEach((id) => add(`/socials/${id}`));
      break;
    }
    case "social_posts": {
      add("/socials");
      rows.forEach((item) => item.network_id && add(`/socials/${item.network_id}`));
      break;
    }
    case "site_settings": {
      add("/socials/wikipedia");
      break;
    }
    default:
      // comments (fetched client-side), members, orders, inbox: no static pages.
      break;
  }
  return [...paths];
}

// List pages plus the per-network social pages (for "Refresh public site").
export async function allPublicListPaths() {
  let networks = [];
  try {
    networks = await sql.query("select id from social_networks order by sort_order, id");
  } catch {
    // table unavailable: the list pages alone
  }
  return [...LIST_PATHS, ...networks.map((item) => `/socials/${item.id}`)];
}
