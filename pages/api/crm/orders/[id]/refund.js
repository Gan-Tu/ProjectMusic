import { apiHandler, HttpError, requireAdmin, str } from "../../../../../lib/server/http";
import { withTransaction } from "../../../../../lib/server/db";
import { audit } from "../../../../../lib/server/crm/engine";

// POST {}: marks a completed order refunded. Credits spent on it go back to the member;
// credits it granted (credit packs) are taken back, but only if the balance still holds
// them. Points earned are removed (not below 0).
export default apiHandler({
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    const id = str(req.query.id, { max: 100, required: true, field: "Order" });
    const result = await withTransaction(async (client) => {
      const q = async (text, params) => (await client.query(text, params)).rows;
      const [order] = await q("select * from orders where id = $1 for update", [id]);
      if (!order) throw new HttpError(404, "Order not found.");
      if (order.status !== "completed")
        throw new HttpError(409, `This order is already ${order.status}.`);
      let balance = null;
      if (order.user_id) {
        const [member] = await q("select credits, points from users where id = $1 for update", [
          order.user_id
        ]);
        if (member) {
          const give = order.method === "credits" ? order.total_credits : 0;
          const take = order.credits_granted || 0;
          balance = member.credits;
          if (balance + give - take < 0) {
            throw new HttpError(
              409,
              `Can't refund: the member has already spent the ${take} credits this order granted (balance: ${member.credits}).`
            );
          }
          const entries = [
            [give, "Refund: credits returned"],
            [-take, "Refund: granted credits removed"]
          ].filter(([delta]) => delta);
          for (const [delta, note] of entries) {
            balance += delta;
            await q(
              `insert into credit_ledger (user_id, delta, balance_after, reason, order_id, note)
               values ($1, $2, $3, 'refund', $4, $5)`,
              [order.user_id, delta, balance, order.id, note]
            );
          }
          await q(
            "update users set credits = $2, points = greatest(points - $3, 0) where id = $1",
            [order.user_id, balance, order.points_earned || 0]
          );
        }
      }
      await q("update orders set status = 'refunded' where id = $1", [id]);
      await audit(q, admin, "refund", "orders", id, { balance });
      return { balance };
    });
    res.json({ ok: true, ...result });
  }
});
