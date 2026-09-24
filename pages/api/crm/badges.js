import { apiHandler, requireAdmin } from "../../../lib/server/http";
import { sql } from "../../../lib/server/db";

// Counts shown next to sidebar items (unread inbox).
export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const [row] = await sql.query("select count(*)::int as inbox from inbox where status = 'new'");
    res.json({ inbox: row.inbox });
  }
});
