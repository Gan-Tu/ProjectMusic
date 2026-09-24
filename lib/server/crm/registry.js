import { ENTITIES, entityPk } from "../../../components/crm/entityDefs";

// Server-only SQL details for each CRM entity, layered over the client-safe field
// definitions in components/crm/entityDefs.js. Everything interpolated into SQL comes
// from this file (never from the request): column names are whitelisted by the field
// definitions, sorts and filters by the keys below. `t` is the entity's table alias.

const artistRef = (p) => `t.artist_id = ${p}`;

const SERVER = {
  artists: {
    search: ["t.id", "t.name", "t.location", "t.tagline"],
    sorts: {
      manual: "t.sort_order asc, t.name asc",
      name: "t.name asc",
      newest: "t.created_at desc",
      updated: "t.updated_at desc"
    },
    extras: `
      (select count(*) from albums x where x.artist_id = t.id)::int as album_count,
      (select count(*) from videos x where x.artist_id = t.id)::int as video_count,
      (select count(*) from photos x where x.artist_id = t.id)::int as photo_count,
      (select count(*) from event_lineup x where x.artist_id = t.id)::int as event_count,
      (select count(*) from products x where x.artist_id = t.id)::int as product_count,
      (select count(*) from posts x where x.artist_id = t.id)::int as post_count`,
    filters: { artist: (p) => `t.id = ${p}` }
  },
  albums: {
    search: ["t.id", "t.name", "t.artist_name"],
    sorts: {
      manual: "t.sort_order asc, t.release_date desc nulls last, t.name asc",
      newest: "t.release_date desc nulls last, t.name asc",
      name: "t.name asc",
      updated: "t.updated_at desc"
    },
    extras: `
      (select count(*) from tracks x where x.album_id = t.id)::int as track_count,
      (select name from artists x where x.id = t.artist_id) as artist_label`,
    filters: { artist: artistRef, album_type: (p) => `t.album_type = ${p}` }
  },
  tracks: {
    search: ["t.title"],
    sorts: { manual: "t.number asc" },
    filters: { album: (p) => `t.album_id = ${p}` }
  },
  videos: {
    search: ["t.id", "t.title", "t.subtitle", "t.artist_name"],
    sorts: {
      manual: "t.sort_order asc, t.published_on desc",
      newest: "t.published_on desc, t.title asc",
      views: "t.views desc",
      name: "t.title asc"
    },
    extras: `(select name from artists x where x.id = t.artist_id) as artist_label`,
    filters: { artist: artistRef }
  },
  events: {
    search: ["t.id", "t.title", "t.subtitle", "t.city", "t.venue"],
    sorts: {
      upcoming: "t.starts_at asc",
      latest: "t.starts_at desc",
      manual: "t.sort_order asc, t.starts_at asc",
      name: "t.title asc"
    },
    extras: `(select coalesce(array_agg(a.name order by l.position), '{}') from event_lineup l
      join artists a on a.id = l.artist_id where l.event_id = t.id) as lineup_names`,
    filters: {
      artist: (p) =>
        `exists (select 1 from event_lineup l where l.event_id = t.id and l.artist_id = ${p})`
    }
  },
  product_categories: {
    search: ["t.slug", "t.label"],
    sorts: { manual: "t.sort_order asc, t.label asc", name: "t.label asc" },
    extras: `(select count(*) from products x where x.category = t.slug)::int as product_count`
  },
  products: {
    search: ["t.id", "t.name", "t.subtitle", "t.category"],
    sorts: {
      manual: "t.sort_order asc, t.added_on desc, t.name asc",
      newest: "t.added_on desc, t.name asc",
      name: "t.name asc",
      price: "t.price asc nulls last, t.credits asc nulls last"
    },
    extras: `
      (select label from product_categories x where x.slug = t.category) as category_label,
      (select name from artists x where x.id = t.artist_id) as artist_label`,
    filters: {
      category: (p) => `t.category = ${p}`,
      kind: (p) => `t.kind = ${p}`,
      artist: (p) =>
        `(t.artist_id = ${p} or t.album_id in (select id from albums where artist_id = ${p}))`
    }
  },
  photo_categories: {
    search: ["t.id", "t.name", "t.description"],
    sorts: { manual: "t.sort_order asc, t.name asc", name: "t.name asc" },
    extras: `(select count(*) from photos x where x.category_id = t.id)::int as photo_count`
  },
  photos: {
    search: ["t.id", "t.caption", "t.location", "t.alt"],
    sorts: { manual: "t.sort_order asc, t.created_at desc", newest: "t.created_at desc" },
    extras: `
      (select name from photo_categories x where x.id = t.category_id) as category_label,
      (select name from artists x where x.id = t.artist_id) as artist_label`,
    filters: { category: (p) => `t.category_id = ${p}`, artist: artistRef }
  },
  posts: {
    search: ["t.slug", "t.title", "t.author", "t.category", "t.snippet"],
    sorts: {
      newest: "t.published_on desc, t.created_at desc",
      manual: "t.sort_order asc, t.published_on desc",
      name: "t.title asc"
    },
    extras: `(select name from artists x where x.id = t.artist_id) as artist_label`,
    filters: { section: (p) => `t.section = ${p}`, artist: artistRef }
  },
  social_networks: {
    search: ["t.id", "t.name", "t.handle"],
    sorts: {
      manual: "t.sort_order asc, t.name asc",
      name: "t.name asc",
      followers: "t.followers desc"
    },
    extras: `(select count(*) from social_posts x where x.network_id = t.id)::int as post_count`
  },
  social_posts: {
    search: ["t.id", "t.title", "t.body", "t.board"],
    sorts: {
      manual: "t.network_id asc, t.sort_order asc",
      newest: "t.posted_on desc, t.created_at desc"
    },
    extras: `(select name from social_networks x where x.id = t.network_id) as network_label`,
    filters: { network: (p) => `t.network_id = ${p}`, artist: artistRef }
  },
  comments: {
    search: ["t.body", "t.author_name", "t.thread_id"],
    sorts: {
      newest: "t.created_at desc",
      oldest: "t.created_at asc",
      likes: "t.likes desc, t.created_at desc"
    },
    extras: `(select username from users x where x.id = t.user_id) as username`,
    filters: {
      kind: (p) => `split_part(t.thread_id, ':', 1) = ${p}`,
      thread: (p) => `t.thread_id = ${p}`,
      member: (p) => `t.user_id::text = ${p}`,
      // Threads of this artist's albums, videos, events and news/blog posts.
      artist: (p) => `t.thread_id in (
        select 'album:' || id from albums where artist_id = ${p}
        union all select 'video:' || id from videos where artist_id = ${p}
        union all select 'event:' || event_id from event_lineup where artist_id = ${p}
        union all select section || ':' || slug from posts
          where artist_id = ${p} and section in ('news', 'blog'))`
    }
  },
  members: {
    search: ["t.name", "t.username", "t.email"],
    sorts: {
      newest: "t.created_at desc",
      name: "t.name asc",
      credits: "t.credits desc",
      login: "t.last_login_at desc nulls last"
    },
    extras: `(select count(*) from orders x where x.user_id = t.id)::int as order_count`
  },
  orders: {
    search: ["t.id", "u.username", "u.email", "u.name"],
    join: "left join users u on u.id = t.user_id",
    sorts: {
      newest: "t.created_at desc",
      oldest: "t.created_at asc",
      total: "t.total_usd desc, t.total_credits desc"
    },
    extras: "u.username as username, u.name as member_name, u.email as member_email",
    filters: {
      method: (p) => `t.method = ${p}`,
      member: (p) => `t.user_id::text = ${p}`
    }
  },
  inbox: {
    search: ["t.name", "t.email", "t.subject", "t.body"],
    sorts: { newest: "t.created_at desc", oldest: "t.created_at asc" },
    filters: { kind: (p) => `t.kind = ${p}` }
  }
};

