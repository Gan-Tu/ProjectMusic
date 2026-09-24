import { apiHandler, HttpError, requireAdmin } from "../../../lib/server/http";
import { clearData } from "../../../lib/server/seed";
import { audit } from "../../../lib/server/crm/engine";
import { sql } from "../../../lib/server/db";
import { allDetailPaths, revalidateAfterBulkChange } from "../../../lib/server/revalidate";

export const config = { maxDuration: 60 };

// POST { scope: "content" | "all", confirm: "CLEAR" }: deletes the data for a fresh
// start. "content" = all public content (incl. categories, socials, comments); members,
// orders, the inbox and site settings stay. "all" also deletes every member (the demo
// account too), member sessions, orders, credit history and the inbox. The admin
// session always stays. Only "Reset to demo data" brings content back.
export default apiHandler({
  POST: async (req, res) => {
    const started = Date.now();
    const admin = await requireAdmin(req);
    const { scope, confirm } = req.body || {};
    if (scope !== "content" && scope !== "all") throw new HttpError(400, "Choose what to clear.");
    if (confirm !== "CLEAR") throw new HttpError(400, "Type CLEAR to confirm.");
    const before = await allDetailPaths();
    const result = await clearData({ scope });
    await audit((text, params) => sql.query(text, params), admin, "clear", "database", null, {
      scope,
      counts: result.counts
    });
    const revalidation = await revalidateAfterBulkChange(res, before, started);
    res.json({ ...result, revalidation });
  }
});
