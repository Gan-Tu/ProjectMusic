import { apiHandler, HttpError, requireAdmin } from "../../../../../lib/server/http";
import {
  deleteRow,
  duplicateRow,
  getRow,
  requireEntity,
  updateRow
} from "../../../../../lib/server/crm/engine";
import { pathsForChange, revalidatePaths } from "../../../../../lib/server/revalidate";

// GET one row (with relations), PATCH a partial update (or { placement, enabled }),
// POST { action: "duplicate" }, DELETE.
export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    requireEntity(req.query.entity);
    res.json({ row: await getRow(req.query.entity, req.query.id) });
  },
  PATCH: async (req, res) => {
    const admin = await requireAdmin(req);
    const { entity, id } = req.query;
    const { row, previous } = await updateRow(entity, id, req.body, admin);
    const revalidation = await revalidatePaths(res, await pathsForChange(entity, row, previous));
    res.json({ row, revalidation });
  },
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    if (req.body?.action !== "duplicate") throw new HttpError(400, "Unknown action.");
    const row = await duplicateRow(req.query.entity, req.query.id, admin);
    res.status(201).json({ row });
  },
  DELETE: async (req, res) => {
    const admin = await requireAdmin(req);
    const { entity, id } = req.query;
    const current = await getRow(entity, id);
    const paths = await pathsForChange(entity, current);
    await deleteRow(entity, id, admin);
    const revalidation = await revalidatePaths(res, paths);
    res.json({ ok: true, revalidation });
  }
});
