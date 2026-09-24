import { sql } from "../../../lib/server/db";
import { apiHandler, requireUser } from "../../../lib/server/http";
import { orderToPurchase } from "../../../lib/server/accounts";

// GET -> { userId, purchases } (the member's orders, newest first; userId lets the
// browser drop an answer that arrives after an account change).
export default apiHandler({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const rows = await sql`
      select * from orders where user_id = ${user.id}
      order by created_at desc limit 200
    `;
    res.json({ userId: user.id, purchases: rows.map(orderToPurchase) });
  }
});
