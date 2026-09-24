import { destroySession } from "../../../lib/server/auth";
import { apiHandler } from "../../../lib/server/http";

export default apiHandler({
  POST: async (req, res) => {
    await destroySession(req, res, "admin");
    res.json({ ok: true });
  }
});
