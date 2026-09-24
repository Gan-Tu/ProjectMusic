import { apiHandler, requireAdmin } from "../../../../../lib/server/http";
import { createRow, listRows } from "../../../../../lib/server/crm/engine";
import { pathsForChange, revalidatePaths } from "../../../../../lib/server/revalidate";

// GET: list (?q, status, placement, sort, page, pageSize + entity filters). POST: create.
export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    res.json(await listRows(req.query.entity, req.query));
  },
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    const row = await createRow(req.query.entity, req.body, admin);
    const revalidation = await revalidatePaths(res, await pathsForChange(req.query.entity, row));
    res.status(201).json({ row, revalidation });
  }
});
