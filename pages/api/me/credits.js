import { sql } from "../../../lib/server/db";
import { apiHandler, requireUser } from "../../../lib/server/http";
import { ledgerEntry } from "../../../lib/server/accounts";

// GET -> { credits, points, history } (credit ledger, newest first).
export default apiHandler({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const rows = await sql`
      select * from credit_ledger where user_id = ${user.id}
      order by created_at desc, id desc limit 200
    `;
    res.json({ credits: user.credits, points: user.points, history: rows.map(ledgerEntry) });
  }
});
