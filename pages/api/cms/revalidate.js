import { apiHandler, requireAdmin } from "../../../lib/server/http";
import { allPublicListPaths, revalidatePaths } from "../../../lib/server/revalidate";
import { audit } from "../../../lib/server/crm/engine";
import { sql } from "../../../lib/server/db";

export const config = { maxDuration: 60 };

// POST {}: "Refresh public site" — regenerates every list page now.
export default apiHandler({
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    const revalidation = await revalidatePaths(res, await allPublicListPaths());
    await audit((text, params) => sql.query(text, params), admin, "revalidate", "site", null, {
      count: revalidation.revalidated.length,
      failed: revalidation.failed
    });
    res.json({ revalidation });
  }
});
