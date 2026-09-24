import { sql } from "../../../lib/server/db";
import { apiHandler, HttpError, requireUser, str } from "../../../lib/server/http";
import { COMMENT_COLUMNS, MAX_COMMENT_LENGTH, toComment } from "../../../lib/server/content";

// PATCH  /api/comments/<id> { text, expected } -> { comment }; 409 { conflict, text }
//        when the comment no longer reads `expected` (edited meanwhile, e.g. in another tab)
// DELETE /api/comments/<id>                    -> { ok, comment }
// Members change only their own comments (moderation happens in the CRM).

async function ownComment(req, user) {
  const id = String(req.query.id || "");
  const [row] = await sql.query(
    `select ${COMMENT_COLUMNS}, c.status from comments c left join users u on u.id = c.user_id
     where c.id = $1`,
    [id]
  );
  if (!row || row.status !== "visible") throw new HttpError(404, "This comment was deleted.");
  if (row.user_id !== user.id) throw new HttpError(403, "You can only change your own comments.");
  return row;
}

export default apiHandler({
  PATCH: async (req, res) => {
    const user = await requireUser(req);
    const text = str(req.body?.text, { max: MAX_COMMENT_LENGTH, required: true, field: "Comment" });
    const expected = str(req.body?.expected, { max: MAX_COMMENT_LENGTH * 2, trim: false });
    const current = await ownComment(req, user);
    // Compare-and-set: only replaces the text the editor started from.
    const [updated] = await sql`
      update comments set body = ${text}, edited_at = now()
      where id = ${current.id} and user_id = ${user.id} and status = 'visible'
        and body = ${expected}
      returning id
    `;
    if (!updated) {
      const latest = await ownComment(req, user);
      throw new HttpError(409, "This comment was changed meanwhile.", {
        conflict: true,
        text: latest.body
      });
    }
    const latest = await ownComment(req, user);
    res.json({ comment: toComment(latest, user.id) });
  },

  DELETE: async (req, res) => {
    const user = await requireUser(req);
    const current = await ownComment(req, user);
    await sql`delete from comments where id = ${current.id} and user_id = ${user.id}`;
    res.json({ ok: true, comment: toComment(current, user.id) });
  }
});
