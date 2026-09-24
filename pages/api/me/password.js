import { sql } from "../../../lib/server/db";
import {
  createSession,
  destroyUserSessions,
  hashPassword,
  verifyPassword
} from "../../../lib/server/auth";
import { apiHandler, HttpError, requireUser } from "../../../lib/server/http";
import { parsePassword } from "../../../lib/server/accounts";

// POST { current, next } -> { ok }. Signs out every other session of the member.
export default apiHandler({
  POST: async (req, res) => {
    const user = await requireUser(req);
    const { current, next } = req.body || {};
    if (typeof current !== "string" || !current) {
      throw new HttpError(400, "Enter your current password.");
    }
    const password = parsePassword(next, "New password");
    if (user.is_demo) {
      throw new HttpError(
        403,
        "The demo account's password can't be changed. Sign up to get your own account."
      );
    }
    if (!(await verifyPassword(current, user.password_hash))) {
      throw new HttpError(400, "Your current password is wrong.");
    }
    const passwordHash = await hashPassword(password);
    await sql`update users set password_hash = ${passwordHash} where id = ${user.id}`;
    await destroyUserSessions(user.id);
    await createSession(req, res, { kind: "user", userId: user.id });
    res.json({ ok: true });
  }
});
