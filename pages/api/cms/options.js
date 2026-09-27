import { apiHandler, requireAdmin } from "../../../lib/server/http";
import { sql } from "../../../lib/server/db";

// Lightweight { value, label, image, status } lists for selects and pickers.
const QUERIES = {
  artists:
    "select id as value, name as label, image_url as image, status from artists order by name",
  albums: `select id as value, name as label, artist_name as hint, cover_url as image, status,
    artist_id from albums order by name`,
  events: `select id as value, title as label, to_char(starts_at at time zone time_zone,
    'YYYY-MM-DD') as hint, image_url as image, status from events order by starts_at desc`,
  videos:
    "select id as value, title as label, poster_url as image, status, artist_id from videos order by title",
  product_categories:
    "select slug as value, label, status from product_categories order by sort_order, label",
  photo_categories:
    "select id as value, name as label, image_url as image, status from photo_categories order by sort_order, name",
  social_networks:
    "select id as value, name as label, status from social_networks order by sort_order, name"
};

export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const types = String(req.query.types || "")
      .split(",")
      .filter((type) => Object.hasOwn(QUERIES, type));
    const results = await Promise.all(types.map((type) => sql.query(QUERIES[type])));
    res.json(Object.fromEntries(types.map((type, index) => [type, results[index]])));
  }
});
