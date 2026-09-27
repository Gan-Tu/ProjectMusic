import { apiHandler, requireAdmin } from "../../../lib/server/http";

export default apiHandler({
  GET: async (req, res) => {
    res.json({ admin: await requireAdmin(req) });
  }
});