// Relations saved alongside a row (arrays in the request body).
export const RELATIONS = {
  albums: ["tracks"],
  events: ["lineup"],
  artists: ["rotation"]
};

// Types stored as Postgres arrays / jsonb (parameters need a cast).
const CASTS = {
  tags: "text[]",
  images: "text[]",
  paragraphs: "text[]",
  placements: "text[]",
  list: "jsonb",
  map: "jsonb",
  json: "jsonb",
  date: "date",
  datetime: "timestamptz"
};

export function getEntity(key) {
  const def = Object.hasOwn(ENTITIES, key) ? ENTITIES[key] : null;
  if (!def) return null;
  const server = SERVER[key] || {};
  const pk = entityPk(key);
  const columns = def.fields.filter((field) => !field.virtual).map((field) => field.name);
  if (!columns.includes(pk)) columns.unshift(pk);
  const fieldMap = Object.fromEntries(def.fields.map((field) => [field.name, field]));
  const selectList = [
    ...columns.map((name) =>
      fieldMap[name]?.type === "date"
        ? `to_char(t.${name}, 'YYYY-MM-DD') as ${name}`
        : name === pk && def.uuid
          ? `t.${name}::text as ${name}`
          : `t.${name}`
    ),
    ...(def.stamps || []).map((name) => `t.${name}`),
    ...(key === "comments" || key === "inbox" || key === "orders"
      ? ["t.user_id::text as user_id"]
      : [])
  ];
  // user_id is uuid; keep it as text for JSON and comparisons.
  const select = [...new Set(selectList.filter((item) => item !== "t.user_id"))].join(", ");
  return {
    key,
    ...def,
    ...server,
    pk,
    columns,
    fieldMap,
    select,
    relations: RELATIONS[key] || [],
    cast: (field) => CASTS[field.type] || (field.name === pk && def.uuid ? "uuid" : null)
  };
}
