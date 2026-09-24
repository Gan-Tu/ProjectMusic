import { apiHandler, HttpError, int, requireAdmin, str } from "../../../../../lib/server/http";
import { withTransaction } from "../../../../../lib/server/db";
import { audit } from "../../../../../lib/server/crm/engine";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST { delta, note }: adds/removes credits (never below 0) with a ledger entry.
export default apiHandler({
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    const id = String(req.query.id || "");
    if (!UUID.test(id)) throw new HttpError(404, "Member not found.");
    const delta = int(req.body?.delta, { min: -10000000, max: 10000000, field: "Amount" });
    if (!delta) throw new HttpError(400, "Enter an amount other than 0.");
    const note = str(req.body?.note, { max: 300, field: "Note" }) || null;
    const result = await withTransaction(async (client) => {
      const q = async (text, params) => (await client.query(text, params)).rows;
      const [member] = await q("select credits from users where id = $1 for update", [id]);
      if (!member) throw new HttpError(404, "Member not found.");
      const balance = member.credits + delta;
      if (balance < 0) {
        throw new HttpError(
          400,
          `That would take the balance below 0 (current balance: ${member.credits} credits).`
        );
      }
      await q("update users set credits = $2 where id = $1", [id, balance]);
      const [entry] = await q(
        `insert into credit_ledger (user_id, delta, balance_after, reason, note)
         values ($1, $2, $3, 'admin_adjustment', $4)
         returning id::text as id, delta, balance_after, reason, order_id, note, created_at`,
        [id, delta, balance, note]
      );
      await audit(q, admin, "adjust_credits", "users", id, { delta, balance, note });
      return { credits: balance, entry };
    });
    res.json(result);
  }
});
