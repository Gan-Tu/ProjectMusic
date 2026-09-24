import { apiHandler, HttpError, requireAdmin, str } from "../../../../../lib/server/http";
import { withTransaction } from "../../../../../lib/server/db";
import { audit } from "../../../../../lib/server/crm/engine";
import { pathsForChange, revalidatePaths } from "../../../../../lib/server/revalidate";

// POST { eventId, action: "add" | "remove" }: puts the artist on (the end of) an
// event's line-up, or takes them off it.
export default apiHandler({
  POST: async (req, res) => {
    const admin = await requireAdmin(req);
    const artistId = str(req.query.id, { max: 200, required: true, field: "Artist" });
    const eventId = str(req.body?.eventId, { max: 200, required: true, field: "Event" });
    const action = req.body?.action;
    if (action !== "add" && action !== "remove") throw new HttpError(400, "Unknown action.");
    await withTransaction(async (client) => {
      const q = async (text, params) => (await client.query(text, params)).rows;
      const [event] = await q("select id from events where id = $1", [eventId]);
      const [artist] = await q("select id from artists where id = $1", [artistId]);
      if (!event || !artist) throw new HttpError(404, "Event or artist not found.");
      if (action === "add") {
        await q(
          `insert into event_lineup (event_id, artist_id, position)
           values ($1, $2, coalesce((select max(position) + 1 from event_lineup where event_id = $1), 0))
           on conflict do nothing`,
          [eventId, artistId]
        );
      } else {
        await q("delete from event_lineup where event_id = $1 and artist_id = $2", [
          eventId,
          artistId
        ]);
      }
      await audit(q, admin, action === "add" ? "lineup_add" : "lineup_remove", "events", eventId, {
        artist: artistId
      });
    });
    const paths = await pathsForChange("events", { id: eventId, lineup: [artistId] });
    res.json({ ok: true, revalidation: await revalidatePaths(res, paths) });
  }
});
