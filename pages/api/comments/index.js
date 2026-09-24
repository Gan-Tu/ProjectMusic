import { sql } from "../../../lib/server/db";
import { getSessionUser } from "../../../lib/server/auth";
import { apiHandler, HttpError, makeId, requireUser, str } from "../../../lib/server/http";
import { rateLimit } from "../../../lib/server/rateLimit";
import { COMMENT_COLUMNS, MAX_COMMENT_LENGTH, toComment } from "../../../lib/server/content";

// GET  /api/comments?thread=<kind:id>        -> { comments } visible, newest first
// GET  /api/comments?count=<thread>&count=…  -> { counts: { [thread]: n } }
// POST /api/comments { thread, text }        -> { comment } (members only)

const THREAD = /^(album|video|event|news|blog|social):(\S{1,200})$/;
const MAX_COUNTS = 100;

function threadParam(value) {
  const thread = typeof value === "string" ? value : "";
  const match = THREAD.exec(thread);
  if (!match) throw new HttpError(400, "Unknown comment thread.");
  return { thread, kind: match[1], targetId: match[2] };
}

export default apiHandler({
  GET: async (req, res) => {
    if (req.query.count !== undefined) {
      const threads = [...new Set([req.query.count].flat())].slice(0, MAX_COUNTS);
      const rows = await sql`
        select thread_id, count(*)::int as count from comments
        where thread_id = any(${threads}) and status = 'visible'
        group by thread_id
      `;
      const counts = Object.fromEntries(threads.map((thread) => [thread, 0]));
      for (const row of rows) counts[row.thread_id] = row.count;
      return res.json({ counts });
    }
    const { thread } = threadParam(req.query.thread);
    const user = await getSessionUser(req);
    const rows = await sql.query(
      `select ${COMMENT_COLUMNS} from comments c left join users u on u.id = c.user_id
       where c.thread_id = $1 and c.status = 'visible'
       order by c.created_at desc, c.id desc
       limit 500`,
      [thread]
    );
    res.json({ comments: rows.map((row) => toComment(row, user?.id)) });
  },

  POST: async (req, res) => {
    const user = await requireUser(req);
    const { thread, kind, targetId } = threadParam(req.body?.thread);
    const text = str(req.body?.text, { max: MAX_COMMENT_LENGTH, required: true, field: "Comment" });
    // The thread must belong to published content.
    const [check] = await sql`
      select
        case ${kind}::text
          when 'album' then exists (
            select 1 from albums where id = ${targetId} and status = 'published')
          when 'video' then exists (
            select 1 from videos where id = ${targetId} and status = 'published')
          when 'event' then exists (
            select 1 from events where id = ${targetId} and status = 'published')
          when 'social' then exists (
            select 1 from social_posts where id = ${targetId} and status = 'published')
          else exists (select 1 from posts
            where section = ${kind} and slug = ${targetId} and status = 'published')
        end as found
    `;
    if (!check.found) throw new HttpError(404, "This page no longer takes comments.");
    // 10 comments a minute per member, reserved atomically before the insert.
    const slot = await rateLimit(req, res, {
      key: `comment:user:${user.id}`,
      limit: 10,
      windowSeconds: 60,
      message: "You're commenting very fast. Take a breath and try again."
    });
    const id = makeId("comment");
    try {
      await sql`
        insert into comments (id, thread_id, user_id, author_name, author_avatar, body)
        values (${id}, ${thread}, ${user.id}, ${user.name}, ${user.avatar_url || null}, ${text})
      `;
    } catch (error) {
      await slot.release(); // nothing was posted
      throw error;
    }
    const [row] = await sql.query(
      `select ${COMMENT_COLUMNS} from comments c left join users u on u.id = c.user_id
       where c.id = $1`,
      [id]
    );
    res.status(201).json({ comment: toComment(row, user.id) });
  }
});
