import { checkAdminCredentials, createSession, ADMIN_USERNAME } from "../../../lib/server/auth";
import { apiHandler, HttpError } from "../../../lib/server/http";
import { sql } from "../../../lib/server/db";
import { clientIp, rateLimit } from "../../../lib/server/rateLimit";
import { actorOf } from "../../../lib/server/crm/engine";

// At most 10 failed attempts per client IP in 15 minutes. The limiter reserves a slot
// atomically before the credentials are checked (so concurrent guesses can't slip
// through); a successful login gives its slot back. Attempts are also written to
// audit_log ("login_failed" by "anonymous", "login" by the admin) for the activity feed.
export default apiHandler({
  POST: async (req, res) => {
    const ip = clientIp(req).slice(0, 100);
    const slot = await rateLimit(req, res, {
      key: `crm-login:${ip}`,
      limit: 10,
      windowSeconds: 900,
      message: "Too many attempts, try again in a few minutes."
    });
    const { username, password } = req.body || {};
    if (!checkAdminCredentials(username, password)) {
      await sql.query(
        "insert into audit_log (actor, action, entity, detail) values ('anonymous', 'login_failed', 'crm', $1::jsonb)",
        [JSON.stringify({ ip })]
      );
      await new Promise((resolve) => setTimeout(resolve, 400)); // slow down guessing a little
      throw new HttpError(401, "Wrong username or password.");
    }
    await slot.release();
    await createSession(req, res, { kind: "admin" });
    const admin = { username: ADMIN_USERNAME };
    await sql.query(
      "insert into audit_log (actor, action, entity, detail) values ($1, 'login', 'crm', $2::jsonb)",
      [actorOf(admin), JSON.stringify({ ip })]
    );
    res.json({ admin });
  }
});
