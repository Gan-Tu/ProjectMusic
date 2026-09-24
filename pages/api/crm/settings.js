import { apiHandler, HttpError, int, requireAdmin } from "../../../lib/server/http";
import { sql, withTransaction } from "../../../lib/server/db";
import { audit } from "../../../lib/server/crm/engine";
import { pathsForChange, revalidatePaths } from "../../../lib/server/revalidate";

// GET all site_settings; PUT { values: { key: value } } upserts them.
export default apiHandler({
  GET: async (req, res) => {
    await requireAdmin(req);
    const rows = await sql.query("select key, value, updated_at from site_settings order by key");
    res.json({ settings: rows });
  },
  PUT: async (req, res) => {
    const admin = await requireAdmin(req);
    const values = req.body?.values;
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      throw new HttpError(400, "Send { values: { key: value } }.");
    }
    const entries = Object.entries(values).slice(0, 50);
    for (const [key, value] of entries) {
      if (!/^[a-z0-9_]{1,60}$/.test(key)) throw new HttpError(400, `Bad setting key "${key}".`);
      if (key === "signup_bonus_credits") {
        values[key] = int(value, { min: 0, max: 1000000, field: "Sign-up bonus" });
      } else if (value === undefined || JSON.stringify(value).length > 500000) {
        throw new HttpError(400, `The value of ${key} is missing or too large.`);
      }
    }
    await withTransaction(async (client) => {
      const q = async (text, params) => (await client.query(text, params)).rows;
      for (const [key] of entries) {
        await q(
          `insert into site_settings (key, value, updated_at) values ($1, $2::jsonb, now())
           on conflict (key) do update set value = excluded.value, updated_at = now()`,
          [key, JSON.stringify(values[key])]
        );
      }
      await audit(q, admin, "update", "site_settings", null, { keys: entries.map(([key]) => key) });
    });
    const revalidation = await revalidatePaths(res, await pathsForChange("site_settings"));
    const rows = await sql.query("select key, value, updated_at from site_settings order by key");
    res.json({ settings: rows, revalidation });
  }
});
