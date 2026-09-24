import { sql } from "../../../lib/server/db";
import { createSession, hashPassword, publicUser, verifyPassword } from "../../../lib/server/auth";
import { apiHandler, HttpError, str } from "../../../lib/server/http";
import { clientIp, rateLimit } from "../../../lib/server/rateLimit";

// Checked when the login name is unknown, so both failures take as long.
let decoyHash;

// POST { login: username or email, password } -> { user } and a session.
// Throttled per IP: every attempt reserves a slot (10 per 15 minutes) before the
// password is checked, and a successful login gives it back, so only failures count.
// Failures are also logged as audit_log rows ("login_failed").
export default apiHandler({
  POST: async (req, res) => {
    const body = req.body || {};
    const login = str(body.login ?? body.username, { max: 254, field: "Username" }).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!login || !password) throw new HttpError(400, "Enter your username or email and password.");
    const ip = clientIp(req);
    const slot = await rateLimit(req, res, {
      key: `login:${ip}`,
      limit: 10,
      windowSeconds: 900,
      message: "Too many attempts — try again in a few minutes."
    });

    // Every failure looks (and takes) the same, whatever went wrong.
    const failed = async () => {
      await sql`
        insert into audit_log (actor, action, entity, detail)
        values ('anonymous', 'login_failed', 'users', ${JSON.stringify({ ip, login })}::jsonb)
      `;
      return new HttpError(401, "Wrong username or password.");
    };
    if (password.length > 128) throw await failed();
    const [user] = await sql`select * from users where username = ${login} or email = ${login}`;
    if (!user) {
      decoyHash ||= await hashPassword("decoy password");
      await verifyPassword(password, decoyHash);
      throw await failed();
    }
    if (!(await verifyPassword(password, user.password_hash))) throw await failed();
    if (user.status !== "active") {
      await slot.release(); // the right password: not a guess
      throw new HttpError(
        403,
        "This account is suspended. Contact the studio if you think this is a mistake."
      );
    }
    // Only if the password is still the one just checked (a password change may have
    // revoked sessions meanwhile) and the account is still active.
    const started = await createSession(req, res, {
      kind: "user",
      userId: user.id,
      passwordHash: user.password_hash
    });
    if (!started) throw await failed();
    await slot.release();
    const [updated] = await sql`
      update users set last_login_at = now() where id = ${user.id} returning *
    `;
    res.json({ user: publicUser(updated || user) });
  }
});
