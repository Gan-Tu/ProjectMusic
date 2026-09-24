import { withTransaction } from "../../lib/server/db";
import { publicUser } from "../../lib/server/auth";
import { apiHandler, HttpError, requireUser } from "../../lib/server/http";
import { priceLines } from "../../lib/server/pricing";
import { newOrderId, orderToPurchase } from "../../lib/server/accounts";
import { cartTotals, pointsFor } from "../../lib/pricing";

// POST { method: "credits" | "card", items: [cart lines], fromCart, accountId? }
//   -> { purchase, user }
// accountId is the member the page showed: if the cookie now belongs to someone else
// (logged in elsewhere as another member), nothing is charged.
//
// Payments are fake: "card" always succeeds. Every line is re-priced on the server
// (lib/server/pricing.js); the balance change, order and ledger entries are written
// in one transaction with the member row locked, so parallel checkouts can't
// overspend.
export default apiHandler({
  POST: async (req, res) => {
    const member = await requireUser(req);
    const { method, items: lines, accountId } = req.body || {};
    if (accountId !== undefined && accountId !== member.id) {
      throw new HttpError(409, "You're logged in as someone else now. Please check out again.", {
        code: "session_changed"
      });
    }
    if (method !== "credits" && method !== "card") {
      throw new HttpError(400, "Choose to pay by card or with credits.");
    }
    const items = await priceLines(lines);
    if (method === "credits") {
      const blocked = items.find((item) => item.credits == null);
      if (blocked) throw new HttpError(400, `${blocked.name} can't be paid with credits.`);
    } else {
      const blocked = items.find((item) => item.price == null);
      if (blocked) throw new HttpError(400, `${blocked.name} can only be paid with credits.`);
    }
    const totals = cartTotals(items);
    const spent = method === "credits" ? totals.credits : 0;
    const totalUsd = method === "card" ? totals.cents / 100 : 0;
    const granted = items.reduce((sum, item) => sum + (item.grantsCredits || 0) * item.qty, 0);
    const pointsEarned = pointsFor(method, totals);
    const orderId = newOrderId();

    const { order, user } = await withTransaction(async (client) => {
      const {
        rows: [locked]
      } = await client.query("select * from users where id = $1 for update", [member.id]);
      if (!locked || locked.status !== "active") {
        throw new HttpError(403, "This account can't make purchases.");
      }
      if (spent > locked.credits) {
        throw new HttpError(409, "You don't have enough credits for this purchase.", {
          code: "insufficient_credits",
          credits: locked.credits
        });
      }
      const afterSpend = locked.credits - spent;
      const balance = afterSpend + granted;
      const {
        rows: [order]
      } = await client.query(
        `insert into orders (id, user_id, method, items, total_usd, total_credits,
                             credits_granted, points_earned)
         values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
        [
          orderId,
          locked.id,
          method,
          JSON.stringify(items),
          totalUsd.toFixed(2),
          spent,
          granted,
          pointsEarned
        ]
      );
      const {
        rows: [user]
      } = await client.query(
        "update users set credits = $2, points = points + $3 where id = $1 returning *",
        [locked.id, balance, pointsEarned]
      );
      if (spent) {
        await client.query(
          `insert into credit_ledger (user_id, delta, balance_after, reason, order_id, note)
           values ($1, $2, $3, 'order', $4, $5)`,
          [locked.id, -spent, afterSpend, orderId, `Order ${orderId}`]
        );
      }
      if (granted) {
        await client.query(
          `insert into credit_ledger (user_id, delta, balance_after, reason, order_id, note)
           values ($1, $2, $3, 'credit_pack', $4, $5)`,
          [locked.id, granted, balance, orderId, `Credit pack, order ${orderId}`]
        );
      }
      return { order, user };
    });
    res.status(201).json({ purchase: orderToPurchase(order), user: publicUser(user) });
  }
});
