import { apiHandler, HttpError } from "../../../../lib/server/http";
import { getAlbum } from "../../../../lib/server/content";

// GET /api/public/albums/<id> -> { album, tracks }: a published album's full tracklist,
// for play queues built on demand (album grids ship only each album's first track).
export default apiHandler({
  GET: async (req, res) => {
    const album = await getAlbum(String(req.query.id || ""));
    if (!album) throw new HttpError(404, "Album not found.");
    const { tracks, ...summary } = album;
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    res.json({ album: summary, tracks });
  }
});
