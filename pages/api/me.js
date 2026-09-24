import { sql } from "../../lib/server/db";
import {
  destroySession,
  getSessionUser,
  parseCookies,
  publicUser,
  USER_COOKIE
} from "../../lib/server/auth";
import { apiHandler, HttpError, requireUser, str } from "../../lib/server/http";
import {
  assertAvailable,
  duplicateUserError,
  parseAvatar,
  parseEmail,
  parseName,
  parseUsername
} from "../../lib/server/accounts";

// GET -> { user } (null for guests). PATCH { name?, username?, email?, avatar?,
// location?, bio? } -> { user }.
export default apiHandler({
  GET: async (req, res) => {
    const user = await getSessionUser(req);
    // A cookie whose session is gone (logged out elsewhere, account deleted or
    // suspended): drop it so the browser is simply a guest again.
    if (!user && parseCookies(req)[USER_COOKIE]) await destroySession(req, res, "user");
    res.json({ user: publicUser(user) });
  },
  PATCH: async (req, res) => {
    const user = await requireUser(req);
    const body = req.body || {};
    const patch = {};
    if ("name" in body) patch.name = parseName(body.name);
    if ("username" in body) patch.username = parseUsername(body.username);
    if ("email" in body) patch.email = parseEmail(body.email);
    if ("avatar" in body) patch.avatar_url = parseAvatar(body.avatar);
    if ("location" in body) patch.location = str(body.location, { max: 80, field: "Location" });
    if ("bio" in body) patch.bio = str(body.bio, { max: 500, field: "Bio" });
    for (const [column, value] of Object.entries(patch)) {
      if ((user[column] ?? null) === value) delete patch[column];
    }
    if (!Object.keys(patch).length) return res.json({ user: publicUser(user) });
    // Everyone shares the demo login, so it has to keep working.
    if (user.is_demo && (patch.username || patch.email)) {
      throw new HttpError(
        403,
        "The demo account's username and email can't be changed. Sign up to get your own account."
      );
    }
    if (patch.username || patch.email) {
      await assertAvailable({ username: patch.username, email: patch.email }, user.id);
    }
    const columns = Object.keys(patch); // fixed names from the checks above
    const assignments = columns.map((column, index) => `${column} = $${index + 2}`).join(", ");
    let row;
    try {
      [row] = await sql.query(`update users set ${assignments} where id = $1 returning *`, [
        user.id,
        ...columns.map((column) => patch[column])
      ]);
    } catch (error) {
      throw duplicateUserError(error) || error;
    }
    res.json({ user: publicUser(row) });
  }
});
