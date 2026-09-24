import { withTransaction } from "../../../lib/server/db";
import { createSession, hashPassword, verifyPassword } from "../../../lib/server/auth";
import { apiHandler, HttpError, requireUser } from "../../../lib/server/http";
import { parsePassword } from "../../../lib/server/accounts";

const CHANGED_ELSEWHERE = "Your password was changed elsewhere — please log in again.";

// POST { current, next } -> { ok }. Signs out every session of the member and starts a
// new one for this browser.
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
    // Only over the password just verified: if it changed meanwhile (e.g. a reset from
    // the CRM), that change wins.
    let changed;
    try {
      changed = await withTransaction(async (client) => {
        const { rows } = await client.query(
          `update users set password_hash = $2
           where id = $1 and password_hash = $3 and status = 'active' returning id`,
          [user.id, passwordHash, user.password_hash]
        );
        if (!rows.length) return false;
        await client.query("delete from sessions where user_id = $1", [user.id]);
        return true;
      });
    } catch (error) {
      // Deadlocked / serialized against another change to this account: that one won.
      if (error?.code !== "40P01" && error?.code !== "40001") throw error;
      changed = false;
    }
    if (!changed) throw new HttpError(409, CHANGED_ELSEWHERE, { code: "password_changed" });
    const started = await createSession(req, res, {
      kind: "user",
      userId: user.id,
      passwordHash
    });
    if (!started) throw new HttpError(409, CHANGED_ELSEWHERE, { code: "password_changed" });
    res.json({ ok: true });
  }
});
