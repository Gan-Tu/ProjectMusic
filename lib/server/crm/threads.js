import { sql } from "../db";
import { threadLabel } from "../../../components/crm/entityDefs";

// Human titles for comment threads ("album:<id>" -> the album's name), resolved for a
// whole page of comments in one query. Adds `thread_title` (null when the target is
// gone), `thread_label` ("Celestial · Album") and, for social posts, `thread_network`
// (for the /socials/<network> link).
const QUERY = `
  with t as (
    select distinct thread_id, split_part(thread_id, ':', 1) as kind,
      substr(thread_id, strpos(thread_id, ':') + 1) as ref
    from unnest($1::text[]) as thread_id
  )
  select t.thread_id,
    case t.kind
      when 'album' then (select name from albums where id = t.ref)
      when 'video' then (select title from videos where id = t.ref)
      when 'event' then (select title from events where id = t.ref)
      when 'news' then (select coalesce(nullif(title, ''), slug) from posts
        where section = 'news' and slug = t.ref)
      when 'blog' then (select coalesce(nullif(title, ''), slug) from posts
        where section = 'blog' and slug = t.ref)
      when 'social' then (select n.name || ' post' from social_posts p
        join social_networks n on n.id = p.network_id where p.id = t.ref)
    end as title,
    case when t.kind = 'social' then (select network_id from social_posts where id = t.ref) end
      as network
  from t`;

export async function attachThreadTitles(rows) {
  const ids = [...new Set((rows || []).map((row) => row?.thread_id).filter(Boolean))];
  if (!ids.length) return rows;
  const resolved = await sql.query(QUERY, [ids]);
  const byId = new Map(resolved.map((item) => [item.thread_id, item]));
  for (const row of rows) {
    const match = byId.get(row.thread_id);
    row.thread_title = match?.title || null;
    row.thread_network = match?.network || null;
    row.thread_label = threadLabel(row);
  }
  return rows;
}
