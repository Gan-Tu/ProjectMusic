import { destroySession } from "../../../lib/server/auth";
import { apiHandler } from "../../../lib/server/http";

// POST {} -> ends this browser's member session.
export default apiHandler({
  POST: async (req, res) => {
    await destroySession(req, res, "user");
    res.json({ ok: true });
  }
});
