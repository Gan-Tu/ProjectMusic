import crypto from "node:crypto";
import { sql } from "../../../lib/server/db";
import { createSession, hashPassword, publicUser } from "../../../lib/server/auth";
import { apiHandler, HttpError, str } from "../../../lib/server/http";
import { clientIp, rateLimit } from "../../../lib/server/rateLimit";
import {
  assertAvailable,
  duplicateUserError,
  getSignupBonus,
  parseEmail,
  parseName,
  parsePassword,
  parseUsername
} from "../../../lib/server/accounts";

// POST { name, username, email, password, location? } -> { user } and a session.
// New members start with the signup bonus (site setting) as a ledger entry. At most
// 5 sign-ups per IP per hour: a valid request reserves a slot before any work, and
// gives it back if no account is created. Sign-ups are also logged in audit_log.
export default apiHandler({
  POST: async (req, res) => {
    const body = req.body || {};
    const name = parseName(body.name);
    const username = parseUsername(body.username);
    const email = parseEmail(body.email);
    const password = parsePassword(body.password);
    const location = str(body.location, { max: 80, field: "Location" });
    const ip = clientIp(req);
    const slot = await rateLimit(req, res, {
      key: `signup:${ip}`,
      limit: 5,
      windowSeconds: 3600,
      message: "Too many sign-ups from your network — try again in an hour."
    });
    let user;
    try {
      await assertAvailable({ username, email });
      const [passwordHash, bonus] = await Promise.all([hashPassword(password), getSignupBonus()]);
      const id = crypto.randomUUID();
      const statements = [
        sql`
          insert into users (id, username, email, name, password_hash, location, credits, last_login_at)
          values (${id}, ${username}, ${email}, ${name}, ${passwordHash}, ${location}, ${bonus}, now())
          returning *
        `,
        sql`
          insert into audit_log (actor, action, entity, entity_id, detail)
          values (${`user:${id}`}, 'signup', 'users', ${id}, ${JSON.stringify({ ip })}::jsonb)
        `
      ];
      if (bonus > 0) {
        statements.push(sql`
          insert into credit_ledger (user_id, delta, balance_after, reason, note)
          values (${id}, ${bonus}, ${bonus}, 'signup_bonus', 'Welcome bonus')
        `);
      }
      [[user]] = await sql.transaction(statements);
    } catch (error) {
      await slot.release(); // no account was created
      throw duplicateUserError(error) || error;
    }
    if (!user) throw new HttpError(500, "Your account couldn't be created. Please try again.");
    await createSession(req, res, { kind: "user", userId: user.id });
    res.status(201).json({ user: publicUser(user) });
  }
});
