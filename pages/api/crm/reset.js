import { apiHandler, HttpError, requireAdmin } from "../../../lib/server/http";
import { applySeed } from "../../../lib/server/seed";
import { audit } from "../../../lib/server/crm/engine";
import { sql } from "../../../lib/server/db";
import { allDetailPaths, revalidateAfterBulkChange } from "../../../lib/server/revalidate";

export const config = { maxDuration: 60 };

// POST { scope: "content" | "all", confirm: "RESET" }: replaces the data with the demo
// data ("all" also resets members, orders, credit history and the inbox).
//
// Cached pages are refreshed in priority order within the function's time budget:
// list pages, detail pages whose content no longer exists (so they 404 now), pages
// that exist again, then every other detail page; whatever doesn't fit is left to the
// 60 s ISR and reported as `deferred`.
export default apiHandler({
  POST: async (req, res) => {
    const started = Date.now();
    const admin = await requireAdmin(req);
    const { scope, confirm } = req.body || {};
    if (scope !== "content" && scope !== "all") throw new HttpError(400, "Choose what to reset.");
    if (confirm !== "RESET") throw new HttpError(400, "Type RESET to confirm.");
    const before = await allDetailPaths();
    const result = await applySeed({ scope });
    await audit((text, params) => sql.query(text, params), admin, "reset", "database", null, {
      scope,
      counts: result.counts
    });
    const revalidation = await revalidateAfterBulkChange(res, before, started);
    res.json({ ...result, revalidation });
  }
});
