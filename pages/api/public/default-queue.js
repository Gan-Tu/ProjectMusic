import { apiHandler } from "../../../lib/server/http";
import { getDefaultQueue } from "../../../lib/server/content";

// GET /api/public/default-queue -> { tracks }: what the player holds before the
// listener picks anything (see lib/player.js).
export default apiHandler({
  GET: async (req, res) => {
    const tracks = await getDefaultQueue();
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    res.json({ tracks });
  }
});
