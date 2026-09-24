import { apiHandler, HttpError, requireAdmin } from "../../../lib/server/http";
import { applySeed } from "../../../lib/server/seed";
import { audit } from "../../../lib/server/crm/engine";
import { sql } from "../../../lib/server/db";
import {
  allDetailPaths,
  allPublicListPaths,
  revalidatePaths
} from "../../../lib/server/revalidate";

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
    const after = await allDetailPaths();
    const had = new Set(before);
    const has = new Set(after);
    const removed = before.filter((path) => !has.has(path));
    const added = after.filter((path) => !had.has(path));
    const unchanged = after.filter((path) => had.has(path));
    const queue = [...(await allPublicListPaths()), ...removed, ...added, ...unchanged];
    const revalidation = await revalidatePaths(res, queue, {
      concurrency: 6,
      deadline: started + 50000 // maxDuration is 60 s
    });
    res.json({
      ...result,
      revalidation: {
        skipped: revalidation.skipped,
        revalidated: revalidation.revalidated.length,
        failed: revalidation.failed,
        deferred: revalidation.deferred.length,
        removedPaths: removed.length
      }
    });
  }
});
