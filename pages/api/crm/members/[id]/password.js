import { apiHandler, HttpError, requireAdmin, str } from "../../../../../lib/server/http";
import { withTransaction } from "../../../../../lib/server/db";
import { hashPassword } from "../../../../../lib/server/auth";
import { audit } from "../../../../../lib/server/crm/engine";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST { password }: sets a new password and signs the member out everywhere.
export default apiHandler({
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    const id = String(req.query.id || "");
    if (!UUID.test(id)) throw new HttpError(404, "Member not found.");
    const password = str(req.body?.password, { max: 128, field: "Password", trim: false });
    if (password.length < 8) throw new HttpError(400, "Use at least 8 characters.");
    const hash = await hashPassword(password);
    await withTransaction(async (client) => {
      const q = async (text, params) => (await client.query(text, params)).rows;
      const updated = await q("update users set password_hash = $2 where id = $1 returning id", [
        id,
        hash
      ]);
      if (!updated.length) throw new HttpError(404, "Member not found.");
      await q("delete from sessions where user_id = $1", [id]);
      await audit(q, admin, "set_password", "users", id);
    });
    res.json({ ok: true });
  }
});
