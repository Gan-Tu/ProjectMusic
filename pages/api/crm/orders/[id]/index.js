import { apiHandler, requireAdmin } from "../../../../../lib/server/http";
import { sql } from "../../../../../lib/server/db";
import { getRow } from "../../../../../lib/server/crm/engine";

export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const order = await getRow("orders", req.query.id);
    const ledger = await sql.query(
      `select id::text as id, delta, balance_after, reason, note, created_at from credit_ledger
       where order_id = $1 order by created_at, id`,
      [order.id]
    );
    res.json({ order, ledger });
  }
});
