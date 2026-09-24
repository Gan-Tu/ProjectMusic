import { apiHandler, requireAdmin } from "../../../../../lib/server/http";
import { sql } from "../../../../../lib/server/db";
import { deleteRow, getRow, updateRow } from "../../../../../lib/server/crm/engine";
import { attachThreadTitles } from "../../../../../lib/server/crm/threads";

// Member detail with orders, credit history and comments; PATCH profile/status
// (suspending ends their sessions); DELETE.
export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const member = await getRow("members", req.query.id);
    const [orders, ledger, comments] = await Promise.all([
      sql.query(
        `select id, method, items, total_usd, total_credits, credits_granted, points_earned, status,
         created_at from orders where user_id = $1::uuid order by created_at desc limit 200`,
        [member.id]
      ),
      sql.query(
        `select id::text as id, delta, balance_after, reason, order_id, note, created_at
         from credit_ledger where user_id = $1::uuid order by created_at desc, id desc limit 300`,
        [member.id]
      ),
      sql.query(
        `select id, thread_id, body, likes, status, created_at from comments
         where user_id = $1::uuid order by created_at desc limit 200`,
        [member.id]
      )
    ]);
    await attachThreadTitles(comments);
    res.json({ member, orders, ledger, comments });
  },
  PATCH: async (req, res) => {
    const admin = await requireAdmin(req);
    const { row } = await updateRow("members", req.query.id, req.body, admin);
    res.json({ row });
  },
  DELETE: async (req, res) => {
    const admin = await requireAdmin(req);
    await deleteRow("members", req.query.id, admin);
    res.json({ ok: true });
  }
});
