import { apiHandler, requireAdmin } from "../../../lib/server/http";
import { sql } from "../../../lib/server/db";

const LIMIT = 5;

// GET ?q= : up to 5 matches per type by name/title, each with the CRM page to open.
const QUERY = `
  (select 'artist' as type, id, name as title, location as subtitle, image_url as image,
     null::text as parent from artists where name ilike $1 or id ilike $1 order by name limit ${LIMIT})
  union all
  (select 'album', id, name, artist_name, cover_url, null from albums
     where name ilike $1 or id ilike $1 order by name limit ${LIMIT})
  union all
  (select 'track', t.id, t.title, a.name || ' · ' || coalesce(t.artist_name, a.artist_name), a.cover_url,
     t.album_id from tracks t join albums a on a.id = t.album_id
     where t.title ilike $1 order by t.title limit ${LIMIT})
  union all
  (select 'video', id, title, coalesce(artist_name, subtitle), poster_url, null from videos
     where title ilike $1 or id ilike $1 order by title limit ${LIMIT})
  union all
  (select 'event', id, title, concat_ws(' · ', nullif(city, ''),
     to_char(starts_at at time zone time_zone, 'YYYY-MM-DD')), image_url, null from events
     where title ilike $1 or id ilike $1 order by starts_at desc limit ${LIMIT})
  union all
  (select 'product', id, name, category, images[1], null from products
     where name ilike $1 or id ilike $1 order by name limit ${LIMIT})
  union all
  (select 'post', p.id, coalesce(nullif(p.title, ''), nullif(left(p.snippet, 80), ''),
     nullif(left(p.body[1], 80), ''), p.slug),
     concat_ws(' · ', p.section, a.name, to_char(p.published_on, 'YYYY-MM-DD')), p.image_url, null
     from posts p left join artists a on a.id = p.artist_id
     where p.title ilike $1 or p.slug ilike $1 order by p.published_on desc limit ${LIMIT})
  union all
  (select 'member', id::text, name, '@' || username || ' · ' || email, avatar_url, null from users
     where name ilike $1 or username ilike $1 or email ilike $1 order by name limit ${LIMIT})`;

const HREF = {
  artist: (row) => `/crm/artists/${encodeURIComponent(row.id)}`,
  album: (row) => `/crm/music/${encodeURIComponent(row.id)}`,
  track: (row) => `/crm/music/${encodeURIComponent(row.parent)}`,
  video: (row) => `/crm/videos/${encodeURIComponent(row.id)}`,
  event: (row) => `/crm/events/${encodeURIComponent(row.id)}`,
  product: (row) => `/crm/shop/${encodeURIComponent(row.id)}`,
  post: (row) => `/crm/posts/${encodeURIComponent(row.id)}`,
  member: (row) => `/crm/members/${encodeURIComponent(row.id)}`
};
const ORDER = Object.keys(HREF);

export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    if (q.length < 2) return res.json({ results: [] });
    const pattern = `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    const rows = await sql.query(QUERY, [pattern]);
    const results = rows
      .map((row) => ({
        type: row.type,
        id: row.id,
        title: row.title || row.id,
        subtitle: row.subtitle || "",
        image: row.image || null,
        href: HREF[row.type](row)
      }))
      .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
    res.json({ results });
  }
});
