import { apiHandler } from "../../../../lib/server/http";
import { listAlbums } from "../../../../lib/server/content";

// GET /api/public/albums -> { albums: [{ id, tracks }] }: every track of the music
// catalog, for the /musics track list (its page props carry only the first tracks).
// Tracks leave out what the page already has from the album (cover, album name, the
// artist when it's the album's).
export default apiHandler({
  GET: async (req, res) => {
    const albums = await listAlbums({ placement: "music", tracks: "all" });
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({
      albums: albums.map((album) => ({
        id: album.id,
        tracks: album.tracks.map(({ cover, albumId, albumName, artist, ...track }) =>
          artist === album.artist ? track : { ...track, artist }
        )
      }))
    });
  }
});
